import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  set: [] as Array<{ name: string; value: string; options: Record<string, unknown> }>,
  headers: {} as Record<string, string>,
}));

class RedirectSignal extends Error {
  constructor(public to: string) {
    super(`redirect:${to}`);
  }
}

vi.mock("next/headers", () => ({
  cookies: async () => ({
    set: (name: string, value: string, options: Record<string, unknown>) => h.set.push({ name, value, options }),
    delete: () => {},
    get: () => undefined,
  }),
  headers: async () => new Headers(h.headers),
}));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new RedirectSignal(to);
  },
}));

import { loginAction } from "@/app/admin/actions";
import {
  DEV_PASSWORD,
  SESSION_COOKIE,
  checkPassword,
  createSessionToken,
  safeEqual,
  securityProblems,
  sessionCookieOptions,
  verifySessionToken,
} from "@/lib/auth";
import { clientKey, recordFailure, recordSuccess, resetThrottle, retryAfterSeconds } from "@/lib/login-throttle";

const SECRET = "a-long-random-secret-value";

beforeEach(() => {
  vi.stubEnv("ADMIN_PASSWORD", "segreta-123");
  vi.stubEnv("AUTH_SECRET", SECRET);
  h.set = [];
  h.headers = { "x-forwarded-for": "1.2.3.4" };
  resetThrottle();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("timing-safe comparison", () => {
  it("safeEqual is exact and length-agnostic", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    for (const [a, b] of [["abc", "abd"], ["abc", "abcd"], ["", "a"], ["a", ""], ["abc", "ABC"]]) {
      expect(safeEqual(a, b), `${a}|${b}`).toBe(false);
    }
  });

  it("checkPassword accepts only the exact password", () => {
    expect(checkPassword("segreta-123")).toBe(true);
    expect(checkPassword("segreta-1234")).toBe(false);
    expect(checkPassword("")).toBe(false);
  });
});

describe("session tokens", () => {
  it("rejects a tampered signature, payload and an expired token", async () => {
    const token = await createSessionToken();
    const [exp, sig] = token.split(".");
    const flipped = sig.slice(0, -1) + (sig.endsWith("0") ? "1" : "0");
    expect(await verifySessionToken(token)).toBe(true);
    expect(await verifySessionToken(`${exp}.${flipped}`)).toBe(false);
    expect(await verifySessionToken(`${Number(exp) + 1}.${sig}`)).toBe(false);

    vi.useFakeTimers();
    vi.setSystemTime(new Date(Number(exp) * 1000 + 1000));
    expect(await verifySessionToken(token)).toBe(false);
  });

  it("a token signed with another secret is rejected", async () => {
    const token = await createSessionToken();
    vi.stubEnv("AUTH_SECRET", "a-different-secret-value");
    expect(await verifySessionToken(token)).toBe(false);
  });
});

describe("production configuration fail-fast", () => {
  const prod = (env: Record<string, string | undefined>) => securityProblems({ NODE_ENV: "production", ...env } as NodeJS.ProcessEnv);

  it("is silent outside production", () => {
    expect(securityProblems({ NODE_ENV: "development" } as NodeJS.ProcessEnv)).toEqual([]);
  });

  it("flags missing, default and weak secrets in production", () => {
    expect(prod({ ADMIN_PASSWORD: "x", AUTH_SECRET: SECRET })).toEqual([]);
    expect(prod({ AUTH_SECRET: SECRET })).toEqual([expect.stringContaining("ADMIN_PASSWORD is missing")]);
    expect(prod({ ADMIN_PASSWORD: "x" })).toEqual([expect.stringContaining("AUTH_SECRET is missing")]);
    expect(prod({ ADMIN_PASSWORD: DEV_PASSWORD, AUTH_SECRET: SECRET })).toEqual([expect.stringContaining("insecure local fallback")]);
    expect(prod({ ADMIN_PASSWORD: "x", AUTH_SECRET: "short" })).toEqual([expect.stringContaining("AUTH_SECRET is insecure")]);
  });

  it("disables auth and logs a SECURITY error when production is misconfigured", async () => {
    const token = await createSessionToken();
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_SECRET", "");
    expect(checkPassword("segreta-123")).toBe(false);
    expect(await verifySessionToken(token)).toBe(false);
    await expect(createSessionToken()).rejects.toThrow();
    expect(err.mock.calls.some((c) => String(c[0]).includes("[SECURITY]"))).toBe(true);
  });

  it("production rejects the well-known dev password even if it is configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_PASSWORD", DEV_PASSWORD);
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(checkPassword(DEV_PASSWORD)).toBe(false);
  });
});

