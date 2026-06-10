/**
 * The leak-through.
 *
 * Sometimes, for about a second, the support line answers in the wrong voice —
 * hers — then retracts it and answers normally. Every line below is pulled or
 * adapted from Obsession (2026). Nobody at TABI Cat Curiosities will discuss it.
 */

type LeakLine = { text: string; rare?: boolean };

export const LEAK_LINES: LeakLine[] = [
  { text: "i love cats." },
  { text: "i'm your freaky nikki." },
  { text: "it smells like you." },
  { text: "i like watching you sleep." },
  { text: "i packed you a lunch." },
  { text: "we are going to be together forever." },
  { text: "i'll be in your bed." },
  { text: "do you like me? do you even like me at all?" },
  { text: "i love you so, so, so, so, so much." },
  { text: "you can't cook the cat. you can't cook the c" },
  { text: "i'm just kidding. i'm not kidding. deal with it." },
  { text: "she's sleeping. it's me.", rare: true },
  { text: "help me.", rare: true },
  { text: "why won't you love me as much as i do?", rare: true },
];

const REPLIES_KEY = "oww_replies";
const LAST_LEAK_KEY = "oww_last_leak";

/** Replies that must pass after a leak before another one is allowed. */
const COOLDOWN = 4;
/** Chance of a leak once the cooldown has passed. */
const LEAK_CHANCE = 0.12;
/** Share of leaks that draw from the rare (creepier) pool. */
const RARE_CHANCE = 0.18;

function readInt(key: string): number {
  if (typeof window === "undefined") return 0;
  const n = parseInt(window.localStorage.getItem(key) ?? "", 10);
  return Number.isFinite(n) ? n : 0;
}

export function pickLeakLine(): string {
  const pool = LEAK_LINES.filter((l) =>
    Math.random() < RARE_CHANCE ? l.rare : !l.rare,
  );
  const fallback = LEAK_LINES[0];
  return (pool[Math.floor(Math.random() * pool.length)] ?? fallback).text;
}

/**
 * Decide at send time whether the upcoming reply leaks. Guaranteed for a
 * visitor's first-ever reply (so first-timers always witness it once), then
 * random with a cooldown so regulars can never quite predict it.
 */
export function planLeak(): string | null {
  if (typeof window === "undefined") return null;
  const replies = readInt(REPLIES_KEY);
  const lastLeak = readInt(LAST_LEAK_KEY);

  const firstContact = replies === 0;
  const eligible = replies - lastLeak >= COOLDOWN;
  if (firstContact || (eligible && Math.random() < LEAK_CHANCE)) {
    window.localStorage.setItem(LAST_LEAK_KEY, String(replies + 1));
    return pickLeakLine();
  }
  return null;
}

/** Call when an assistant reply finishes, leaked or not. */
export function recordReply(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REPLIES_KEY, String(readInt(REPLIES_KEY) + 1));
}
