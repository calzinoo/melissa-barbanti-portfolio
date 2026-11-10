import { and, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { events, paintings, paintingsToEvents, profileSettings } from "@/db/schema";
import { resolveHome, type HomeData } from "./home";

export type { HeroItem, HomeData } from "./home";

export async function getHomeData(): Promise<HomeData> {
  "use cache";
  cacheTag("home", "paintings", "events");
  cacheLife("hours");
  return resolveHome(db);
}

export type Contacts = { instagramUrl: string | null; email: string | null };

export async function getContacts(): Promise<Contacts> {
  "use cache";
  cacheTag("profile");
  cacheLife("hours");
  const [row] = await db
    .select({ instagramUrl: profileSettings.instagramUrl, email: profileSettings.email })
    .from(profileSettings)
    .where(and(eq(profileSettings.id, 1)));
  return { instagramUrl: row?.instagramUrl ?? null, email: row?.email ?? null };
}

export async function getGalleryData() {
  "use cache";
  cacheTag("paintings", "events");
  cacheLife("hours");
  const [all, links] = await Promise.all([
    db.select().from(paintings).orderBy(desc(paintings.date)),
    db.selectDistinct({ paintingId: paintingsToEvents.paintingId }).from(paintingsToEvents),
  ]);
  return { paintings: all, exhibitedIds: links.map((l) => l.paintingId) };
}

export async function getPaintingBySlug(slug: string) {
  "use cache";
  cacheTag("paintings", "events");
  cacheLife("hours");
  const [painting] = await db.select().from(paintings).where(eq(paintings.slug, slug));
  if (!painting) return null;
  const linked = await db
    .select({ event: events })
    .from(paintingsToEvents)
    .innerJoin(events, eq(paintingsToEvents.eventId, events.id))
    .where(eq(paintingsToEvents.paintingId, painting.id))
    .orderBy(desc(events.startDate));
  return { painting, events: linked.map((l) => l.event) };
}

export async function getAllEvents() {
  "use cache";
  cacheTag("events");
  cacheLife("hours");
  return db.select().from(events).orderBy(desc(events.startDate));
}

export async function getEventBySlug(slug: string) {
  "use cache";
  cacheTag("paintings", "events");
  cacheLife("hours");
  const [event] = await db.select().from(events).where(eq(events.slug, slug));
  if (!event) return null;
  const linked = await db
    .select({ painting: paintings })
    .from(paintingsToEvents)
    .innerJoin(paintings, eq(paintingsToEvents.paintingId, paintings.id))
    .where(eq(paintingsToEvents.eventId, event.id))
    .orderBy(desc(paintings.date));
  return { event, paintings: linked.map((l) => l.painting) };
}

export async function getProfile() {
  "use cache";
  cacheTag("profile");
  cacheLife("hours");
  const [row] = await db.select().from(profileSettings).where(eq(profileSettings.id, 1));
  return row ?? null;
}
