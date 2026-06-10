"use client";

import type { UIMessage } from "ai";
import Image from "next/image";
import { useState, type ReactNode } from "react";

export function textOf(message: UIMessage): string {
  return message.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");
}

/**
 * Tiny markdown: **bold**, *italic*, ==red marker highlight==, "- " bullets.
 * No raw HTML ever.
 */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(==[^=]+==|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("=="))
      out.push(
        <mark key={`${keyBase}-${k++}`} className="oww-mark">
          {tok.slice(2, -2)}
        </mark>,
      );
    else if (tok.startsWith("**"))
      out.push(<strong key={`${keyBase}-${k++}`}>{tok.slice(2, -2)}</strong>);
    else out.push(<em key={`${keyBase}-${k++}`}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** "safer wording:" rendered like a snippet — this is the prompt you'd
 *  actually say to the stick, so it gets a card, the crack, and a copy button. */
function SaferWording({ text, lineKey }: { text: string; lineKey: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text.replace(/^["“]+|["”]+$/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — the willow keeps its secrets */
    }
  };

  return (
    <div className="my-2.5 overflow-hidden rounded-2xl border-2 border-brand/25 bg-cream-bright shadow-[0_3px_10px_rgba(107,24,3,0.07)]">
      <div className="flex items-center gap-2 border-b border-brand/15 px-3 py-1.5">
        <Image
          src="/crack-snap.png"
          alt=""
          width={34}
          height={24}
          className="h-6 w-auto select-none"
        />
        <span className="font-display text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
          safer wording
        </span>
        <button
          onClick={copy}
          className="ml-auto rounded-full px-2 py-0.5 font-display text-[10px] font-extrabold uppercase tracking-wide text-brand-deep/70 transition-colors hover:bg-brand hover:text-cream-bright"
        >
          {copied ? "copied." : "copy"}
        </button>
      </div>
      <p className="px-3.5 py-2.5 font-mono text-[13px] leading-relaxed text-ink">
        {inline(text, lineKey)}
      </p>
    </div>
  );
}

/** The liability line the company appends to every consultation. */
function isFinePrint(line: string): boolean {
  return (
    /^\*?(TABI Cat Curiosities|One Wish Willow)/i.test(line) &&
    /(not (responsible|liable)|own risk|no refunds|assume[s]? (all )?responsibility)/i.test(
      line,
    )
  );
}

const SAFER_RE = /^\*{0,2}safer wording:?\*{0,2}\s*/i;

export function WillowProse({ text }: { text: string }) {
  const lines = text.split("\n");
  const lastIdx = (() => {
    for (let i = lines.length - 1; i >= 0; i--)
      if (lines[i]!.trim() !== "") return i;
    return -1;
  })();

  const blocks: ReactNode[] = [];
  let bullets: ReactNode[] = [];
  // Key each <ul> by its FIRST bullet's line index. Keying by where the list
  // *ends* changes the key on every streamed token, remounting the list and
  // replaying every mark animation inside it.
  let bulletStart = -1;

  const flush = () => {
    if (bullets.length) {
      blocks.push(
        <ul key={`ul-${bulletStart}`} className="my-1.5 space-y-1">
          {bullets}
        </ul>,
      );
      bullets = [];
      bulletStart = -1;
    }
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      if (bulletStart === -1) bulletStart = i;
      bullets.push(
        <li key={`b-${i}`} className="flex gap-2">
          <span aria-hidden className="mt-[7px] inline-block size-[7px] shrink-0 rotate-0 bg-brand [clip-path:polygon(50%_0,100%_100%,0_100%)]" />
          <span>{inline(trimmed.slice(2), `bl-${i}`)}</span>
        </li>,
      );
    } else {
      flush();
      if (trimmed === "") return;
      if (SAFER_RE.test(trimmed)) {
        blocks.push(
          <SaferWording
            key={`sw-${i}`}
            lineKey={`swl-${i}`}
            text={trimmed.replace(SAFER_RE, "")}
          />,
        );
        return;
      }
      if (i === lastIdx && isFinePrint(trimmed)) {
        blocks.push(
          <p
            key={`fp-${i}`}
            className="mt-3 flex items-start gap-1.5 border-t border-ink/15 pt-2 text-[11px] font-medium leading-snug text-ink-soft/75"
          >
            <svg
              viewBox="0 0 16 16"
              aria-hidden
              className="mt-px size-3 shrink-0 fill-ink-soft/60"
            >
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 3.2a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm1.2 7.6H6.8v-1h.6V8.6h-.6v-1h1.8v3.2h.6v1Z" />
            </svg>
            <span>{inline(trimmed.replace(/^\*|\*$/g, ""), `fpl-${i}`)}</span>
          </p>,
        );
      } else {
        blocks.push(
          <p key={`p-${i}`} className="my-1.5">
            {inline(trimmed, `pl-${i}`)}
          </p>,
        );
      }
    }
  });
  flush();

  return <div className="leading-relaxed">{blocks}</div>;
}

export function WillowLabel() {
  return (
    <div className="mb-1 flex items-center gap-1.5">
      <span
        aria-hidden
        className="inline-block size-[9px] bg-brand [clip-path:polygon(50%_0,100%_100%,0_100%)]"
      />
      <span className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-brand">
        Willow Support™
      </span>
    </div>
  );
}

export function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-lg bg-brand px-4 py-2.5 font-semibold text-cream-bright shadow-[0_3px_0_rgba(139,0,0,0.35)]">
        {text}
      </div>
    </div>
  );
}
