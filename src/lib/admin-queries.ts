import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { events, homeSettings, paintings, paintingsToEvents, profileSettings } from "@/db/schema";
import { parseManualSlots } from "./home";

// Admin reads are intentionally uncached: the artist must always see fresh data.

export type PickerItem = {
  type: "painting" | "event";
  id: number;
  title: string;
  imageUrl: string | null;
  subtitle: string;
};

export async function listPaintingsAdmin() {
  return db
    .select({
      id: paintings.id,
      title: paintings.title,
      mainImageUrl: paintings.mainImageUrl,
      date: paintings.date,
      dimensions: paintings.dimensions,
      availability: paintings.availability,
      eventCount: sql<number>`(select count(*) from ${paintingsToEvents} where ${paintingsToEvents.paintingId} = ${paintings.id})`,
    })
    .from(paintings)
    .orderBy(desc(paintings.date), desc(paintings.id));
}

export async function listEventsAdmin() {
  return db
    .select({
      id: events.id,
      title: events.title,
      coverImageUrl: events.coverImageUrl,
      startDate: events.startDate,
      endDate: events.endDate,
      location: events.location,
      paintingCount: sql<number>`(select count(*) from ${paintingsToEvents} where ${paintingsToEvents.eventId} = ${events.id})`,
    })
    .from(events)
    .orderBy(desc(events.startDate), desc(events.id));
}

export type EventOption = { id: number; title: string; startDate: string };
export type PaintingOption = { id: number; title: string; imageUrl: string };

export const listEventOptions = (): Promise<EventOption[]> =>
  db
    .select({ id: events.id, title: events.title, startDate: events.startDate })
    .from(events)
    .orderBy(desc(events.startDate));

export const listPaintingOptions = (): Promise<PaintingOption[]> =>
  db
    .select({ id: paintings.id, title: paintings.title, imageUrl: paintings.mainImageUrl })
    .from(paintings)
    .orderBy(asc(paintings.title));

export async function getPaintingForEdit(id: number) {
  const [painting] = await db.select().from(paintings).where(eq(paintings.id, id));
  if (!painting) return null;
  const links = await db.select().from(paintingsToEvents).where(eq(paintingsToEvents.paintingId, id));
  return { painting, eventIds: links.map((l) => l.eventId) };
}

export async function getEventForEdit(id: number) {
  const [event] = await db.select().from(events).where(eq(events.id, id));
  if (!event) return null;
  const links = await db.select().from(paintingsToEvents).where(eq(paintingsToEvents.eventId, id));
  return { event, paintingIds: links.map((l) => l.paintingId) };
}

export const getProfileAdmin = async () =>
  (await db.select().from(profileSettings).where(eq(profileSettings.id, 1)))[0] ?? null;

export async function getHomeAdminData() {
  const [[settings], pRows, eRows] = await Promise.all([
    db.select().from(homeSettings).where(eq(homeSettings.id, 1)),
    db.select().from(paintings).orderBy(desc(paintings.date)),
    db.select().from(events).orderBy(desc(events.startDate)),
  ]);
  const items: PickerItem[] = [
    ...pRows.map((p) => ({
      type: "painting" as const,
      id: p.id,
      title: p.title,
      imageUrl: p.mainImageUrl,
      subtitle: [p.date.slice(0, 4), p.technique].filter(Boolean).join(" · "),
    })),
    ...eRows.map((e) => ({
      type: "event" as const,
      id: e.id,
      title: e.title,
      imageUrl: e.coverImageUrl,
      subtitle: [e.startDate.slice(0, 4), e.location].filter(Boolean).join(" · "),
    })),
  ];
  return {
    mode: settings?.mode ?? "auto",
    heroType: settings?.heroItemType ?? null,
    heroId: settings?.heroItemId ?? null,
    slots: parseManualSlots(settings?.manualSlotsJson),
    items,
  };
}
