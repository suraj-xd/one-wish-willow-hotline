import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import { getAIProviderConfig } from "@/env.mjs";
import { SYSTEM_PROMPT, RESURRECTED_NOTE } from "@/lib/prompt";
import { checkRateLimit, clientIp, isUnlimited } from "@/lib/ratelimit";

export const maxDuration = 30;

/**
 * AI_PROVIDER selects the backend:
 * - deepseek: api.deepseek.com directly
 * - openrouter: OpenRouter with reasoning disabled for fast V4 Flash replies
 */
function resolveModel() {
  const config = getAIProviderConfig();

  if (config.provider === "deepseek") {
    const deepseek = createDeepSeek({ apiKey: config.apiKey });
    return {
      model: deepseek(config.model),
      providerOptions: undefined,
    };
  }

  const openrouter = createOpenRouter({
    apiKey: config.apiKey,
  });
  return {
    model: openrouter(config.model),
    providerOptions: {
      openrouter: {
        reasoning: { effort: "none" },
      },
    },
  };
}

const MAX_PART_CHARS = 2_000;
const MAX_TOTAL_CHARS = 14_000;
/** History compaction: the opening exchange anchors the consultation… */
const KEEP_HEAD = 2;
/** …and the recent tail carries the live thread. The middle is expendable. */
const KEEP_TAIL = 18;

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        id: z.string().max(128).optional(),
        role: z.enum(["user", "assistant"]),
        parts: z
          .array(z.looseObject({ type: z.string(), text: z.string().optional() }))
          .max(20),
      }),
    )
    .min(1)
    .max(60),
});

function chars(m: UIMessage): number {
  return m.parts.reduce(
    (c, p) => c + (p.type === "text" ? p.text.length : 0),
    0,
  );
}

/**
 * Head-and-tail compaction for long consultations: keep the opening exchange
 * (the original wish) and the recent tail, drop the middle, then shrink the
 * tail's oldest entries until the char budget fits. The boundary is snapped
 * to a user message so roles keep alternating after the cut.
 */
function compactHistory(msgs: UIMessage[]): UIMessage[] {
  let head: UIMessage[] = [];
  let tail = [...msgs];

  if (msgs.length > KEEP_HEAD + KEEP_TAIL) {
    head = msgs.slice(0, KEEP_HEAD);
    tail = msgs.slice(-KEEP_TAIL);
  }

  const fits = () =>
    [...head, ...tail].reduce((n, m) => n + chars(m), 0) <= MAX_TOTAL_CHARS;
  while (!fits() && tail.length > 1) tail.shift();
  if (!fits()) head = [];

  // Snap the seam: after any cut, the tail must open on a user turn.
  if (head.length || tail.length < msgs.length) {
    while (tail.length > 1 && tail[0]!.role !== "user") tail.shift();
  }
  return [...head, ...tail];
}

function inCharacterError(status: number, message: string, retryAfter?: number) {
  return Response.json(
    { error: true, message },
    {
      status,
      headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined,
    },
  );
}

export async function POST(req: Request) {
  try {
    // Same-origin only: this line answers calls from its own storefront.
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (
      process.env.NODE_ENV === "production" &&
      origin &&
      host &&
      new URL(origin).host !== host
    ) {
      return inCharacterError(403, "this line doesn't take outside calls.");
    }

    const raw = await req.text();
    if (raw.length > 64_000) {
      return inCharacterError(413, "that's too much wish for one message, man.");
    }

    const parsed = bodySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return inCharacterError(400, "the line couldn't make out what you said.");
    }

    // Text parts only, clamped — strip anything exotic a caller might inject.
    const cleaned: UIMessage[] = parsed.data.messages
      .map((m, i) => ({
        id: m.id ?? `m-${i}`,
        role: m.role,
        parts: m.parts
          .filter((p) => p.type === "text" && typeof p.text === "string")
          .map((p) => ({
            type: "text" as const,
            text: (p.text as string).slice(0, MAX_PART_CHARS),
          })),
      }))
      .filter((m) => m.parts.length > 0);

    const sanitized = compactHistory(cleaned);

    const last = sanitized[sanitized.length - 1];
    if (!last || last.role !== "user") {
      return inCharacterError(400, "say something and the line will answer.");
    }

    const unlimited = isUnlimited();
    const verdict = unlimited
      ? ({ ok: true, messagesLeft: -1 } as const)
      : await checkRateLimit(clientIp(req));
    if (!verdict.ok) {
      return inCharacterError(verdict.status, verdict.message, verdict.retryAfter);
    }

    const resurrected = req.headers.get("x-oww-resurrected") === "1";
    const system = resurrected ? SYSTEM_PROMPT + RESURRECTED_NOTE : SYSTEM_PROMPT;
    const modelConfig = resolveModel();

    const result = streamText({
      ...modelConfig,
      system,
      messages: await convertToModelMessages(sanitized),
      temperature: 0.85,
      maxOutputTokens: 600,
      abortSignal: req.signal,
      onError: ({ error }) => console.error("[oww] stream error:", error),
    });

    const headers: Record<string, string> = {
      "x-oww-messages-left": unlimited ? "inf" : String(verdict.messagesLeft),
    };

    return result.toUIMessageStreamResponse({
      headers,
      onError: () =>
        "the line went quiet for a second there. ask again — the willow is listening.",
    });
  } catch (err) {
    console.error("[oww] route error:", err);
    return inCharacterError(
      500,
      "something rattled the line. give it a moment and try again.",
    );
  }
}
