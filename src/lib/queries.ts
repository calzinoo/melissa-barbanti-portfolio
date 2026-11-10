import { and, desc, eq, inArray } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import {
  events,
  homeSettings,
  paintings,
  paintingsToEvents,
  profileSettings,
  type Event,
  type ItemType,
  type ManualSlot,
  type Painting,
} from "@/db/schema";
import { parseJsonArray } from "./format";

export type HeroItem = {
  type: ItemType;
  slug: string;
  title: string;
  imageUrl: string | null;
  excerpt: string | null;
  meta: string | null;
};

export type HomeData = {
  hero: HeroItem | null;
  paintings: Painting[];
  events: Event[];
  mode: "auto" | "manual";
};

const HOME_PAINTINGS = 6;
const HOME_EVENTS = 3;

async function resolveManual(slots: ManualSlot[]) {
  const ordered = [...slots].sort((a, b) => a.slot - b.slot).slice(0, 7);
  const ids = (type: ItemType) =>
    ordered.filter((s) => s.type === type).map((s) => s.id);
  const [pRows, eRows] = await Promise.all([
    ids("painting").length
      ? db.select().from(paintings).where(inArray(paintings.id, ids("painting")))
      : [],
    ids("event").length
      ? db.select().from(events).where(inArray(events.id, ids("event")))
      : [],
  ]);
  const pick = <T extends { id: number }>(rows: T[], type: ItemType) =>
    ordered
      .filter((s) => s.type === type)
      .map((s) => rows.find((r) => r.id === s.id))
      .filter((r): r is T => Boolean(r));
  return { paintings: pick(pRows, "painting"), events: pick(eRows, "event") };
}

async function resolveHero(
  type: ItemType | null,
  id: number | null,
): Promise<HeroItem | null> {
  if (type === "event" && id != null) {
    const [e] = await db.select().from(events).where(eq(events.id, id));
    if (e) {
      return {
        type: "event",
        slug: e.slug,
        title: e.title,
        imageUrl: e.coverImageUrl ?? parseJsonArray<string>(e.eventImagesJson)[0] ?? null,
        excerpt: e.summary,
        meta: e.location,
      };
    }
  }
  const [p] =
    type === "painting" && id != null
      ? await db.select().from(paintings).where(eq(paintings.id, id))
      : await db.select().from(paintings).orderBy(desc(paintings.date)).limit(1);
  const fallback =
    p ?? (await db.select().from(paintings).orderBy(desc(paintings.date)).limit(1))[0];
  if (!fallback) return null;
  return {
    type: "painting",
    slug: fallback.slug,
    title: fallback.title,
    imageUrl: fallback.mainImageUrl,
    excerpt: fallback.poem?.split("\n").slice(0, 4).join("\n") ?? null,
    meta: [fallback.technique, fallback.dimensions].filter(Boolean).join(" · ") || null,
  };
}

export async function getHomeData(): Promise<HomeData> {
  "use cache";
  cacheTag("home", "paintings", "events");
  cacheLife("hours");

  const [settings] = await db.select().from(homeSettings).where(eq(homeSettings.id, 1));
  const mode = settings?.mode ?? "auto";
  const hero = await resolveHero(settings?.heroItemType ?? null, settings?.heroItemId ?? null);

  if (mode === "manual") {
    const slots = parseJsonArray<ManualSlot>(settings?.manualSlotsJson);
    return { mode, hero, ...(await resolveManual(slots)) };
  }
  const [latestPaintings, latestEvents] = await Promise.all([
    db.select().from(paintings).orderBy(desc(paintings.date)).limit(HOME_PAINTINGS),
    db.select().from(events).orderBy(desc(events.startDate)).limit(HOME_EVENTS),
  ]);
  return { mode, hero, paintings: latestPaintings, events: latestEvents };
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
