"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const PHRASES = [
  "consulting the willow…",
  "checking the warnings on the box…",
  "pulling incident files…",
  "estimating collateral…",
  "reading the fine print out loud…",
  "asking the back room…",
  "she's— connecting you now…",
];

export function ThinkingIndicator() {
  const [i, setI] = useState(() => Math.floor(Math.random() * 5));

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % PHRASES.length), 1700);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-center gap-3 py-1" role="status" aria-label="Willow is thinking">
      <Image
        src="/pyramid.gif"
        alt=""
        width={38}
        height={38}
        unoptimized
        className="select-none"
      />
      <span className="font-display text-sm font-semibold text-brand-deep">
        {PHRASES[i]}
        <span className="tdot">.</span>
        <span className="tdot">.</span>
        <span className="tdot">.</span>
      </span>
    </div>
  );
}
