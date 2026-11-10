// Progressive lockout for failed admin logins, keyed by client IP.
// State lives in memory: on serverless it is per warm instance, which still slows down
// brute force considerably. For hard guarantees add an edge rate limit (e.g. Vercel Firewall).

type Entry = { fails: number; lockedUntil: number; lastFail: number };

const FREE_ATTEMPTS = 3;
const BASE_LOCK_MS = 15_000;
const MAX_LOCK_MS = 15 * 60_000;
const FORGET_AFTER_MS = 60 * 60_000;
const MAX_ENTRIES = 5_000;

const entries = new Map<string, Entry>();

/** Seconds the caller must still wait, or 0 when an attempt is allowed. */
export function retryAfterSeconds(key: string, now = Date.now()): number {
  const e = entries.get(key);
  if (!e || e.lockedUntil <= now) return 0;
  return Math.ceil((e.lockedUntil - now) / 1000);
}

export function recordFailure(key: string, now = Date.now()): number {
  if (entries.size >= MAX_ENTRIES) prune(now);
  const prev = entries.get(key);
  const fails = (prev && now - prev.lastFail < FORGET_AFTER_MS ? prev.fails : 0) + 1;
  // 3 free attempts, then 15s, 30s, 60s ... capped at 15 minutes.
  const lock = fails > FREE_ATTEMPTS ? Math.min(MAX_LOCK_MS, BASE_LOCK_MS * 2 ** (fails - FREE_ATTEMPTS - 1)) : 0;
  entries.set(key, { fails, lockedUntil: now + lock, lastFail: now });
  return Math.ceil(lock / 1000);
}

export function recordSuccess(key: string): void {
  entries.delete(key);
}

function prune(now: number) {
  for (const [k, e] of entries) if (now - e.lastFail > FORGET_AFTER_MS) entries.delete(k);
  if (entries.size >= MAX_ENTRIES) entries.clear();
}

export function resetThrottle(): void {
  entries.clear();
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientKey(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || headers.get("x-real-ip") || "unknown";
}
