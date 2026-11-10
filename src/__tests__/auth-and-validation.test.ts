import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/db/types";
import { paintings } from "@/db/schema";
import { createTestDb, eventInput, paintingInput } from "./helpers/test-db";

const h = vi.hoisted(() => ({
  cookie: undefined as string | undefined,
  db: undefined as unknown,
  revalidated: [] as string[],
  tags: [] as string[],
  saved: 0,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (h.cookie ? { name: n, value: h.cookie } : undefined) }),
}));
vi.mock("next/cache", () => ({
  revalidatePath: (p: string) => h.revalidated.push(p),
  updateTag: (t: string) => h.tags.push(t),
  cacheLife: () => {},
  cacheTag: () => {},
}));
vi.mock("@/db", () => ({
  get db() {
    return h.db;
  },
}));
vi.mock("@/lib/storage", () => ({
  saveImage: async () => {
    h.saved++;
    return { url: "/uploads/test.webp" };
  },
}));

import * as actions from "@/app/admin/content-actions";
import { POST as uploadPost } from "@/app/api/upload/route";
import { UnauthorizedError, isAdminRequest, readCookie, requireAdmin } from "@/lib/admin-guard";
import {
  SESSION_COOKIE,
  checkPassword,
  createSessionToken,
  getAdminPassword,
  verifySessionToken,
} from "@/lib/auth";
import { isIsoDate, validateEvent, validatePainting } from "@/lib/validation";

let db: Database;
beforeEach(async () => {
  vi.stubEnv("ADMIN_PASSWORD", "segreta-123");
  vi.stubEnv("AUTH_SECRET", "test-secret");
  db = await createTestDb();
  h.db = db;
  h.cookie = undefined;
  h.revalidated = [];
  h.tags = [];
  h.saved = 0;
});
afterEach(() => vi.unstubAllEnvs());

