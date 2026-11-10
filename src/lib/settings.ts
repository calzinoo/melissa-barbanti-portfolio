import { eq, inArray } from "drizzle-orm";
import {
  events,
  homeSettings,
  paintings,
  profileSettings,
  siteSettings,
  type ItemType,
} from "@/db/schema";
import type { DbOrTx } from "@/db/types";
import { sanitizeTheme, type SiteTheme } from "./theme";
import { MAX_MANUAL_SLOTS, parseManualSlots } from "./home";
import { removedUrls } from "./content";
import { parseJsonArray } from "./format";
import type { Result } from "./validation";

export type HomeSettingsInput = {
  mode: "auto" | "manual";
  heroItemType: ItemType | null;
  heroItemId: number | null;
  slots: Array<{ type: ItemType; id: number }>;
};

export type ProfileInput = {
  avatarUrl: string | null;
  bioDescription: string;
  profileImages: string[];
  instagramUrl: string | null;
  email: string | null;
};

async function existingIds(db: DbOrTx, type: ItemType, ids: number[]): Promise<Set<number>> {
  if (!ids.length) return new Set();
  const table = type === "painting" ? paintings : events;
  const rows = await db.select({ id: table.id }).from(table).where(inArray(table.id, ids));
  return new Set(rows.map((r) => r.id));
}

/** Validates and saves home settings; references to missing items are dropped. */
export async function saveHomeSettings(
  db: DbOrTx,
  raw: Partial<HomeSettingsInput>,
): Promise<Result<null>> {
  const mode = raw.mode ?? "auto";
  if (mode !== "auto" && mode !== "manual") {
    return { ok: false, errors: { mode: "Modalità non valida" } };
  }
  if ((raw.slots ?? []).length > MAX_MANUAL_SLOTS) {
    return { ok: false, errors: { slots: `Massimo ${MAX_MANUAL_SLOTS} elementi` } };
  }
  const slots = parseManualSlots(
    JSON.stringify((raw.slots ?? []).map((s, i) => ({ slot: i + 1, type: s.type, id: s.id }))),
  );
  const [pOk, eOk] = await Promise.all([
    existingIds(db, "painting", slots.filter((s) => s.type === "painting").map((s) => s.id)),
    existingIds(db, "event", slots.filter((s) => s.type === "event").map((s) => s.id)),
  ]);
  const kept = slots
    .filter((s) => (s.type === "painting" ? pOk : eOk).has(s.id))
    .map((s, i) => ({ ...s, slot: i + 1 }));

  let heroType: ItemType | null = null;
  let heroId: number | null = null;
  if ((raw.heroItemType === "painting" || raw.heroItemType === "event") && raw.heroItemId != null) {
    if ((await existingIds(db, raw.heroItemType, [raw.heroItemId])).has(raw.heroItemId)) {
      heroType = raw.heroItemType;
      heroId = raw.heroItemId;
    }
  }
  const values = {
    mode,
    heroItemType: heroType,
    heroItemId: heroId,
    manualSlotsJson: JSON.stringify(kept),
  };
  await db
    .insert(homeSettings)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({ target: homeSettings.id, set: values });
  return { ok: true, data: null };
}

export async function saveSiteTheme(db: DbOrTx, raw: Partial<SiteTheme>): Promise<Result<null>> {
  const v = sanitizeTheme(raw);
  if (!v.ok) return v;
  const values = { wallPreset: v.data.wall, accentColor: v.data.accent };
  await db
    .insert(siteSettings)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({ target: siteSettings.id, set: values });
  return { ok: true, data: null };
}

/** On success `data.orphanedUrls` lists images that were removed and can be deleted from storage. */
export async function saveProfile(
  db: DbOrTx,
  raw: Partial<ProfileInput>,
): Promise<Result<{ orphanedUrls: string[] }>> {
  const errors: Record<string, string> = {};
  const email = raw.email?.trim() || null;
  const instagramUrl = raw.instagramUrl?.trim() || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Email non valida";
  if (instagramUrl && !/^https?:\/\//.test(instagramUrl)) errors.instagramUrl = "URL non valido";
  if (Object.keys(errors).length) return { ok: false, errors };

  const values = {
    avatarUrl: raw.avatarUrl?.trim() || null,
    bioDescription: raw.bioDescription?.trim() ?? "",
    profileImagesJson: JSON.stringify((raw.profileImages ?? []).filter(Boolean)),
    instagramUrl,
    email,
  };
  const [old] = await db.select().from(profileSettings).where(eq(profileSettings.id, 1));
  await db
    .insert(profileSettings)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({ target: profileSettings.id, set: values });
  const orphanedUrls = old
    ? removedUrls(
        [old.avatarUrl, ...parseJsonArray<string>(old.profileImagesJson)],
        [values.avatarUrl, ...(raw.profileImages ?? [])],
      )
    : [];
  return { ok: true, data: { orphanedUrls } };
}
