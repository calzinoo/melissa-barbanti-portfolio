import { revalidatePath, updateTag } from "next/cache";
import type { Affected } from "./content";

export const CACHE_TAGS = ["home", "paintings", "events", "profile"] as const;

/** Every route that can change after a painting/event mutation. */
export function pathsFor({ paintingSlugs, eventSlugs }: Affected): string[] {
  return [
    "/",
    "/opere",
    "/eventi",
    "/admin/home",
    ...paintingSlugs.map((s) => `/opere/${s}`),
    ...eventSlugs.map((s) => `/eventi/${s}`),
  ];
}

/**
 * Call from Server Actions only (updateTag is Server Action-only).
 * `updateTag` expires the tag immediately (read-your-own-writes), unlike `revalidateTag`'s
 * stale-while-revalidate, so the artist sees changes instantly. Paths are revalidated too,
 * including the dynamic route patterns as a safety net for slugs we could not predict.
 */
export function revalidateContent(affected: Affected) {
  for (const tag of CACHE_TAGS) updateTag(tag);
  for (const path of new Set(pathsFor(affected))) revalidatePath(path);
  revalidatePath("/opere/[slug]", "page");
  revalidatePath("/eventi/[slug]", "page");
}

export function revalidateHome() {
  updateTag("home");
  revalidatePath("/");
  revalidatePath("/admin/home");
}

/** The theme wraps every public page, so revalidate the whole public layout. */
export function revalidateTheme() {
  updateTag("theme");
  revalidatePath("/", "layout");
}

export function revalidateProfile() {
  updateTag("profile");
  revalidatePath("/profilo");
  // The footer (contacts) is part of the public layout.
  revalidatePath("/", "layout");
  revalidatePath("/admin/profilo");
}
