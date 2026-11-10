import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { events, paintings, paintingsToEvents } from "@/db/schema";
import type { Database } from "@/db/types";
import {
  createEvent,
  createPainting,
  deleteEvent,
  deletePainting,
  updateEvent,
  updatePainting,
} from "@/lib/content";
import { pathsFor } from "@/lib/revalidate";
import { slugify } from "@/lib/slug";
import { validateEvent, validatePainting } from "@/lib/validation";
import { createTestDb, eventInput, paintingInput } from "./helpers/test-db";

let db: Database;
beforeEach(async () => {
  db = await createTestDb();
});

const okPainting = (over: Record<string, unknown> = {}) => {
  const v = validatePainting(paintingInput(over));
  if (!v.ok) throw new Error(JSON.stringify(v.errors));
  return v.data;
};
const okEvent = (over: Record<string, unknown> = {}) => {
  const v = validateEvent(eventInput(over));
  if (!v.ok) throw new Error(JSON.stringify(v.errors));
  return v.data;
};
const mkPainting = (over: Record<string, unknown> = {}) => createPainting(db, okPainting(over));
const mkEvent = (over: Record<string, unknown> = {}) => createEvent(db, okEvent(over));
const links = async () =>
  (await db.select().from(paintingsToEvents)).map((l) => `${l.paintingId}-${l.eventId}`).sort();

describe("paintings CRUD", () => {
  it("creates, reads, updates and deletes", async () => {
    const { painting } = await mkPainting({ title: "Il Mare", poem: "versi" });
    expect(painting.slug).toBe("il-mare");
    expect(painting.availability).toBe("available");
    expect(painting.poem).toBe("versi");

    const upd = await updatePainting(
      db,
      painting.id,
      okPainting({ title: "Il Mare", description: "Nuova", availability: "private_collection" }),
    );
    expect(upd?.painting.description).toBe("Nuova");
    expect(upd?.painting.availability).toBe("private_collection");
    expect(upd?.painting.slug).toBe("il-mare");
    expect(upd?.painting.poem).toBeNull();

    expect(await deletePainting(db, painting.id)).not.toBeNull();
    expect(await db.select().from(paintings)).toHaveLength(0);
  });

  it("returns null when updating or deleting a missing painting", async () => {
    expect(await updatePainting(db, 999, okPainting())).toBeNull();
    expect(await deletePainting(db, 999)).toBeNull();
  });
});

describe("events CRUD", () => {
  it("creates, updates and deletes", async () => {
    const { event } = await mkEvent({ title: "Mostra d'Autunno", location: "Roma" });
    expect(event.slug).toBe("mostra-d-autunno");
    const upd = await updateEvent(
      db,
      event.id,
      okEvent({ title: "Mostra d'Autunno", endDate: "2024-06-01", summary: "Nuovo" }),
    );
    expect(upd?.event.endDate).toBe("2024-06-01");
    expect(upd?.event.location).toBeNull();
    expect(await deleteEvent(db, event.id)).not.toBeNull();
    expect(await db.select().from(events)).toHaveLength(0);
    expect(await deleteEvent(db, event.id)).toBeNull();
  });
});

describe("unique slugs", () => {
  it("appends -2, -3 for duplicate painting titles", async () => {
    const a = await mkPainting();
    const b = await mkPainting();
    const c = await mkPainting();
    expect([a, b, c].map((r) => r.painting.slug)).toEqual([
      "senza-titolo",
      "senza-titolo-2",
      "senza-titolo-3",
    ]);
  });

  it("appends a suffix for duplicate event titles", async () => {
    const a = await mkEvent({ title: "Senza Titolo" });
    const b = await mkEvent({ title: "Senza Titolo" });
    expect([a.event.slug, b.event.slug]).toEqual(["senza-titolo", "senza-titolo-2"]);
  });

  it("is not fooled by prefix-sharing slugs", async () => {
    await mkPainting({ title: "Luna Piena" });
    expect((await mkPainting({ title: "Luna" })).painting.slug).toBe("luna");
    expect((await mkPainting({ title: "Luna" })).painting.slug).toBe("luna-2");
  });

  it("keeps the slug on update and avoids collisions when renaming", async () => {
    const a = await mkPainting({ title: "Alfa" });
    const b = await mkPainting({ title: "Beta" });
    const renamed = await updatePainting(db, b.painting.id, okPainting({ title: "Alfa" }));
    expect(renamed?.painting.slug).toBe("alfa-2");
    const same = await updatePainting(db, a.painting.id, okPainting({ title: "Alfa" }));
    expect(same?.painting.slug).toBe("alfa");
  });

  it("slugifies accents, symbols and empty titles", () => {
    expect(slugify("Època  d'Oro!")).toBe("epoca-d-oro");
    expect(slugify("???")).toBe("senza-titolo");
  });
});

