"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { MELTDOWN_SCRIPT } from "@/lib/forbidden";
import {
  crashStatic,
  rumbleTo,
  startRumble,
  stopMeltdownAudio,
  thud,
} from "@/lib/sound";

type Stage = { kind: "line"; idx: number } | { kind: "flash" } | { kind: "dead" };

function buzz(pattern: number | number[]): void {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    navigator.vibrate?.(pattern);
  } catch {
    /* no haptics here */
  }
}

/** Per-beat sound + haptics. The quiet beat is index 5: "don't do that." */
function playBeat(idx: number): void {
  const intensity = Math.min(1, 0.25 + idx * 0.09);
  if (idx === 0) startRumble();
  if (idx === 5) {
    rumbleTo(0.012, 0.25); // sudden near-silence — the dread beat
    return;
  }
  if (idx === 6) rumbleTo(0.14, 0.4); // and it all comes back
  if (idx === MELTDOWN_SCRIPT.length - 1) {
    rumbleTo(0.22, 1.1);
    buzz([80, 50, 80, 50, 140]);
  } else if (idx === 4) {
    thud(intensity);
    setTimeout(() => thud(intensity), 150); // "NO. NO." hits twice
    buzz([70, 60, 70]);
  } else {
    buzz(35 + idx * 14);
  }
  thud(intensity);
}

/**
 * The forbidden question. The interface stops being an interface.
 * Beat-for-beat from the cafe scene — then a synthetic crash.
 */
export function CrashTakeover({ onRestart }: { onRestart: () => void }) {
  const [stage, setStage] = useState<Stage>({ kind: "line", idx: 0 });

  useEffect(() => {
    if (stage.kind === "line") {
      const beat = MELTDOWN_SCRIPT[stage.idx];
      playBeat(stage.idx);
      const t = setTimeout(() => {
        setStage(
          stage.idx + 1 < MELTDOWN_SCRIPT.length
            ? { kind: "line", idx: stage.idx + 1 }
            : { kind: "flash" },
        );
      }, beat.hold);
      return () => clearTimeout(t);
    }
    if (stage.kind === "flash") {
      crashStatic();
      buzz(250);
      const t = setTimeout(() => setStage({ kind: "dead" }), 420);
      return () => clearTimeout(t);
    }
    if (stage.kind === "dead") {
      stopMeltdownAudio();
    }
  }, [stage]);

  // If the component dies before the sequence does, kill the audio with it.
  useEffect(() => () => stopMeltdownAudio(), []);

  if (stage.kind === "dead") {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-brand-deep/85 px-6 backdrop-blur-md">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl border-[3px] border-brand bg-cream-bright px-8 py-9 text-center shadow-[0_18px_50px_rgba(60,0,0,0.45)]">
          {/* the interface died; the pyramid keeps turning */}
          <Image
            src="/pyramid.gif"
            alt=""
            width={96}
            height={96}
            unoptimized
            className="drop-shadow-[0_3px_4px_rgba(139,0,0,0.25)]"
          />
          <h1 className="font-display text-3xl font-extrabold uppercase leading-none tracking-tight text-brand">
            Something
            <br />
            went wrong.
          </h1>
          <p className="text-sm font-semibold leading-snug text-ink-soft">
            The conversation ended unexpectedly
            <br />
            and could not be recovered.
          </p>
          <p className="font-mono text-[11px] tracking-wide text-brand-deep/70">
            error code: WLW-1323
          </p>
          <button
            autoFocus
            onClick={onRestart}
            className="mt-1 rounded-full bg-brand px-6 py-2.5 font-display text-sm font-extrabold uppercase tracking-wide text-cream-bright shadow-[0_4px_0_rgba(139,0,0,0.5)] outline-none transition-all focus-visible:ring-4 focus-visible:ring-brand-dark/45 hover:translate-y-[1px] hover:bg-brand-deep hover:shadow-[0_3px_0_rgba(80,0,0,0.5)]"
          >
            Restart conversation
          </button>
          <a
            href="https://www.onewishwillow.com/"
            className="text-xs font-bold text-brand-deep/70 underline underline-offset-2 hover:text-brand-deep"
          >
            or visit onewishwillow.com
          </a>
        </div>
        <p
          aria-hidden
          className="fixed bottom-4 select-none text-[10px] tracking-[0.2em] text-cream-bright/35"
        >
          we are. we are.
        </p>
      </div>
    );
  }

  if (stage.kind === "flash") {
    return (
      <div className="fixed inset-0 z-[100] bg-brand">
        <div className="flash absolute inset-0 bg-white" />
      </div>
    );
  }

  const beat = MELTDOWN_SCRIPT[stage.idx];
  return (
    <div
      role="alert"
      className="crash-overlay fixed inset-0 z-[100] flex items-center justify-center overflow-hidden px-4"
    >
      <div
        key={stage.idx}
        className={`no-pop ${beat.shake} text-center font-display font-extrabold leading-none text-cream-bright ${beat.size}`}
      >
        {beat.text}
      </div>
    </div>
  );
}
