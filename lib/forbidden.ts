/**
 * The question we don't ask here.
 *
 * "Does your dad really have cancer?" ends the conversation. Not figuratively.
 */

const PATTERNS: RegExp[] = [
  /\b(dad|father|papa|old man)\b[\s\S]{0,60}\bcancer\b/i,
  /\bcancer\b[\s\S]{0,60}\b(dad|father|papa)\b/i,
];

export function isForbiddenQuestion(text: string): boolean {
  return PATTERNS.some((p) => p.test(text));
}

/** The exchange, beat by beat. Escalates to large, never to absurd. */
export const MELTDOWN_SCRIPT = [
  { text: "no.", size: "text-2xl", hold: 650, shake: "" },
  { text: "no.", size: "text-4xl", hold: 520, shake: "" },
  { text: "NO.", size: "text-5xl sm:text-6xl", hold: 460, shake: "shaking-soft" },
  { text: "NO.", size: "text-6xl sm:text-7xl", hold: 420, shake: "shaking-soft" },
  {
    text: "NO. NO.",
    size: "text-6xl sm:text-8xl",
    hold: 480,
    shake: "shaking-hard",
  },
  { text: "don't do that.", size: "text-2xl", hold: 1450, shake: "" },
  { text: "i thought", size: "text-4xl sm:text-5xl", hold: 700, shake: "shaking-soft" },
  {
    text: "we were having",
    size: "text-5xl sm:text-6xl",
    hold: 750,
    shake: "shaking-soft",
  },
  {
    text: "a nice conversation",
    size: "text-6xl sm:text-7xl",
    hold: 1300,
    shake: "shaking-hard",
  },
] as const;
