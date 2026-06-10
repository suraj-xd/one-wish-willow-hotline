"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { isForbiddenQuestion } from "@/lib/forbidden";
import { planLeak, recordReply } from "@/lib/glitch";
import { armMeltdownAudio } from "@/lib/sound";
import { HelpBanner } from "./banner";
import { CrackBurst } from "./burst";
import { CrashTakeover } from "./crash";
import { Doodles } from "./doodles";
import { GlitchedMessage } from "./glitch";
import { ThinkingIndicator } from "./thinking";
import { textOf, UserBubble, WillowLabel, WillowProse } from "./messages";

const SESSION_KEY = "oww_session_v1";
const AFTERLIFE_KEY = "oww_afterlife";
const MAX_INPUT = 600;

const EXAMPLE_WISHES = [
  "i want to be rich",
  "i wish my ex would come back",
  "i never want to be tired again",
  "i want everyone to like me",
];

function loadSession(): UIMessage[] {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    const parsed = raw ? (JSON.parse(raw) as UIMessage[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function WishChat() {
  const [input, setInput] = useState("");
  const [leak, setLeak] = useState<{ line: string } | null>(null);
  const [crash, setCrash] = useState<null | "arming" | "active">(null);
  const [burst, setBurst] = useState<number | null>(null);
  const [wishesLeft, setWishesLeft] = useState<string | null>(null);
  const resurrected = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: (): Record<string, string> =>
          resurrected.current ? { "x-oww-resurrected": "1" } : {},
        fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
          const res = await fetch(input, init);
          const w = res.headers.get("x-oww-wishes-left");
          if (w !== null) setWishesLeft(w);
          if (!res.ok) {
            let message = "the line went dead for a moment. try again.";
            try {
              const data = (await res.json()) as { message?: string };
              if (data?.message) message = data.message;
            } catch {
              /* keep fallback */
            }
            throw new Error(message);
          }
          return res;
        }) as typeof fetch,
      }),
    [],
  );

  const { messages, sendMessage, status, stop, error, regenerate, setMessages, clearError } =
    useChat({ transport });
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // Restore this tab's conversation; check whether we died last time.
  useEffect(() => {
    const saved = loadSession();
    if (saved.length) setMessages(saved);
    if (window.localStorage.getItem(AFTERLIFE_KEY) === "1") {
      resurrected.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
    } catch {
      /* storage full or blocked — the willow forgets */
    }
  }, [messages]);

  // Count finished replies (feeds leak cooldown); clear the afterlife flag
  // once the cold re-greeting has been delivered.
  const prevStatus = useRef(status);
  useEffect(() => {
    if (prevStatus.current === "streaming" && status === "ready") {
      recordReply();
      if (resurrected.current) {
        resurrected.current = false;
        window.localStorage.removeItem(AFTERLIFE_KEY);
      }
    }
    prevStatus.current = status;
  }, [status]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status, crash]);

  const submitText = useCallback(
    (raw: string) => {
      const text = raw.trim().slice(0, MAX_INPUT);
      if (!text || status === "streaming" || status === "submitted") return;
      if (messagesRef.current.length >= 36) return;
      setInput("");
      setBurst(Date.now()); // snap the stick

      if (isForbiddenQuestion(text)) {
        // Unlock audio while we're still inside the user's keystroke,
        // or the browser will mute the whole performance.
        armMeltdownAudio();
        setMessages((prev) => [
          ...prev,
          {
            id: `forbidden-${Date.now()}`,
            role: "user" as const,
            parts: [{ type: "text" as const, text }],
          },
        ]);
        setCrash("arming");
        // Let it pretend to think about it. That's the cruel part.
        window.setTimeout(() => setCrash("active"), 1400);
        return;
      }

      const line = planLeak();
      setLeak(line ? { line } : null);
      void sendMessage({ text });
    },
    [status, sendMessage, setMessages],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitText(input);
  };

  const newWish = () => {
    stop();
    clearError();
    setMessages([]);
    setLeak(null);
    window.sessionStorage.removeItem(SESSION_KEY);
    inputRef.current?.focus();
  };

  const restartAfterCrash = () => {
    window.sessionStorage.removeItem(SESSION_KEY);
    window.localStorage.setItem(AFTERLIFE_KEY, "1");
    window.location.reload();
  };

  // A planned leak gates whichever assistant message answers it; a failed
  // request shouldn't leave the gate armed for some later reply.
  useEffect(() => {
    if (status === "error") setLeak(null);
  }, [status]);

  const empty = messages.length === 0;
  const busy = status === "submitted" || status === "streaming";
  // Past this point the middle of the conversation gets compacted server-side
  // anyway — nudge the caller toward a fresh consultation instead.
  const exhausted = messages.length >= 36;

  return (
    <div className="flex h-dvh flex-col">
      {crash === "active" && <CrashTakeover onRestart={restartAfterCrash} />}

      {/* header */}
      <header className="shrink-0 border-b-2 border-brand/15">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-arch.png"
              alt="One Wish Willow"
              width={108}
              height={25}
              priority
            />
            {/*<span className="mt-0.5 hidden font-display text-[10px] font-bold uppercase tracking-[0.22em] text-ink-soft sm:block">
              wish consultation line
            </span>*/}
          </div>
          <div className="flex items-center gap-2">
            {wishesLeft !== null && (
              <span
                className="rounded-full border border-brand/30 bg-cream-bright px-2.5 py-1 font-display text-[11px] font-bold text-brand-deep"
                title="New consultations left today"
              >
                wishes left: {wishesLeft === "inf" ? "∞" : wishesLeft}
              </span>
            )}
            {!empty && (
              <button
                onClick={newWish}
                className="rounded-full border-2 border-brand px-3 py-1 font-display text-xs font-extrabold uppercase tracking-wide text-brand transition-colors hover:bg-brand hover:text-cream-bright"
              >
                new wish
              </button>
            )}
          </div>
        </div>
      </header>

      {/* conversation */}
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto">
        {empty ? (
          <div className="relative mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-6 text-center">
            <Doodles />
            <Image
              src="/pyramid.gif"
              alt="Rotating One Wish Willow pyramid"
              width={120}
              height={120}
              unoptimized
              priority
              className="pyramid-bob rise mb-5"
            />
            <h1
              className="rise font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-brand sm:text-5xl"
              style={{ animationDelay: "0.08s" }}
            >
              What are you
              <br />
              wishing for?
            </h1>
            <p
              className="rise mt-4 max-w-md text-[15px] font-semibold text-ink-soft"
              style={{ animationDelay: "0.16s" }}
            >
              Every wish comes true <em>exactly as worded</em>. Consult yours
              before something bad happens — free, 24/7, mostly confidential.
            </p>
            <div
              className="rise mt-7 flex flex-wrap items-center justify-center gap-2"
              style={{ animationDelay: "0.24s" }}
            >
              {EXAMPLE_WISHES.map((w) => (
                <button
                  key={w}
                  onClick={() => submitText(w)}
                  className="rounded-full border-2 border-brand/70 bg-cream-bright px-3.5 py-1.5 font-display text-[13px] font-bold text-brand-deep transition-all hover:-translate-y-0.5 hover:bg-brand hover:text-cream-bright"
                >
                  {w}
                </button>
              ))}
            </div>
            <Image
              src="/crack.png"
              alt=""
              width={330}
              height={111}
              className="rise mt-8 opacity-85 select-none"
              style={{ animationDelay: "0.32s" }}
            />
          </div>
        ) : (
          <div
            className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6"
            aria-live="polite"
          >
            {messages.map((m, i) =>
              m.role === "user" ? (
                <UserBubble key={m.id} text={textOf(m)} />
              ) : (
                <div key={m.id} className="max-w-[95%]">
                  <WillowLabel />
                  {leak && i === messages.length - 1 ? (
                    <GlitchedMessage
                      leakLine={leak.line}
                      onDone={() => setLeak(null)}
                    >
                      <WillowProse text={textOf(m)} />
                    </GlitchedMessage>
                  ) : (
                    <WillowProse text={textOf(m)} />
                  )}
                </div>
              ),
            )}

            {(status === "submitted" || crash === "arming") && (
              <ThinkingIndicator />
            )}

            {error && status !== "submitted" && status !== "streaming" && (
              <div className="max-w-[95%]">
                <WillowLabel />
                <p className="leading-relaxed text-brand-deep">
                  {error.message}
                </p>
                <button
                  onClick={() => {
                    clearError();
                    void regenerate();
                  }}
                  className="mt-1.5 rounded-full border-2 border-brand px-3 py-1 font-display text-xs font-extrabold uppercase text-brand transition-colors hover:bg-brand hover:text-cream-bright"
                >
                  call again
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* input */}
      <div className="shrink-0 px-4 pb-2 pt-1">
        {exhausted && (
          <p className="mx-auto mb-1.5 max-w-2xl text-center font-display text-xs font-bold text-brand-deep">
            this consultation has run long. the willow remembers how it started
            and how it's going — little else. open a{" "}
            <button onClick={newWish} className="underline underline-offset-2">
              new wish
            </button>
            .
          </p>
        )}
        <form
          onSubmit={onSubmit}
          className="mx-auto flex w-full max-w-2xl items-end gap-2 rounded-3xl border-2 border-brand/25 bg-cream-bright px-4 py-2.5 shadow-[0_8px_24px_rgba(107,24,3,0.12)] transition-colors focus-within:border-brand/70"
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            maxLength={MAX_INPUT}
            disabled={exhausted}
            placeholder={
              exhausted
                ? "the line for this wish has closed…"
                : "type your wish carefully…"
            }
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submitText(input);
              }
            }}
            className="max-h-[120px] flex-1 resize-none bg-transparent py-1 font-semibold text-ink outline-none placeholder:text-ink-soft/60"
            aria-label="Your wish"
          />
          {input.length > MAX_INPUT - 100 && (
            <span className="pb-1 text-[11px] font-bold text-brand-deep">
              {MAX_INPUT - input.length}
            </span>
          )}
          <span className="relative shrink-0">
            {burst !== null && (
              <CrackBurst key={burst} onEnd={() => setBurst(null)} />
            )}
            {busy ? (
              <button
                type="button"
                onClick={() => stop()}
                aria-label="Stop the reply"
                className="grid size-10 place-items-center rounded-full bg-ink/80 text-cream-bright transition-colors hover:bg-ink"
              >
                <span className="block size-3 bg-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send your wish"
                className="grid size-10 place-items-center rounded-full bg-brand text-cream-bright transition-all enabled:hover:scale-105 enabled:hover:bg-brand-deep disabled:opacity-35"
              >
                <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
                  <path d="M12 2 23 22H1L12 2Z" />
                </svg>
              </button>
            )}
          </span>
        </form>
      </div>

      <HelpBanner />
    </div>
  );
}
