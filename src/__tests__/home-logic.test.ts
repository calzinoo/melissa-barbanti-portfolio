import { beforeEach, describe, expect, it } from "vitest";
import { events, homeSettings, paintings } from "@/db/schema";
import type { Database } from "@/db/types";
import { createEvent, createPainting, deleteEvent, deletePainting } from "@/lib/content";
import { parseJsonArray } from "@/lib/format";
import { parseManualSlots, resolveHome } from "@/lib/home";
import { saveHomeSettings } from "@/lib/settings";
import { validateEvent, validatePainting } from "@/lib/validation";
import { createTestDb, eventInput, paintingInput } from "./helpers/test-db";

let db: Database;
beforeEach(async () => {
  db = await createTestDb();
});

async function mkPainting(title: string, date: string) {
  const v = validatePainting(paintingInput({ title, date }));
  if (!v.ok) throw new Error("invalid");
  return (await createPainting(db, v.data)).painting;
}
async function mkEvent(title: string, startDate: string, extra: Record<string, unknown> = {}) {
  const v = validateEvent(eventInput({ title, startDate, ...extra }));
  if (!v.ok) throw new Error("invalid");
  return (await createEvent(db, v.data)).event;
}
const setHome = (values: Partial<typeof homeSettings.$inferInsert>) =>
  db.insert(homeSettings).values({ id: 1, ...values });

describe("auto mode", () => {
  it("orders paintings by date DESC and events by startDate DESC", async () => {
    await mkPainting("Vecchio", "2020-01-01");
    await mkPainting("Nuovo", "2024-06-01");
    await mkPainting("Medio", "2022-03-03");
    await mkEvent("E-old", "2019-01-01");
    await mkEvent("E-new", "2025-02-02");
    await mkEvent("E-mid", "2023-05-05");

    const home = await resolveHome(db);
    expect(home.mode).toBe("auto");
    expect(home.paintings.map((p) => p.title)).toEqual(["Nuovo", "Medio", "Vecchio"]);
    expect(home.events.map((e) => e.title)).toEqual(["E-new", "E-mid", "E-old"]);
  });

  it("defaults to auto without a home_settings row, and caps results (6 paintings, 3 events)", async () => {
    for (let i = 1; i <= 9; i++) await mkPainting(`P${i}`, `2024-01-0${i}`);
    for (let i = 1; i <= 5; i++) await mkEvent(`E${i}`, `2024-02-0${i}`);
    const home = await resolveHome(db);
    expect(home.mode).toBe("auto");
    expect(home.paintings).toHaveLength(6);
    expect(home.paintings[0].title).toBe("P9");
    expect(home.events.map((e) => e.title)).toEqual(["E5", "E4", "E3"]);
  });

  it("uses the latest painting as hero when none is pinned", async () => {
    await mkPainting("Vecchio", "2020-01-01");
    await mkPainting("Nuovo", "2024-06-01");
    expect((await resolveHome(db)).hero?.title).toBe("Nuovo");
  });

  it("is empty (hero null) on an empty database", async () => {
    expect(await resolveHome(db)).toEqual({ mode: "auto", hero: null, paintings: [], events: [] });
  });
});

describe("manual mode", () => {
  it("renders exactly the chosen items, in slot order, not date order", async () => {
    const ps = [];
    for (let i = 1; i <= 5; i++) ps.push(await mkPainting(`P${i}`, `2024-01-0${i}`));
    const es = [await mkEvent("E1", "2024-01-01"), await mkEvent("E2", "2025-01-01")];
    await setHome({
      mode: "manual",
      manualSlotsJson: JSON.stringify([
        { slot: 4, type: "painting", id: ps[0].id },
        { slot: 1, type: "event", id: es[0].id },
        { slot: 3, type: "painting", id: ps[4].id },
        { slot: 2, type: "painting", id: ps[2].id },
        { slot: 5, type: "event", id: es[1].id },
        { slot: 6, type: "painting", id: ps[1].id },
        { slot: 7, type: "painting", id: ps[3].id },
      ]),
    });
    const home = await resolveHome(db);
    expect(home.mode).toBe("manual");
    expect(home.paintings.map((p) => p.title)).toEqual(["P3", "P5", "P1", "P2", "P4"]);
    expect(home.events.map((e) => e.title)).toEqual(["E1", "E2"]);
  });

  it("never renders more than 7 slots", async () => {
    const ids: number[] = [];
    for (let i = 1; i <= 9; i++) ids.push((await mkPainting(`P${i}`, "2024-01-01")).id);
    await setHome({
      mode: "manual",
      manualSlotsJson: JSON.stringify(ids.map((id, i) => ({ slot: i + 1, type: "painting", id }))),
    });
    expect((await resolveHome(db)).paintings).toHaveLength(7);
  });

  it("does not render the same item twice", async () => {
    const p = await mkPainting("P", "2024-01-01");
    await setHome({
      mode: "manual",
      manualSlotsJson: JSON.stringify([
        { slot: 1, type: "painting", id: p.id },
        { slot: 2, type: "painting", id: p.id },
      ]),
    });
    expect((await resolveHome(db)).paintings).toHaveLength(1);
  });

  it("an empty or malformed slot list renders no cards instead of throwing", async () => {
    await setHome({ mode: "manual", manualSlotsJson: "not json" });
    const home = await resolveHome(db);
    expect(home.paintings).toEqual([]);
    expect(home.events).toEqual([]);
  });
});

