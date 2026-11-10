// Edge/Node-compatible admin session helpers (Web Crypto only).
export const SESSION_COOKIE = "admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const DEFAULT_PASSWORD = "melissa-admin-2026";

/**
 * The configured admin password. The dev default is only used outside production;
 * in production a missing ADMIN_PASSWORD disables login (and session verification)
 * instead of silently exposing a well-known password.
 */
export function getAdminPassword(): string | null {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  return process.env.NODE_ENV === "production" ? null : DEFAULT_PASSWORD;
}

async function sign(payload: string, password: string): Promise<string> {
  const secret = `${process.env.AUTH_SECRET ?? ""}:${password}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function checkPassword(input: string): boolean {
  const password = getAdminPassword();
  return password !== null && safeEqual(input, password);
}

/** Creates a signed token `expiry.signature`; changing the password invalidates it. */
export async function createSessionToken(): Promise<string> {
  const password = getAdminPassword();
  if (password === null) throw new Error("ADMIN_PASSWORD is not configured");
  const exp = String(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS);
  return `${exp}.${await sign(exp, password)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  const password = getAdminPassword();
  if (!token || password === null) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [exp, sig] = parts;
  const expiry = Number(exp);
  if (!exp || !sig || !Number.isFinite(expiry) || expiry < Date.now() / 1000) return false;
  return safeEqual(sig, await sign(exp, password));
}
