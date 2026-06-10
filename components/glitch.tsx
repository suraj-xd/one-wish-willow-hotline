"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Phase = "typing" | "holding" | "glitching" | "wiping" | "done";

/**
 * Gates an assistant message behind the leak-through: the wrong voice types a
 * line, holds for a breath, corrupts, gets retracted — then the real reply
 * (which has been streaming in the background all along) is revealed.
 */
export function GlitchedMessage({
  leakLine,
  onDone,
  children,
}: {
  leakLine: string;
  onDone: () => void;
  children: ReactNode;
}) {
  const [phase, setPhase] = useState<Phase>("typing");
  const [shown, setShown] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (phase === "typing") {
      if (shown >= leakLine.length) {
        const t = setTimeout(() => setPhase("holding"), 120);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setShown((n) => n + 1), 34);
      return () => clearTimeout(t);
    }
    if (phase === "holding") {
      const t = setTimeout(() => setPhase("glitching"), 800);
      return () => clearTimeout(t);
    }
    if (phase === "glitching") {
      const t = setTimeout(() => setPhase("wiping"), 340);
      return () => clearTimeout(t);
    }
    if (phase === "wiping") {
      const t = setTimeout(() => {
        setPhase("done");
        onDoneRef.current();
      }, 290);
      return () => clearTimeout(t);
    }
  }, [phase, shown, leakLine]);

  if (phase === "done") return <>{children}</>;

  return (
    <div
      aria-hidden
      className={
        phase === "glitching"
          ? "glitching font-semibold"
          : phase === "wiping"
            ? "scan-out glitch-leak font-semibold"
            : "glitch-leak caret font-semibold"
      }
    >
      {leakLine.slice(0, shown)}
    </div>
  );
}
