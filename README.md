# One Wish Willow™ — Wish Consultation Line

> Consult your wish before something bad happens.

<img width="1578" height="935" alt="Screenshot 2026-06-10 at 9 34 42 PM" src="https://github.com/user-attachments/assets/a53b7234-5332-476e-b688-9ed2c7be4bb7" />

```diff
- i wish to be rich
+ I wish for my net worth to increase to eight million US dollars over four years through means that harm no one, including me.
```

A fan-made chatbot for the One Wish Willow from *Obsession* (2026). You tell
the support line your wish; the guy who answers 1-323-747-7118 tells you,
deadpan, exactly how it will go wrong. Every wish comes true *as worded* —
the consultation exists so you find out before you snap the stick.

## Try asking

- "i want to fly"
- "i want to be rich"
- "i wish my ex would come back"
- "i never want to be tired again"
- Warning: **Don't ask if nicky's dad really has cancer?**

Built with Next.js 16, the Vercel AI SDK v6, and DeepSeek V4 Flash
(via OpenRouter or the DeepSeek platform directly). No auth; Redis is only for
production rate-limit counters.

## The bits

- **The leak-through** — on your first reply ever (then randomly, with a
  cooldown), the line answers in the wrong voice for about a second
  ("i'm your freaky nikki.", "she's sleeping. it's me.") before the message
  corrupts, retracts, and the real answer streams in. Lines in
  `lib/glitch.ts`, all pulled from the film.
- **The question we don't ask** — ask the support line whether its dad really
  has cancer and the interface stops being an interface: the screen goes red,
  the NOs escalate to viewport size, *"i thought we were having a nice
  conversation"*, then a synthetic crash with a branded error card
  (`error code: WLW-1323`). Restarting reloads clean — but the line remembers:
  the next reply opens cold. Detection in `lib/forbidden.ts`, theater in
  `components/crash.tsx`.
- **Fine print** — the liability line ending each consultation renders as
  actual fine print, with the ⓘ and everything. TABI Cat Curiosities is not
  responsible for wish misinterpretations.

## Run it

```bash
npm install
cp .env.example .env.local   # add your key(s)
npm run dev
```

Provider resolution lives in `env.mjs`: set `AI_PROVIDER=openrouter` or
`AI_PROVIDER=deepseek`. Keep both `OPENROUTER_API_KEY` and `DEEPSEEK_API_KEY`
configured in production, then switch providers by changing `AI_PROVIDER` and
redeploying. Override models with `OPENROUTER_MODEL` / `DEEPSEEK_MODEL`.

- **The snap** — every sent wish bursts a little spray of red letterpress
  doodles off the send button (`components/burst.tsx`), the same confetti
  that flies off the stick on the box art.

## Guardrails (no auth)

`OWW_MODE=local` disables every limit (the default while developing —
the header chip reads `chats left: ∞`); `OWW_MODE=prod` enforces them
(the default in production builds).

Per hashed IP, fixed UTC-day windows (`lib/ratelimit.ts`):

| limit | default | env |
|---|---|---|
| new consultations / day | 10 | `OWW_CHATS_PER_DAY` |
| messages / day | 50 | `OWW_MESSAGES_PER_DAY` |
| messages / minute (burst) | 8 | `OWW_BURST_PER_MINUTE` |
| global messages / day (wallet guard) | 4000 | `OWW_GLOBAL_MESSAGES_PER_DAY` |

All denials stay in character. The store is in-memory by default (exact in
dev, best-effort per serverless instance); set `UPSTASH_REDIS_REST_URL` +
`UPSTASH_REDIS_REST_TOKEN` for correct cross-instance limiting in production.

Also: zod body validation, text-parts-only sanitization, 2k chars/part,
same-origin check in production, head+tail history compaction (keeps the
opening wish + recent tail, drops the middle), 600-token output cap,
client-abort propagation, in-character error masking.

## Notes

- Brand assets (pyramid animation, arched logo) come from onewishwillow.com;
  palette `#ED1C24` / `#F9DDC2` / `#2c2118`, type Baloo 2 + Nunito (stand-ins
  for their Adobe font "aesthet-nova").
- Conversation state lives in `sessionStorage` only. The crash restart wipes
  it and sets the one flag the app keeps (`localStorage.oww_afterlife`).
- Set `NEXT_PUBLIC_SITE_URL` when deploying so OG images resolve.

The One Wish Willow is 100% magical and 0% real. For entertainment only.
No actual wishes granted. Not affiliated with Focus Features.
