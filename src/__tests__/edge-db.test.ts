import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "@/db/schema";
import { events, paintings, paintingsToEvents } from "@/db/schema";
import type { Database } from "@/db/types";
import { createTestDb, eventInput, paintingInput } from "./helpers/test-db";

const h = vi.hoisted(() => ({ db: undefined as unknown, cookie: undefined as string | undefined, cacheLife: [] as string[] }));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (h.cookie ? { name: n, value: h.cookie } : undefined) }),
}));
vi.mock("next/cache", () => ({
  revalidatePath: () => {},
  updateTag: () => {},
  cacheLife: (p: string) => h.cacheLife.push(p),
  cacheTag: () => {},
}));
vi.mock("@/db", () => ({
  get db() {
    return h.db;
  },
}));
vi.mock("@/lib/storage", () => ({ saveImage: vi.fn(), deleteStoredFiles: vi.fn(async () => {}) }));

import * as actions from "@/app/admin/content-actions";
import { createSessionToken } from "@/lib/auth";
import { createEvent, createPainting, deletePainting, updatePainting } from "@/lib/content";
import { resolveHome } from "@/lib/home";
import * as queries from "@/lib/queries";
import { validateEvent, validatePainting } from "@/lib/validation";

let db: Database;
beforeEach(async () => {
  vi.stubEnv("ADMIN_PASSWORD", "segreta-123");
  vi.stubEnv("AUTH_SECRET", "test-secret-0123456789");
  db = await createTestDb();
  h.db = db;
  h.cookie = await createSessionToken();
  h.cacheLife = [];
});

const okPainting = (over: Record<string, unknown> = {}) => {
  const v = validatePainting(paintingInput(over));
  if (!v.ok) throw new Error("fixture invalid");
  return v.data;
};
const okEvent = (over: Record<string, unknown> = {}) => {
  const v = validateEvent(eventInput(over));
  if (!v.ok) throw new Error("fixture invalid");
  return v.data;
};

describe("date range validation", () => {
  it("rejects endDate earlier than startDate, accepts equal or later", () => {
    const bad = validateEvent(eventInput({ startDate: "2024-05-10", endDate: "2024-05-09" }));
    expect(bad).toMatchObject({ ok: false, errors: { endDate: expect.stringContaining("non può precedere") } });
    expect(validateEvent(eventInput({ startDate: "2024-05-10", endDate: "2024-05-10" })).ok).toBe(true);
    expect(validateEvent(eventInput({ startDate: "2024-05-10", endDate: "2024-06-01" })).ok).toBe(true);
    expect(validateEvent(eventInput({ startDate: "2024-05-10" })).ok).toBe(true);
    expect(validateEvent(eventInput({ startDate: "2024-05-10", endDate: "2024-02-30" })).ok).toBe(false);
  });

  it("the server actions refuse an inverted range and write nothing", async () => {
    const bad = eventInput({ startDate: "2024-05-10", endDate: "2023-01-01" });
    expect(await actions.createEventAction(bad)).toMatchObject({ ok: false, errors: { endDate: expect.any(String) } });
    expect(await db.select().from(events)).toHaveLength(0);

    const id = ((await actions.createEventAction(eventInput())) as { id: number }).id;
    expect((await actions.updateEventAction(id, bad)).ok).toBe(false);
    expect((await db.select().from(events))[0].endDate).toBeNull();
  });
});

