import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, eventInput, paintingInput } from "./helpers/test-db";

const h = vi.hoisted(() => ({
  db: undefined as unknown,
  cookie: undefined as string | undefined,
  tags: [] as string[],
  paths: [] as Array<[string, string | undefined]>,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (h.cookie ? { name: n, value: h.cookie } : undefined) }),
}));
vi.mock("next/cache", () => ({
  revalidatePath: (p: string, type?: string) => h.paths.push([p, type]),
  updateTag: (t: string) => h.tags.push(t),
  revalidateTag: (t: string) => h.tags.push(t),
  cacheLife: () => {},
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

const paths = () => h.paths.map(([p]) => p);
const reset = () => {
  h.tags = [];
  h.paths = [];
};

beforeEach(async () => {
  vi.stubEnv("ADMIN_PASSWORD", "segreta-123");
  vi.stubEnv("AUTH_SECRET", "test-secret-0123456789");
  h.db = await createTestDb();
  h.cookie = await createSessionToken();
  reset();
});

describe("cache invalidation on every mutation", () => {
  const CONTENT_TAGS = ["home", "paintings", "events", "profile"];

  it("create/update/delete painting expire every content tag and the affected routes", async () => {
    const created = await actions.createPaintingAction(paintingInput({ title: "Rosa" }));
    expect(created.ok).toBe(true);
    const id = (created as { id: number }).id;
    expect(h.tags).toEqual(expect.arrayContaining(CONTENT_TAGS));
    expect(paths()).toEqual(expect.arrayContaining(["/", "/opere", "/eventi", "/opere/rosa"]));
    expect(h.paths).toContainEqual(["/opere/[slug]", "page"]);

    reset();
    await actions.updatePaintingAction(id, paintingInput({ title: "Rosa Blu" }));
    expect(h.tags).toEqual(expect.arrayContaining(CONTENT_TAGS));
    // Both the old and the new slug are purged: the old URL must stop resolving immediately.
    expect(paths()).toEqual(expect.arrayContaining(["/", "/opere", "/opere/rosa", "/opere/rosa-blu"]));

    reset();
    await actions.deletePaintingAction(id);
    expect(h.tags).toEqual(expect.arrayContaining(CONTENT_TAGS));
    expect(paths()).toEqual(expect.arrayContaining(["/", "/opere", "/opere/rosa-blu"]));
  });

  it("create/update/delete event expire every content tag and the affected routes", async () => {
    const created = await actions.createEventAction(eventInput({ title: "Gala" }));
    const id = (created as { id: number }).id;
    expect(h.tags).toEqual(expect.arrayContaining(CONTENT_TAGS));
    expect(paths()).toEqual(expect.arrayContaining(["/", "/eventi", "/eventi/gala"]));
    expect(h.paths).toContainEqual(["/eventi/[slug]", "page"]);

    reset();
    await actions.updateEventAction(id, eventInput({ title: "Gala 2" }));
    expect(paths()).toEqual(expect.arrayContaining(["/eventi/gala", "/eventi/gala-2"]));

    reset();
    await actions.deleteEventAction(id);
    expect(h.tags).toEqual(expect.arrayContaining(CONTENT_TAGS));
    expect(paths()).toEqual(expect.arrayContaining(["/", "/eventi", "/eventi/gala-2"]));
  });

  it("linked entities are revalidated on both sides of the relation", async () => {
    const ev = (await actions.createEventAction(eventInput({ title: "Mostra" }))) as { id: number };
    reset();
    await actions.createPaintingAction(paintingInput({ title: "Opera", eventIds: [ev.id] }));
    expect(paths()).toEqual(expect.arrayContaining(["/opere/opera", "/eventi/mostra"]));
  });

  it("home, profile and theme actions expire their own tag and path", async () => {
    await actions.saveHomeSettingsAction({ mode: "auto" });
    expect(h.tags).toContain("home");
    expect(paths()).toContain("/");

    reset();
    await actions.saveProfileAction({ bioDescription: "Ciao" });
    expect(h.tags).toContain("profile");
    expect(paths()).toContain("/profilo");

    reset();
    await actions.saveThemeAction({ wall: "chiaroscuro", accent: null });
    expect(h.tags).toContain("theme");
    expect(h.paths).toContainEqual(["/", "layout"]);
  });

  it("failed validation or a missing item does not revalidate anything", async () => {
    await actions.createPaintingAction(paintingInput({ title: "" }));
    await actions.deletePaintingAction(12345);
    await actions.updateEventAction(12345, eventInput());
    expect(h.tags).toEqual([]);
    expect(h.paths).toEqual([]);
  });
});
