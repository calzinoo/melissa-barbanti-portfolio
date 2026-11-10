import { eq, inArray } from "drizzle-orm";
import {
  events,
  homeSettings,
  paintings,
  paintingsToEvents,
  type ItemType,
} from "@/db/schema";
import type { Database, DbOrTx } from "@/db/types";
import { parseManualSlots } from "./home";
import { uniqueSlug } from "./slug";
import type { EventInput, PaintingInput } from "./validation";

/** Slugs touched by a mutation, so callers can revalidate every affected route. */
export type Affected = { paintingSlugs: string[]; eventSlugs: string[] };

const unique = <T,>(a: T[]) => [...new Set(a)];

async function slugsOf(db: DbOrTx, table: typeof paintings | typeof events, ids: number[]) {
  if (!ids.length) return [];
  const rows = await db.select({ slug: table.slug }).from(table).where(inArray(table.id, ids));
  return rows.map((r) => r.slug);
}

/** Replaces all links of one painting, ignoring ids that no longer exist. */
async function syncEventsForPainting(tx: DbOrTx, paintingId: number, eventIds: number[]) {
  const valid = eventIds.length
    ? (await tx.select({ id: events.id }).from(events).where(inArray(events.id, eventIds))).map((r) => r.id)
    : [];
  await tx.delete(paintingsToEvents).where(eq(paintingsToEvents.paintingId, paintingId));
  if (valid.length) {
    await tx.insert(paintingsToEvents).values(valid.map((eventId) => ({ paintingId, eventId })));
  }
  return valid;
}

/** Replaces all links of one event, ignoring ids that no longer exist. */
async function syncPaintingsForEvent(tx: DbOrTx, eventId: number, paintingIds: number[]) {
  const valid = paintingIds.length
    ? (await tx.select({ id: paintings.id }).from(paintings).where(inArray(paintings.id, paintingIds))).map((r) => r.id)
    : [];
  await tx.delete(paintingsToEvents).where(eq(paintingsToEvents.eventId, eventId));
  if (valid.length) {
    await tx.insert(paintingsToEvents).values(valid.map((paintingId) => ({ paintingId, eventId })));
  }
  return valid;
}

/** Removes references to a deleted item from the home settings. */
async function cleanHomeSettings(tx: DbOrTx, type: ItemType, id: number) {
  const [s] = await tx.select().from(homeSettings).where(eq(homeSettings.id, 1));
  if (!s) return;
  const slots = parseManualSlots(s.manualSlotsJson).filter((x) => !(x.type === type && x.id === id));
  const heroGone = s.heroItemType === type && s.heroItemId === id;
  await tx
    .update(homeSettings)
    .set({
      manualSlotsJson: JSON.stringify(slots),
      ...(heroGone ? { heroItemType: null, heroItemId: null } : {}),
    })
    .where(eq(homeSettings.id, 1));
}

const paintingValues = (i: PaintingInput) => ({
  title: i.title,
  mainImageUrl: i.mainImageUrl,
  detailImagesJson: JSON.stringify(i.detailImages),
  description: i.description,
  poem: i.poem,
  date: i.date,
  dimensions: i.dimensions,
  technique: i.technique,
  availability: i.availability,
});

const eventValues = (i: EventInput) => ({
  title: i.title,
  summary: i.summary,
  description: i.description,
  startDate: i.startDate,
  endDate: i.endDate,
  location: i.location,
  coverImageUrl: i.coverImageUrl,
  eventImagesJson: JSON.stringify(i.eventImages),
});

export async function createPainting(db: Database, input: PaintingInput) {
  return db.transaction(async (tx) => {
    const slug = await uniqueSlug(tx, paintings, input.title);
    const [row] = await tx.insert(paintings).values({ ...paintingValues(input), slug }).returning();
    const linked = await syncEventsForPainting(tx, row.id, input.eventIds);
    const affected: Affected = { paintingSlugs: [slug], eventSlugs: await slugsOf(tx, events, linked) };
    return { painting: row, affected };
  });
}

export async function updatePainting(db: Database, id: number, input: PaintingInput) {
  return db.transaction(async (tx) => {
    const [old] = await tx.select().from(paintings).where(eq(paintings.id, id));
    if (!old) return null;
    const slug = old.title === input.title ? old.slug : await uniqueSlug(tx, paintings, input.title, id);
    const [row] = await tx.update(paintings).set({ ...paintingValues(input), slug }).where(eq(paintings.id, id)).returning();
    const before = (await tx.select().from(paintingsToEvents).where(eq(paintingsToEvents.paintingId, id))).map((l) => l.eventId);
    const linked = await syncEventsForPainting(tx, id, input.eventIds);
    const eventSlugs = await slugsOf(tx, events, unique([...before, ...linked]));
    return { painting: row, affected: { paintingSlugs: unique([old.slug, slug]), eventSlugs } as Affected };
  });
}

export async function deletePainting(db: Database, id: number) {
  return db.transaction(async (tx) => {
    const [old] = await tx.select().from(paintings).where(eq(paintings.id, id));
    if (!old) return null;
    const linked = (await tx.select().from(paintingsToEvents).where(eq(paintingsToEvents.paintingId, id))).map((l) => l.eventId);
    const eventSlugs = await slugsOf(tx, events, linked);
    // Explicit deletes: do not rely on PRAGMA foreign_keys being enabled.
    await tx.delete(paintingsToEvents).where(eq(paintingsToEvents.paintingId, id));
    await tx.delete(paintings).where(eq(paintings.id, id));
    await cleanHomeSettings(tx, "painting", id);
    return { paintingSlugs: [old.slug], eventSlugs } as Affected;
  });
}

export async function createEvent(db: Database, input: EventInput) {
  return db.transaction(async (tx) => {
    const slug = await uniqueSlug(tx, events, input.title);
    const [row] = await tx.insert(events).values({ ...eventValues(input), slug }).returning();
    const linked = await syncPaintingsForEvent(tx, row.id, input.paintingIds);
    const affected: Affected = { eventSlugs: [slug], paintingSlugs: await slugsOf(tx, paintings, linked) };
    return { event: row, affected };
  });
}

export async function updateEvent(db: Database, id: number, input: EventInput) {
  return db.transaction(async (tx) => {
    const [old] = await tx.select().from(events).where(eq(events.id, id));
    if (!old) return null;
    const slug = old.title === input.title ? old.slug : await uniqueSlug(tx, events, input.title, id);
    const [row] = await tx.update(events).set({ ...eventValues(input), slug }).where(eq(events.id, id)).returning();
    const before = (await tx.select().from(paintingsToEvents).where(eq(paintingsToEvents.eventId, id))).map((l) => l.paintingId);
    const linked = await syncPaintingsForEvent(tx, id, input.paintingIds);
    const paintingSlugs = await slugsOf(tx, paintings, unique([...before, ...linked]));
    return { event: row, affected: { eventSlugs: unique([old.slug, slug]), paintingSlugs } as Affected };
  });
}

export async function deleteEvent(db: Database, id: number) {
  return db.transaction(async (tx) => {
    const [old] = await tx.select().from(events).where(eq(events.id, id));
    if (!old) return null;
    const linked = (await tx.select().from(paintingsToEvents).where(eq(paintingsToEvents.eventId, id))).map((l) => l.paintingId);
    const paintingSlugs = await slugsOf(tx, paintings, linked);
    await tx.delete(paintingsToEvents).where(eq(paintingsToEvents.eventId, id));
    await tx.delete(events).where(eq(events.id, id));
    await cleanHomeSettings(tx, "event", id);
    return { eventSlugs: [old.slug], paintingSlugs } as Affected;
  });
}
