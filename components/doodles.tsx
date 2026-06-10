/** The scattered magic-trick doodles from the storefront's "AMAZE YOUR FRIENDS" frame. */

export function Sparkle({ className, delay }: { className: string; delay: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`doodle absolute fill-brand ${className}`}
      style={{ animationDelay: delay }}
    >
      <path d="M12 0c.9 6.3 2.7 9.3 12 12-9.3 2.7-11.1 5.7-12 12-.9-6.3-2.7-9.3-12-12C9.3 9.3 11.1 6.3 12 0Z" />
    </svg>
  );
}

export function Heart({ className, delay }: { className: string; delay: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`doodle absolute fill-brand ${className}`}
      style={{ animationDelay: delay }}
    >
      <path d="M12 21S3 14.4 3 8.6C3 5.5 5.4 3 8.4 3c1.9 0 3.1 1 3.6 2 .5-1 1.7-2 3.6-2 3 0 5.4 2.5 5.4 5.6C21 14.4 12 21 12 21Z" />
    </svg>
  );
}

export function Asterisk({ className, delay }: { className: string; delay: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`doodle absolute stroke-brand ${className}`}
      style={{ animationDelay: delay }}
      fill="none"
      strokeWidth="2.6"
      strokeLinecap="round"
    >
      <path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9 4.9 19.1" />
    </svg>
  );
}

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
      <Sparkle className="left-[8%] top-[14%] w-5 opacity-80" delay="0s" />
      <Sparkle className="right-[10%] top-[22%] w-7 opacity-70" delay="0.9s" />
      <Sparkle className="bottom-[24%] left-[16%] w-4 opacity-60" delay="1.7s" />
      <Heart className="right-[18%] top-[58%] w-5 opacity-70" delay="0.4s" />
      <Heart className="left-[24%] top-[30%] w-4 opacity-60" delay="2.1s" />
      <Asterisk className="right-[26%] top-[10%] w-5 opacity-70" delay="1.2s" />
      <Asterisk className="bottom-[16%] right-[8%] w-6 opacity-60" delay="2.6s" />
      <Eye className="left-[10%] top-[64%] w-8 opacity-70" delay="1.5s" />
    </div>
  );
}
