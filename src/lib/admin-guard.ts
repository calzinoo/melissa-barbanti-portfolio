import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./auth";

export class UnauthorizedError extends Error {
  constructor() {
    super("Non autorizzato");
    this.name = "UnauthorizedError";
  }
}

export function readCookie(header: string | null, name: string): string | undefined {
  for (const part of (header ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return undefined;
}

/** For Route Handlers: checks the session cookie of the incoming request. */
export async function isAdminRequest(request: Request): Promise<boolean> {
  return verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE));
}

/** For Server Actions: must be called before any mutation. Never rely on the proxy alone. */
export async function requireAdmin(): Promise<void> {
  const jar = await cookies();
  if (!(await verifySessionToken(jar.get(SESSION_COOKIE)?.value))) throw new UnauthorizedError();
}
