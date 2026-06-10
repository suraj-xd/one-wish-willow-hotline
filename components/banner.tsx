import Image from "next/image";

/** The red strip from the storefront, scaled down to a chat footer. */
export function HelpBanner() {
  return (
    <footer className="shrink-0">
      <p className="px-4 pb-1.5 text-center text-[10px] leading-tight text-ink-soft/80">
        The One Wish Willow™ is 100% magical and 0% real. For entertainment
        only. No actual wishes consulted, granted, or survived. A fan project —
        not affiliated with Focus Features.
      </p>
      <div className="flex items-center justify-center gap-3 bg-brand px-4 py-2 sm:gap-5">
        <span className="font-display text-[13px] font-extrabold uppercase leading-[1.05] tracking-wide text-cream-bright sm:text-sm">
          Need help?
          <br />
          Call today!
        </span>
        <Image
          src="/pyramid-still.png"
          alt="One Wish Willow pyramid logo"
          width={40}
          height={40}
          className="rotate-[8deg] drop-shadow-[0_2px_2px_rgba(139,0,0,0.5)]"
        />
        <a
          href="tel:1-323-747-7118"
          className="font-display text-xl font-extrabold tracking-wide text-cream-bright transition-transform hover:scale-[1.03] sm:text-2xl"
        >
          1-323-747-7118
        </a>
      </div>
    </footer>
  );
}
