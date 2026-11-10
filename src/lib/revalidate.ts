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

/** Call from Server Actions only (updateTag is Server Action-only). */
export function revalidateContent(affected: Affected) {
  for (const tag of CACHE_TAGS) updateTag(tag);
  for (const path of new Set(pathsFor(affected))) revalidatePath(path);
}

export function revalidateHome() {
  updateTag("home");
  revalidatePath("/");
  revalidatePath("/admin/home");
}

export function revalidateProfile() {
  updateTag("profile");
  revalidatePath("/profilo");
  revalidatePath("/admin/profilo");
}
