import { desc, eq, inArray } from "drizzle-orm";
import {
  events,
  homeSettings,
  paintings,
  type Event,
  type ItemType,
  type ManualSlot,
  type Painting,
} from "@/db/schema";
import type { DbOrTx } from "@/db/types";
import { parseJsonArray } from "./format";
import { MAX_SLOTS } from "./home-constants";

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

export const MAX_MANUAL_SLOTS = MAX_SLOTS;
const HOME_PAINTINGS = 6;
const HOME_EVENTS = 3;

/** Parses `manualSlotsJson`, dropping malformed and duplicate entries; max 7, ordered by slot. */
export function parseManualSlots(json: string | null | undefined): ManualSlot[] {
  const seen = new Set<string>();
  return parseJsonArray<unknown>(json)
    .filter((s): s is ManualSlot => {
      if (!s || typeof s !== "object") return false;
      const { slot, type, id } = s as Record<string, unknown>;
      return (
        typeof slot === "number" &&
        Number.isFinite(slot) &&
        (type === "painting" || type === "event") &&
        typeof id === "number" &&
        Number.isInteger(id)
      );
    })
    .sort((a, b) => a.slot - b.slot)
    .filter((s) => {
      const key = `${s.type}:${s.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_MANUAL_SLOTS);
}

/** Resolves slots to rows, silently skipping items that no longer exist. */
export async function resolveManualSlots(db: DbOrTx, slots: ManualSlot[]) {
  const idsOf = (type: ItemType) => slots.filter((s) => s.type === type).map((s) => s.id);
  const pIds = idsOf("painting");
  const eIds = idsOf("event");
  const [pRows, eRows] = await Promise.all([
    pIds.length ? db.select().from(paintings).where(inArray(paintings.id, pIds)) : [],
    eIds.length ? db.select().from(events).where(inArray(events.id, eIds)) : [],
  ]);
  const pick = <T extends { id: number }>(rows: T[], ids: number[]) =>
    ids.map((id) => rows.find((r) => r.id === id)).filter((r): r is T => Boolean(r));
  return { paintings: pick(pRows, pIds), events: pick(eRows, eIds) };
}

const latestPainting = async (db: DbOrTx) =>
  (await db.select().from(paintings).orderBy(desc(paintings.date), desc(paintings.id)).limit(1))[0];

/** Resolves the hero; a missing pinned item falls back to the latest painting. */
export async function resolveHero(
  db: DbOrTx,
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
  const pinned =
    type === "painting" && id != null
      ? (await db.select().from(paintings).where(eq(paintings.id, id)))[0]
      : undefined;
  const p = pinned ?? (await latestPainting(db));
  if (!p) return null;
  return {
    type: "painting",
    slug: p.slug,
    title: p.title,
    imageUrl: p.mainImageUrl,
    excerpt: p.poem?.split("\n").slice(0, 4).join("\n") ?? null,
    meta: [p.technique, p.dimensions].filter(Boolean).join(" · ") || null,
  };
}

export async function resolveHome(db: DbOrTx): Promise<HomeData> {
  const [settings] = await db.select().from(homeSettings).where(eq(homeSettings.id, 1));
  const mode = settings?.mode ?? "auto";
  const hero = await resolveHero(db, settings?.heroItemType ?? null, settings?.heroItemId ?? null);

  if (mode === "manual") {
    const slots = parseManualSlots(settings?.manualSlotsJson);
    return { mode, hero, ...(await resolveManualSlots(db, slots)) };
  }
  const [latestPaintings, latestEvents] = await Promise.all([
    db.select().from(paintings).orderBy(desc(paintings.date), desc(paintings.id)).limit(HOME_PAINTINGS),
    db.select().from(events).orderBy(desc(events.startDate), desc(events.id)).limit(HOME_EVENTS),
  ]);
  return { mode, hero, paintings: latestPaintings, events: latestEvents };
}
