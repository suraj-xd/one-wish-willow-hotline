/**
 * No-auth rate limiting, keyed by hashed IP, with fixed UTC-day windows.
 *
 * One daily message limit, with two storage drivers:
 *  - Upstash Redis (REST) when UPSTASH_REDIS_REST_URL/TOKEN are set — correct
 *    across serverless instances; use this in production.
 *  - In-memory Map otherwise — exact in dev / single-process, best-effort on
 *    serverless (each warm instance counts separately).
 */

import { createHash } from "node:crypto";
import { getUpstashConfig } from "@/env.mjs";

const LIMITS = {
  messagesPerDay: intEnv("OWW_MESSAGES_PER_DAY", 50),
  burstPerMinute: intEnv("OWW_BURST_PER_MINUTE", 8),
  globalPerDay: intEnv("OWW_GLOBAL_MESSAGES_PER_DAY", 4000),
};

function intEnv(name: string, fallback: number): number {
  const n = parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

interface CounterStore {
  /** Increment key, setting TTL on first write. Returns the new count. */
  incr(key: string, ttlSeconds: number): Promise<number>;
}

type StoreKind = "memory" | "upstash";

type StoreState = {
  kind: StoreKind;
  store: CounterStore;
};

class MemoryStore implements CounterStore {
  private map = new Map<string, { n: number; exp: number }>();

  async incr(key: string, ttlSeconds: number): Promise<number> {
    const now = Date.now();
    if (this.map.size > 10_000) {
      for (const [k, v] of this.map) if (v.exp < now) this.map.delete(k);
    }
    const cur = this.map.get(key);
    if (!cur || cur.exp < now) {
      this.map.set(key, { n: 1, exp: now + ttlSeconds * 1000 });
      return 1;
    }
    cur.n += 1;
    return cur.n;
  }
}

class UpstashStore implements CounterStore {
  constructor(
    private url: string,
    private token: string,
  ) {}

  async incr(key: string, ttlSeconds: number): Promise<number> {
    const res = await fetch(`${this.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, ttlSeconds, "NX"],
      ]),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`upstash ${res.status}`);
    const data = (await res.json()) as Array<{ result: number }>;
    return data[0]?.result ?? 1;
  }
}

declare global {
  var __owwStore: StoreState | undefined;
}

function store(): StoreState {
  if (!globalThis.__owwStore) {
    const upstash = getUpstashConfig();
    globalThis.__owwStore = upstash
      ? { kind: "upstash", store: new UpstashStore(upstash.url, upstash.token) }
      : { kind: "memory", store: new MemoryStore() };
    console.info(`[oww] rate limiter store: ${globalThis.__owwStore.kind}`);
  }
  return globalThis.__owwStore;
}

function hashIp(ip: string): string {
  return createHash("sha256")
    .update(`${process.env.RATE_SALT ?? "one-wish-willow"}:${ip}`)
    .digest("hex")
    .slice(0, 16);
}

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

function secondsToUtcMidnight(): number {
  const now = new Date();
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );
  return Math.max(1, Math.ceil((next - now.getTime()) / 1000));
}

export type RateVerdict =
  | { ok: true; messagesLeft: number }
  | { ok: false; status: 429; retryAfter: number; message: string };

/**
 * OWW_MODE=local → no limits (default while developing).
 * OWW_MODE=prod  → limits on (default for production builds).
 */
export function isUnlimited(): boolean {
  const mode = process.env.OWW_MODE;
  if (mode === "local") return true;
  if (mode === "prod") return false;
  return process.env.NODE_ENV !== "production";
}

/** All denial copy stays in character. The Willow needs rest. */
const DENIALS = {
  burst:
    "whoa. don't come to the chat with this energy, man. give it a minute and try again.",
  messages:
    "that's every question the line can take from you today. the willow needs rest. come back tomorrow.",
  global:
    "the line is overwhelmed right now. everybody wants a wish. come back tomorrow.",
};

export async function checkRateLimit(ip: string): Promise<RateVerdict> {
  const day = utcDay();
  const id = hashIp(ip);
  const dayTtl = secondsToUtcMidnight() + 60;

  try {
    const s = store().store;
    const burst = await s.incr(
      `oww:burst:${id}:${Math.floor(Date.now() / 60_000)}`,
      65,
    );
    if (burst > LIMITS.burstPerMinute)
      return { ok: false, status: 429, retryAfter: 60, message: DENIALS.burst };

    const global = await s.incr(`oww:global:${day}`, dayTtl);
    if (global > LIMITS.globalPerDay)
      return {
        ok: false,
        status: 429,
        retryAfter: secondsToUtcMidnight(),
        message: DENIALS.global,
      };

    const msgs = await s.incr(`oww:msg:${day}:${id}`, dayTtl);
    if (msgs > LIMITS.messagesPerDay)
      return {
        ok: false,
        status: 429,
        retryAfter: secondsToUtcMidnight(),
        message: DENIALS.messages,
      };

    return {
      ok: true,
      messagesLeft: Math.max(0, LIMITS.messagesPerDay - msgs),
    };
  } catch (error) {
    console.error("[oww] rate limiter error:", error);
    // A broken limiter should degrade to letting people in, not lock the door.
    return { ok: true, messagesLeft: 1 };
  }
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}