describe("resilience to deleted items", () => {
  it("skips missing ids in manualSlotsJson (raw deletes leave orphans)", async () => {
    const keep = await mkPainting("Keep", "2024-01-01");
    const gone = await mkPainting("Gone", "2024-01-02");
    const ev = await mkEvent("Ev", "2024-01-01");
    await setHome({
      mode: "manual",
      manualSlotsJson: JSON.stringify([
        { slot: 1, type: "painting", id: gone.id },
        { slot: 2, type: "painting", id: keep.id },
        { slot: 3, type: "event", id: ev.id },
        { slot: 4, type: "event", id: 9999 },
      ]),
    });
    // bypass the helpers on purpose: simulate stale references
    const { eq } = await import("drizzle-orm");
    await db.delete(paintings).where(eq(paintings.id, gone.id));
    await db.delete(events).where(eq(events.id, ev.id));

    const home = await resolveHome(db);
    expect(home.paintings.map((p) => p.title)).toEqual(["Keep"]);
    expect(home.events).toEqual([]);
  });

  it("falls back to the latest painting when the pinned hero painting no longer exists", async () => {
    await mkPainting("Latest", "2024-01-01");
    await setHome({ heroItemType: "painting", heroItemId: 12345 });
    expect((await resolveHome(db)).hero?.title).toBe("Latest");
  });

  it("falls back when the pinned hero event no longer exists", async () => {
    await mkPainting("Latest", "2024-01-01");
    await setHome({ heroItemType: "event", heroItemId: 777 });
    const hero = (await resolveHome(db)).hero;
    expect(hero?.type).toBe("painting");
    expect(hero?.title).toBe("Latest");
  });

  it("returns a null hero (no crash) if the pinned item is gone and nothing else exists", async () => {
    await setHome({ heroItemType: "event", heroItemId: 1 });
    expect((await resolveHome(db)).hero).toBeNull();
  });

  it("deleting a painting cleans its slot and hero pin from home_settings", async () => {
    const a = await mkPainting("A", "2024-01-01");
    const b = await mkPainting("B", "2024-01-02");
    await setHome({
      mode: "manual",
      heroItemType: "painting",
      heroItemId: a.id,
      manualSlotsJson: JSON.stringify([
        { slot: 1, type: "painting", id: a.id },
        { slot: 2, type: "painting", id: b.id },
      ]),
    });
    await deletePainting(db, a.id);
    const [s] = await db.select().from(homeSettings);
    expect(s.heroItemType).toBeNull();
    expect(s.heroItemId).toBeNull();
    expect(parseManualSlots(s.manualSlotsJson)).toEqual([{ slot: 2, type: "painting", id: b.id }]);
  });

  it("deleting an event cleans its slot, but keeps a hero pointing at a painting with the same id", async () => {
    const p = await mkPainting("P", "2024-01-01");
    const e = await mkEvent("E", "2024-01-01");
    expect(p.id).toBe(e.id); // same numeric id, different type
    await setHome({
      mode: "manual",
      heroItemType: "painting",
      heroItemId: p.id,
      manualSlotsJson: JSON.stringify([
        { slot: 1, type: "event", id: e.id },
        { slot: 2, type: "painting", id: p.id },
      ]),
    });
    await deleteEvent(db, e.id);
    const [s] = await db.select().from(homeSettings);
    expect(s.heroItemType).toBe("painting");
    expect(parseManualSlots(s.manualSlotsJson)).toEqual([{ slot: 2, type: "painting", id: p.id }]);
  });
});

describe("saveHomeSettings (admin home manager)", () => {
  it("drops non-existent references and renumbers slots", async () => {
    const p = await mkPainting("P", "2024-01-01");
    const res = await saveHomeSettings(db, {
      mode: "manual",
      heroItemType: "event",
      heroItemId: 404,
      slots: [
        { type: "painting", id: 404 },
        { type: "painting", id: p.id },
      ],
    });
    expect(res.ok).toBe(true);
    const [s] = await db.select().from(homeSettings);
    expect(s.heroItemType).toBeNull();
    expect(JSON.parse(s.manualSlotsJson)).toEqual([{ slot: 1, type: "painting", id: p.id }]);
  });

  it("rejects more than 7 slots and invalid modes, and upserts the single row", async () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ type: "painting" as const, id: i + 1 }));
    expect((await saveHomeSettings(db, { mode: "manual", slots: many })).ok).toBe(false);
    expect((await saveHomeSettings(db, { mode: "weird" as "auto" })).ok).toBe(false);
    await saveHomeSettings(db, { mode: "auto" });
    await saveHomeSettings(db, { mode: "manual" });
    const rows = await db.select().from(homeSettings);
    expect(rows).toHaveLength(1);
    expect(rows[0].mode).toBe("manual");
  });
});

describe("safe JSON parsing", () => {
  it("parseJsonArray never throws and falls back to []", () => {
    for (const bad of [undefined, null, "", "   ", "{", "not json", "null", "42", '"str"', '{"a":1}']) {
      expect(parseJsonArray(bad)).toEqual([]);
    }
    expect(parseJsonArray<string>('["a","b"]')).toEqual(["a", "b"]);
  });

  it("parseManualSlots drops malformed entries", () => {
    const json = JSON.stringify([
      null,
      "x",
      { slot: "1", type: "painting", id: 1 },
      { slot: 1, type: "banner", id: 1 },
      { slot: 1, type: "painting", id: 1.5 },
      { slot: 2, type: "painting" },
      { slot: 3, type: "event", id: 8 },
    ]);
    expect(parseManualSlots(json)).toEqual([{ slot: 3, type: "event", id: 8 }]);
    expect(parseManualSlots("garbage")).toEqual([]);
  });
});
