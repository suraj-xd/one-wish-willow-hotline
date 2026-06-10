/** Empty-state eye doodles from the storefront's magic-trick framing. */

function Eye({ className, delay }: { className: string; delay: string }) {
  return (
    <svg
      viewBox="0 0 28 18"
      aria-hidden
      className={`doodle absolute ${className}`}
      style={{ animationDelay: delay }}
      fill="none"
      stroke="var(--color-brand)"
      strokeWidth="2"
    >
      <path d="M1.5 9C5 3 9.5 1.5 14 1.5S23 3 26.5 9C23 15 18.5 16.5 14 16.5S5 15 1.5 9Z" />
      <circle cx="14" cy="9" r="3.4" fill="var(--color-brand)" />
    </svg>
  );
}

export function Doodles() {
  return (
    <div className="pointer-events-none absolute inset-0 select-none" aria-hidden>
      <Eye className="right-[10%] top-[22%] w-7 opacity-70" delay="0.9s" />
      <Eye className="bottom-[24%] left-[16%] w-4 opacity-60" delay="1.7s" />
      <Eye className="left-[10%] top-[64%] w-8 opacity-70" delay="1.5s" />
    </div>
  );
}