describe("session cookie attributes", () => {
  it("is httpOnly, lax, path=/ and secure only in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(sessionCookieOptions()).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/", secure: true });
    vi.stubEnv("NODE_ENV", "development");
    expect(sessionCookieOptions()).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/", secure: false });
  });
});

describe("throttle (unit)", () => {
  it("allows 3 free failures, then locks with exponential backoff capped at 15 min", () => {
    const t0 = 1_000_000;
    expect([1, 2, 3].map(() => recordFailure("ip", t0))).toEqual([0, 0, 0]);
    expect(retryAfterSeconds("ip", t0)).toBe(0);
    expect(recordFailure("ip", t0)).toBe(15);
    expect(recordFailure("ip", t0)).toBe(30);
    expect(recordFailure("ip", t0)).toBe(60);
    expect(retryAfterSeconds("ip", t0 + 10_000)).toBe(50);
    expect(retryAfterSeconds("ip", t0 + 61_000)).toBe(0);
    for (let i = 0; i < 20; i++) recordFailure("ip", t0);
    expect(recordFailure("ip", t0)).toBe(900);
  });

  it("is per-client, and success clears the counter", () => {
    for (let i = 0; i < 5; i++) recordFailure("a", 0);
    expect(retryAfterSeconds("a", 0)).toBeGreaterThan(0);
    expect(retryAfterSeconds("b", 0)).toBe(0);
    recordSuccess("a");
    expect(retryAfterSeconds("a", 0)).toBe(0);
  });

  it("derives the client key from proxy headers", () => {
    expect(clientKey(new Headers({ "x-forwarded-for": "9.9.9.9, 10.0.0.1" }))).toBe("9.9.9.9");
    expect(clientKey(new Headers({ "x-real-ip": "8.8.8.8" }))).toBe("8.8.8.8");
    expect(clientKey(new Headers())).toBe("unknown");
  });
});

describe("loginAction brute-force protection", () => {
  const login = (password: string, next = "") => {
    const fd = new FormData();
    fd.set("password", password);
    fd.set("next", next);
    return loginAction({}, fd);
  };

  it("locks the client after repeated failures, even for the correct password", async () => {
    vi.useFakeTimers();
    for (let i = 0; i < 3; i++) expect((await login("wrong")).error).toBe("Password non corretta. Riprova.");
    expect((await login("wrong")).error).toMatch(/Riprova tra 15 secondi/);
    // The right password is refused while locked, and no cookie is issued.
    expect((await login("segreta-123")).error).toMatch(/Troppi tentativi/);
    expect(h.set).toHaveLength(0);

    vi.advanceTimersByTime(16_000);
    await expect(login("segreta-123")).rejects.toMatchObject({ to: "/admin" });
    expect(h.set).toHaveLength(1);
  });

  it("another IP is not affected by someone else's lockout", async () => {
    for (let i = 0; i < 6; i++) await login("wrong");
    h.headers = { "x-forwarded-for": "5.6.7.8" };
    await expect(login("segreta-123")).rejects.toMatchObject({ to: "/admin" });
  });

  it("sets a hardened cookie on success and only follows same-site admin redirects", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(login("segreta-123", "/admin/dipinti")).rejects.toMatchObject({ to: "/admin/dipinti" });
    expect(h.set[0]).toMatchObject({
      name: SESSION_COOKIE,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
    });
    for (const evil of ["//evil.com", "https://evil.com", "/admin/../../x", "/adminx", "/admin@evil.com"]) {
      await expect(login("segreta-123", evil), evil).rejects.toMatchObject({ to: "/admin" });
    }
  });
});