describe("many-to-many linking", () => {
  it("links from the painting side", async () => {
    const e1 = (await mkEvent({ title: "E1" })).event;
    const e2 = (await mkEvent({ title: "E2" })).event;
    const { painting, affected } = await mkPainting({ eventIds: [e1.id, e2.id] });
    expect(await links()).toEqual([`${painting.id}-${e1.id}`, `${painting.id}-${e2.id}`].sort());
    expect(affected.eventSlugs.sort()).toEqual(["e1", "e2"]);
  });

  it("replaces (not duplicates) links when re-saving the painting", async () => {
    const e1 = (await mkEvent({ title: "E1" })).event;
    const e2 = (await mkEvent({ title: "E2" })).event;
    const e3 = (await mkEvent({ title: "E3" })).event;
    const { painting } = await mkPainting({ eventIds: [e1.id, e2.id] });

    const res = await updatePainting(db, painting.id, okPainting({ eventIds: [e2.id, e3.id, e3.id] }));
    expect(await links()).toEqual([`${painting.id}-${e2.id}`, `${painting.id}-${e3.id}`]);
    // the unlinked event (e1) must be revalidated too
    expect(res?.affected.eventSlugs.sort()).toEqual(["e1", "e2", "e3"]);
  });

  it("relinks from the event side, leaving other events untouched", async () => {
    const p1 = (await mkPainting({ title: "P1" })).painting;
    const p2 = (await mkPainting({ title: "P2" })).painting;
    const p3 = (await mkPainting({ title: "P3" })).painting;
    const { event } = await mkEvent({ paintingIds: [p1.id, p2.id] });
    const other = (await mkEvent({ title: "Altra", paintingIds: [p1.id] })).event;

    const res = await updateEvent(db, event.id, okEvent({ paintingIds: [p3.id] }));
    expect(await links()).toEqual([`${p1.id}-${other.id}`, `${p3.id}-${event.id}`].sort());
    expect(res?.affected.paintingSlugs.sort()).toEqual(["p1", "p2", "p3"]);
  });

  it("clears all links when the list is emptied", async () => {
    const p = (await mkPainting()).painting;
    const { event } = await mkEvent({ paintingIds: [p.id] });
    await updateEvent(db, event.id, okEvent({ paintingIds: [] }));
    expect(await links()).toEqual([]);
  });

  it("ignores ids that do not exist instead of failing", async () => {
    const e = (await mkEvent()).event;
    const { painting } = await mkPainting({ eventIds: [e.id, 4242] });
    expect(await links()).toEqual([`${painting.id}-${e.id}`]);
  });

  it("rolls back the whole update if the link sync fails", async () => {
    const { painting } = await mkPainting({ title: "Originale" });
    const data = okPainting({ title: "Modificato" });
    (data as { eventIds: unknown }).eventIds = [{}]; // force a failure inside the transaction
    await expect(updatePainting(db, painting.id, data)).rejects.toThrow();
    const [row] = await db.select().from(paintings).where(eq(paintings.id, painting.id));
    expect(row.title).toBe("Originale");
  });
});

describe("cascade deletion", () => {
  it("removes join rows (only) when a painting is deleted", async () => {
    const e = (await mkEvent()).event;
    const keep = (await mkPainting({ title: "Resta", eventIds: [e.id] })).painting;
    const gone = (await mkPainting({ title: "Via", eventIds: [e.id] })).painting;
    await deletePainting(db, gone.id);
    expect(await links()).toEqual([`${keep.id}-${e.id}`]);
    expect(await db.select().from(events)).toHaveLength(1);
  });

  it("removes join rows (only) when an event is deleted", async () => {
    const p = (await mkPainting()).painting;
    const keep = (await mkEvent({ title: "Resta", paintingIds: [p.id] })).event;
    const gone = (await mkEvent({ title: "Via", paintingIds: [p.id] })).event;
    const res = await deleteEvent(db, gone.id);
    expect(res?.paintingSlugs).toEqual([p.slug]);
    expect(await links()).toEqual([`${p.id}-${keep.id}`]);
    expect(await db.select().from(paintings)).toHaveLength(1);
  });

  it("DB-level foreign keys cascade even without the helper functions", async () => {
    const p = (await mkPainting()).painting;
    await mkEvent({ paintingIds: [p.id] });
    await db.delete(paintings).where(eq(paintings.id, p.id));
    expect(await links()).toEqual([]);
  });
});

describe("revalidation paths", () => {
  it("covers home, lists and every affected detail page", async () => {
    const e = (await mkEvent({ title: "Gala" })).event;
    const { affected } = await mkPainting({ title: "Rosa", eventIds: [e.id] });
    expect(pathsFor(affected)).toEqual(
      expect.arrayContaining(["/", "/opere", "/opere/rosa", "/eventi", "/eventi/gala"]),
    );
  });
});
