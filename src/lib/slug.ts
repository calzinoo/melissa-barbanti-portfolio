import { and, like, ne } from "drizzle-orm";
import { events, paintings } from "@/db/schema";
import type { DbOrTx } from "@/db/types";

export function slugify(input: string): string {
  const slug = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "senza-titolo";
}

type SluggedTable = typeof paintings | typeof events;

/**
 * Returns `base`, or `base-2`, `base-3`, … when already taken.
 * `excludeId` lets an item keep its own slug while being updated.
 */
export async function uniqueSlug(
  db: DbOrTx,
  table: SluggedTable,
  title: string,
  excludeId?: number,
): Promise<string> {
  const base = slugify(title);
  const rows = await db
    .select({ slug: table.slug })
    .from(table)
    .where(
      excludeId == null
        ? like(table.slug, `${base}%`)
        : and(like(table.slug, `${base}%`), ne(table.id, excludeId)),
    );
  const taken = new Set(rows.map((r) => r.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