describe("password verification", () => {
  it("accepts only the exact configured password", () => {
    expect(checkPassword("segreta-123")).toBe(true);
    for (const bad of ["", "segreta-12", "segreta-1234", "SEGRETA-123", " segreta-123"]) {
      expect(checkPassword(bad)).toBe(false);
    }
  });

  it("falls back to a dev default only outside production", () => {
    vi.stubEnv("ADMIN_PASSWORD", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(getAdminPassword()).toBeTruthy();
    vi.stubEnv("NODE_ENV", "production");
    expect(getAdminPassword()).toBeNull();
  });

  it("in production without ADMIN_PASSWORD nobody can log in and no token verifies", async () => {
    const token = await createSessionToken();
    vi.stubEnv("ADMIN_PASSWORD", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(checkPassword("")).toBe(false);
    expect(checkPassword("melissa-admin-2026")).toBe(false);
    expect(await verifySessionToken(token)).toBe(false);
    await expect(createSessionToken()).rejects.toThrow();
  });
});

describe("session tokens", () => {
  it("verifies a freshly created token", async () => {
    expect(await verifySessionToken(await createSessionToken())).toBe(true);
  });

  it("rejects missing, malformed and tampered tokens", async () => {
    const token = await createSessionToken();
    const [exp, sig] = token.split(".");
    const bad = [
      undefined,
      "",
      "garbage",
      ".",
      `${exp}.`,
      `.${sig}`,
      `${exp}.${sig}.extra`,
      `${exp}.${"0".repeat(sig.length)}`,
      `${Number(exp) + 1000}.${sig}`, // extended expiry with the old signature
      `abc.${sig}`,
      `NaN.${sig}`,
    ];
    for (const t of bad) expect(await verifySessionToken(t), String(t)).toBe(false);
  });

  it("rejects expired tokens", async () => {
    vi.useFakeTimers();
    try {
      const token = await createSessionToken();
      vi.advanceTimersByTime(8 * 24 * 3600 * 1000);
      expect(await verifySessionToken(token)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("invalidates tokens when the password or secret changes", async () => {
    const token = await createSessionToken();
    vi.stubEnv("ADMIN_PASSWORD", "altra-password");
    expect(await verifySessionToken(token)).toBe(false);
    vi.stubEnv("ADMIN_PASSWORD", "segreta-123");
    expect(await verifySessionToken(token)).toBe(true);
    vi.stubEnv("AUTH_SECRET", "rotated");
    expect(await verifySessionToken(token)).toBe(false);
  });
});

describe("admin guard", () => {
  it("parses the Cookie header", () => {
    expect(readCookie("a=1; admin_session=tok%2Ex; b=2", SESSION_COOKIE)).toBe("tok.x");
    expect(readCookie(null, SESSION_COOKIE)).toBeUndefined();
    expect(readCookie("xadmin_session=1", SESSION_COOKIE)).toBeUndefined();
  });

  it("requireAdmin throws without a valid session and passes with one", async () => {
    await expect(requireAdmin()).rejects.toBeInstanceOf(UnauthorizedError);
    h.cookie = "invalid";
    await expect(requireAdmin()).rejects.toBeInstanceOf(UnauthorizedError);
    h.cookie = await createSessionToken();
    await expect(requireAdmin()).resolves.toBeUndefined();
  });

  it("isAdminRequest reads the request cookie", async () => {
    const token = await createSessionToken();
    const req = (cookie?: string) => new Request("http://x/api", { headers: cookie ? { cookie } : {} });
    expect(await isAdminRequest(req())).toBe(false);
    expect(await isAdminRequest(req(`${SESSION_COOKIE}=nope`))).toBe(false);
    expect(await isAdminRequest(req(`${SESSION_COOKIE}=${token}`))).toBe(true);
  });
});

describe("mutating Server Actions reject unauthorized callers", () => {
  const calls: Array<[string, () => Promise<unknown>]> = [
    ["createPaintingAction", () => actions.createPaintingAction(paintingInput())],
    ["updatePaintingAction", () => actions.updatePaintingAction(1, paintingInput())],
    ["deletePaintingAction", () => actions.deletePaintingAction(1)],
    ["createEventAction", () => actions.createEventAction(eventInput())],
    ["updateEventAction", () => actions.updateEventAction(1, eventInput())],
    ["deleteEventAction", () => actions.deleteEventAction(1)],
    ["saveHomeSettingsAction", () => actions.saveHomeSettingsAction({ mode: "manual" })],
    ["saveProfileAction", () => actions.saveProfileAction({ bioDescription: "hack" })],
    ["saveThemeAction", () => actions.saveThemeAction({ wall: "blu-notte", accent: "#ff0000" })],
  ];

  it.each(calls)("%s throws and changes nothing without a session", async (_name, call) => {
    await expect(call()).rejects.toBeInstanceOf(UnauthorizedError);
    expect(await db.select().from(paintings)).toHaveLength(0);
    expect(h.revalidated).toEqual([]);
  });

  it("every exported action is covered by this list", () => {
    expect(calls.map(([n]) => n).sort()).toEqual(Object.keys(actions).sort());
  });

  it("with a valid session the action writes and revalidates all affected routes", async () => {
    h.cookie = await createSessionToken();
    const ev = await actions.createEventAction(eventInput({ title: "Gala" }));
    expect(ev.ok).toBe(true);
    const res = await actions.createPaintingAction(
      paintingInput({ title: "Rosa", eventIds: [(ev as { id: number }).id] }),
    );
    expect(res.ok).toBe(true);
    expect(await db.select().from(paintings)).toHaveLength(1);
    expect(h.revalidated).toEqual(
      expect.arrayContaining(["/", "/opere", "/opere/rosa", "/eventi", "/eventi/gala"]),
    );
    expect(h.tags).toEqual(expect.arrayContaining(["home", "paintings", "events"]));
  });

  it("returns field errors for invalid input without touching the DB", async () => {
    h.cookie = await createSessionToken();
    const res = await actions.createPaintingAction(paintingInput({ title: "  " }));
    expect(res).toMatchObject({ ok: false, errors: { title: expect.any(String) } });
    expect(await db.select().from(paintings)).toHaveLength(0);
    expect(await actions.deletePaintingAction(999)).toMatchObject({ ok: false });
  });
});

describe("/api/upload", () => {
  const webp = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBP"), Buffer.alloc(8)]);
  const upload = (body: Buffer, cookie?: string) => {
    const form = new FormData();
    form.set("file", new File([new Uint8Array(body)], "a.webp", { type: "image/webp" }));
    return uploadPost(new Request("http://x/api/upload", { method: "POST", body: form, headers: cookie ? { cookie } : {} }));
  };

  it("returns 401 without a session and never stores the file", async () => {
    const res = await upload(webp);
    expect(res.status).toBe(401);
    expect((await upload(webp, `${SESSION_COOKIE}=forged`)).status).toBe(401);
    expect(h.saved).toBe(0);
  });

  it("accepts a WebP with a valid session, rejects other content", async () => {
    const cookie = `${SESSION_COOKIE}=${await createSessionToken()}`;
    const ok = await upload(webp, cookie);
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ url: "/uploads/test.webp" });
    expect((await upload(Buffer.from("not an image at all"), cookie)).status).toBe(415);
    const empty = await uploadPost(
      new Request("http://x/api/upload", { method: "POST", headers: { cookie }, body: "plain" }),
    );
    expect(empty.status).toBe(400);
  });
});

describe("input validation", () => {
  it("validates ISO dates strictly", () => {
    for (const ok of ["2024-02-29", "1999-12-31"]) expect(isIsoDate(ok)).toBe(true);
    for (const bad of ["2023-02-29", "2024-13-01", "2024-00-10", "24-01-01", "2024/01/01", "01-01-2024", "", "2024-1-1", null, 20240101]) {
      expect(isIsoDate(bad), String(bad)).toBe(false);
    }
  });

  it("painting: requires title, image and a valid date (description optional)", () => {
    const res = validatePainting({});
    expect(res.ok).toBe(false);
    if (!res.ok) expect(Object.keys(res.errors).sort()).toEqual(["date", "mainImageUrl", "title"]);
    expect(validatePainting(paintingInput({ title: "   " })).ok).toBe(false);
    expect(validatePainting(paintingInput({ date: "2024-02-30" })).ok).toBe(false);
  });

  it("painting: availability must be one of the enum values (default available)", () => {
    expect(validatePainting(paintingInput({ availability: "sold" }))).toMatchObject({
      ok: false,
      errors: { availability: expect.any(String) },
    });
    for (const a of ["available", "private_collection"]) {
      expect(validatePainting(paintingInput({ availability: a })).ok).toBe(true);
    }
    const dflt = validatePainting(paintingInput());
    expect(dflt.ok && dflt.data.availability).toBe("available");
  });

  it("painting: trims text, nulls blank optionals, cleans arrays and ids", () => {
    const res = validatePainting(
      paintingInput({
        title: "  Titolo  ",
        poem: "   ",
        technique: " Olio ",
        detailImages: ["/a.webp", "", 5, "  "],
        eventIds: [1, "2", 2, -1, 1.5, "x"],
      }),
    );
    expect(res.ok && res.data).toMatchObject({
      title: "Titolo",
      poem: null,
      technique: "Olio",
      detailImages: ["/a.webp"],
      eventIds: [1, 2],
    });
  });

  it("event: requires title, summary, description, valid start date", () => {
    const res = validateEvent({});
    expect(res.ok).toBe(false);
    if (!res.ok) expect(Object.keys(res.errors).sort()).toEqual(["description", "startDate", "summary", "title"]);
  });

  it("event: end date is optional, must be valid and not precede the start", () => {
    expect(validateEvent(eventInput({ endDate: "" })).ok).toBe(true);
    expect(validateEvent(eventInput({ endDate: "2024-05-01" })).ok).toBe(true);
    expect(validateEvent(eventInput({ endDate: "2024-13-40" }))).toMatchObject({ ok: false });
    expect(validateEvent(eventInput({ endDate: "2024-04-30" }))).toMatchObject({
      ok: false,
      errors: { endDate: expect.any(String) },
    });
  });

  it("non-string input does not throw", () => {
    expect(validatePainting({ title: 42, date: {}, availability: [] }).ok).toBe(false);
    expect(validateEvent({ title: null, startDate: undefined }).ok).toBe(false);
  });
});
