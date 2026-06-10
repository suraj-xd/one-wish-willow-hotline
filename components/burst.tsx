"use client";

import { useEffect, useMemo } from "react";

/**
 * The snap. Sending a wish breaks the stick — a little spray of the red
 * letterpress doodles from the box art bursts off the send button.
 */

const PATHS = [
  // four-point sparkle
  "M12 0c.9 6.3 2.7 9.3 12 12-9.3 2.7-11.1 5.7-12 12-.9-6.3-2.7-9.3-12-12C9.3 9.3 11.1 6.3 12 0Z",
  // heart
  "M12 21S3 14.4 3 8.6C3 5.5 5.4 3 8.4 3c1.9 0 3.1 1 3.6 2 .5-1 1.7-2 3.6-2 3 0 5.4 2.5 5.4 5.6C21 14.4 12 21 12 21Z",
  // tiny triangle, of course
  "M12 2 23 22H1L12 2Z",
];

type Particle = {
  dx: number;
  dy: number;
  rot: number;
  size: number;
  delay: number;
  path: string;
};

export function CrackBurst({ onEnd }: { onEnd: () => void }) {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const angle =
          (i / 10) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
        const dist = 34 + Math.random() * 38;
        return {
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          rot: (Math.random() - 0.5) * 240,
          size: 7 + Math.random() * 7,
          delay: Math.random() * 60,
          path: PATHS[i % PATHS.length]!,
        };
      }),
    [],
  );

  useEffect(() => {
    const t = setTimeout(onEnd, 750);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span
      aria-hidden
      className="crack-burst pointer-events-none absolute left-1/2 top-1/2 z-10"
    >
      {particles.map((p, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="crack-fly absolute fill-brand"
          style={
            {
              width: p.size,
              height: p.size,
              marginLeft: -p.size / 2,
              marginTop: -p.size / 2,
              animationDelay: `${p.delay}ms`,
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              "--rot": `${p.rot}deg`,
            } as React.CSSProperties
          }
        >
          <path d={p.path} />
        </svg>
      ))}
    </span>
  );
}