describe("atomic multi-step mutations", () => {
  const failLinkInserts = async () =>
    db.run(
      `CREATE TRIGGER fail_link BEFORE INSERT ON paintings_to_events BEGIN SELECT RAISE(ABORT, 'link failed'); END`,
    );

  it("createPainting rolls the painting back when linking fails", async () => {
    const ev = await createEvent(db, okEvent());
    await failLinkInserts();
    await expect(createPainting(db, okPainting({ eventIds: [ev.event.id] }))).rejects.toThrow();
    expect(await db.select().from(paintings)).toHaveLength(0);
  });

  it("updatePainting keeps the previous data and links when linking fails mid-update", async () => {
    const e1 = await createEvent(db, okEvent({ title: "Uno" }));
    const e2 = await createEvent(db, okEvent({ title: "Due" }));
    const { painting } = await createPainting(db, okPainting({ title: "Originale", eventIds: [e1.event.id] }));
    await failLinkInserts();

    await expect(
      updatePainting(db, painting.id, okPainting({ title: "Modificato", eventIds: [e2.event.id] })),
    ).rejects.toThrow();

    const [row] = await db.select().from(paintings);
    expect(row.title).toBe("Originale");
    expect(row.slug).toBe("originale");
    const links = await db.select().from(paintingsToEvents);
    expect(links).toEqual([{ paintingId: painting.id, eventId: e1.event.id }]);
  });

  it("a failing action does not report success or leave partial rows", async () => {
    const ev = ((await actions.createEventAction(eventInput())) as { id: number }).id;
    await failLinkInserts();
    await expect(actions.createPaintingAction(paintingInput({ eventIds: [ev] }))).rejects.toThrow();
    expect(await db.select().from(paintings)).toHaveLength(0);
  });

  it("deleting a painting also cleans home slots and links in one transaction", async () => {
    const { painting } = await createPainting(db, okPainting());
    await actions.saveHomeSettingsAction({
      mode: "manual",
      heroItemType: "painting",
      heroItemId: painting.id,
      slots: [{ type: "painting", id: painting.id }],
    });
    await deletePainting(db, painting.id);
    const home = await resolveHome(db);
    expect(home.paintings).toEqual([]);
    expect(home.hero).toBeNull();
    const [s] = await db.select().from(schema.homeSettings);
    expect(JSON.parse(s.manualSlotsJson)).toEqual([]);
    expect(s.heroItemId).toBeNull();
  });
});

describe("empty database and query failures", () => {
  it("resolveHome on an empty DB returns safe defaults", async () => {
    expect(await resolveHome(db)).toEqual({ mode: "auto", hero: null, paintings: [], events: [] });
  });

  it("every public query returns an empty fallback on an empty DB", async () => {
    expect(await queries.getHomeData()).toEqual({ mode: "auto", hero: null, paintings: [], events: [] });
    expect(await queries.getProfile()).toBeNull();
    expect(await queries.getContacts()).toEqual({ instagramUrl: null, email: null });
    expect(await queries.getGalleryData()).toEqual({ paintings: [], exhibitedIds: [] });
    expect(await queries.getAllEvents()).toEqual([]);
    expect(await queries.getPaintingBySlug("nope")).toBeNull();
    expect(await queries.getEventBySlug("nope")).toBeNull();
    expect((await queries.getSiteTheme()).wall).toBeTruthy();
  });

  it("queries degrade (not throw) when tables are missing, e.g. a fresh DB during build", async () => {
    h.db = drizzle(createClient({ url: ":memory:" }), { schema });
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await queries.getHomeData()).toEqual({ mode: "auto", hero: null, paintings: [], events: [] });
    expect(await queries.getProfile()).toBeNull();
    expect(await queries.getContacts()).toEqual({ instagramUrl: null, email: null });
    expect(await queries.getGalleryData()).toEqual({ paintings: [], exhibitedIds: [] });
    expect(await queries.getAllEvents()).toEqual([]);
    expect(await queries.getPaintingBySlug("x")).toBeNull();
    expect(await queries.getEventBySlug("x")).toBeNull();
    expect((await queries.getSiteTheme()).wall).toBeTruthy();
    expect(err).toHaveBeenCalled();
    // Failures must not be cached for hours (short, prerenderable lifetime).
    expect(h.cacheLife.filter((p) => p === "minutes").length).toBeGreaterThanOrEqual(8);
  });
});
