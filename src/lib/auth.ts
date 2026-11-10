// Admin session helpers. Runs on the Node.js runtime (Server Actions, Route Handlers, proxy).
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

/** Insecure local-dev fallbacks. They must never be accepted in production. */
export const DEV_PASSWORD = "melissa-admin-2026";
const DEV_SECRET = "dev-only-insecure-secret";
const MIN_SECRET_LENGTH = 16;

/** Cookie attributes for the admin session. */
export const sessionCookieOptions = () =>
  ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  }) as const;

type AuthConfig = { password: string; secret: string };

let warned = false;

/** Reasons the production configuration is unsafe (empty when fine or not in production). */
export function securityProblems(env: NodeJS.ProcessEnv = process.env): string[] {
  if (env.NODE_ENV !== "production") return [];
  const problems: string[] = [];
  if (!env.ADMIN_PASSWORD) problems.push("ADMIN_PASSWORD is missing");
  else if (env.ADMIN_PASSWORD === DEV_PASSWORD) problems.push("ADMIN_PASSWORD is the insecure local fallback");
  if (!env.AUTH_SECRET) problems.push("AUTH_SECRET is missing");
  else if (env.AUTH_SECRET === DEV_SECRET || env.AUTH_SECRET.length < MIN_SECRET_LENGTH) {
    problems.push(`AUTH_SECRET is insecure (use a random value of at least ${MIN_SECRET_LENGTH} chars)`);
  }
  return problems;
}

/**
 * Resolves credentials, failing CLOSED in production: with a missing/insecure configuration
 * login and session verification are disabled and a clear error is logged. Not thrown at import
 * time on purpose, so `next build` (NODE_ENV=production) cannot be broken by a missing env var.
 */
function getAuthConfig(): AuthConfig | null {
  const problems = securityProblems();
  if (problems.length) {
    if (!warned) {
      warned = true;
      console.error(`[SECURITY] Admin authentication DISABLED: ${problems.join("; ")}.`);
    }
    return null;
  }
  return {
    password: process.env.ADMIN_PASSWORD || DEV_PASSWORD,
    secret: process.env.AUTH_SECRET || DEV_SECRET,
  };
}

export function getAdminPassword(): string | null {
  return getAuthConfig()?.password ?? null;
}

function sign(payload: string, { password, secret }: AuthConfig): string {
  return createHmac("sha256", `${secret}:${password}`).update(payload).digest("hex");
}

/** Constant-time string comparison; hashing first hides length differences too. */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkPassword(input: string): boolean {
  const config = getAuthConfig();
  return config !== null && safeEqual(input, config.password);
}

/** Creates a signed token `expiry.signature`; changing the password or secret invalidates it. */
export async function createSessionToken(): Promise<string> {
  const config = getAuthConfig();
  if (!config) throw new Error("Admin authentication is not configured");
  const exp = String(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS);
  return `${exp}.${sign(exp, config)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  const config = getAuthConfig();
  if (!token || !config) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [exp, sig] = parts;
  const expiry = Number(exp);
  if (!exp || !sig || !Number.isFinite(expiry) || expiry < Date.now() / 1000) return false;
  return safeEqual(sig, sign(exp, config));
}
