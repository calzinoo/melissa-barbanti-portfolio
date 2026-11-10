import { desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import {
  events,
  paintings,
  paintingsToEvents,
  profileSettings,
  siteSettings,
  type Event,
  type Painting,
} from "@/db/schema";
import { resolveHome, type HomeData } from "./home";
import { DEFAULT_THEME, type SiteTheme } from "./theme";

export type { HeroItem, HomeData } from "./home";

/**
 * Runs a read query without ever throwing into a page (or the Vercel prerender): an empty or
 * not-yet-migrated database must degrade to `fallback`, not fail the build. Must be called
 * inside a "use cache" function: on failure the entry gets a short lifetime (minutes: still prerenderable) so the
 * fallback is not served for hours once the database is healthy again.
 */
async function safely<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (e) {
    console.error(`[queries] ${label} failed, serving fallback:`, e instanceof Error ? e.message : e);
    cacheLife("minutes");
    return fallback;
  }
}

const EMPTY_HOME: HomeData = { hero: null, paintings: [], events: [], mode: "auto" };

export async function getHomeData(): Promise<HomeData> {
  "use cache";
  cacheTag("home", "paintings", "events");
  cacheLife("hours");
  return safely("home", () => resolveHome(db), EMPTY_HOME);
}

export async function getSiteTheme(): Promise<SiteTheme> {
  "use cache";
  cacheTag("theme");
  cacheLife("hours");
  // Table not migrated yet: keep the site up with the default look.
  return safely(
    "theme",
    async () => {
      const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1));
      return row ? { wall: row.wallPreset, accent: row.accentColor } : DEFAULT_THEME;
    },
    DEFAULT_THEME,
  );
}

export type Contacts = { instagramUrl: string | null; email: string | null };

export async function getContacts(): Promise<Contacts> {
  "use cache";
  cacheTag("profile");
  cacheLife("hours");
  return safely(
    "contacts",
    async () => {
      const [row] = await db
        .select({ instagramUrl: profileSettings.instagramUrl, email: profileSettings.email })
        .from(profileSettings)
        .where(eq(profileSettings.id, 1));
      return { instagramUrl: row?.instagramUrl ?? null, email: row?.email ?? null };
    },
    { instagramUrl: null, email: null },
  );
}

export async function getGalleryData() {
  "use cache";
  cacheTag("paintings", "events");
  cacheLife("hours");
  return safely(
    "gallery",
    async () => {
      const [all, links] = await Promise.all([
        db.select().from(paintings).orderBy(desc(paintings.date)),
        db.selectDistinct({ paintingId: paintingsToEvents.paintingId }).from(paintingsToEvents),
      ]);
      return { paintings: all, exhibitedIds: links.map((l) => l.paintingId) };
    },
    { paintings: [] as Painting[], exhibitedIds: [] as number[] },
  );
}

export async function getPaintingBySlug(slug: string) {
  "use cache";
  cacheTag("paintings", "events");
  cacheLife("hours");
  return safely(
    "painting",
    async () => {
      const [painting] = await db.select().from(paintings).where(eq(paintings.slug, slug));
      if (!painting) return null;
      const linked = await db
        .select({ event: events })
        .from(paintingsToEvents)
        .innerJoin(events, eq(paintingsToEvents.eventId, events.id))
        .where(eq(paintingsToEvents.paintingId, painting.id))
        .orderBy(desc(events.startDate));
      return { painting, events: linked.map((l) => l.event) };
    },
    null,
  );
}

/**
 * Slugs for `generateStaticParams`, so detail pages are prerendered (instant navigation) instead of
 * rendered on demand. Cache Components requires at least one param at build time, so an empty or
 * unreachable database yields a placeholder slug that resolves to a 404.
 */
async function slugParams(label: string, run: () => Promise<{ slug: string }[]>) {
  try {
    const rows = await run();
    if (rows.length > 0) return rows;
  } catch (e) {
    console.error(`[queries] ${label} slugs failed:`, e instanceof Error ? e.message : e);
  }
  return [{ slug: "_" }];
}

export const getPaintingSlugs = () => slugParams("painting", () => db.select({ slug: paintings.slug }).from(paintings));
export const getEventSlugs = () => slugParams("event", () => db.select({ slug: events.slug }).from(events));

export async function getAllEvents() {
  "use cache";
  cacheTag("events");
  cacheLife("hours");
  return safely("events", () => db.select().from(events).orderBy(desc(events.startDate)), [] as Event[]);
}

export async function getEventBySlug(slug: string) {
  "use cache";
  cacheTag("paintings", "events");
  cacheLife("hours");
  return safely(
    "event",
    async () => {
      const [event] = await db.select().from(events).where(eq(events.slug, slug));
      if (!event) return null;
      const linked = await db
        .select({ painting: paintings })
        .from(paintingsToEvents)
        .innerJoin(paintings, eq(paintingsToEvents.paintingId, paintings.id))
        .where(eq(paintingsToEvents.eventId, event.id))
        .orderBy(desc(paintings.date));
      return { event, paintings: linked.map((l) => l.painting) };
    },
    null,
  );
}

export async function getProfile() {
  "use cache";
  cacheTag("profile");
  cacheLife("hours");
  return safely(
    "profile",
    async () => (await db.select().from(profileSettings).where(eq(profileSettings.id, 1)))[0] ?? null,
    null,
  );
}
