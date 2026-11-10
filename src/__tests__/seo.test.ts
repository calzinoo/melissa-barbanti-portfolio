import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/db/types";
import { createTestDb, eventInput, paintingInput } from "./helpers/test-db";

const h = vi.hoisted(() => ({ db: undefined as unknown }));

vi.mock("next/cache", () => ({ cacheLife: () => {}, cacheTag: () => {} }));
vi.mock("@/db", () => ({
  get db() {
    return h.db;
  },
}));

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { generateMetadata as paintingMeta } from "@/app/(public)/opere/[slug]/page";
import { generateMetadata as eventMeta } from "@/app/(public)/eventi/[slug]/page";
import { createEvent, createPainting } from "@/lib/content";
import { AI_BOTS, getSiteUrl } from "@/lib/site";
import { validateEvent, validatePainting } from "@/lib/validation";

let db: Database;
beforeEach(async () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://melissabarbanti.it/");
  db = await createTestDb();
  h.db = db;
});

const painting = (over: Record<string, unknown>) => {
  const v = validatePainting(paintingInput(over));
  if (!v.ok) throw new Error("bad fixture");
  return v.data;
};
const event = (over: Record<string, unknown>) => {
  const v = validateEvent(eventInput(over));
  if (!v.ok) throw new Error("bad fixture");
  return v.data;
};

describe("site url", () => {
  it("prefers NEXT_PUBLIC_SITE_URL, strips trailing slashes, then falls back to Vercel and localhost", () => {
    expect(getSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://a.it//" })).toBe("https://a.it");
    expect(getSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app" })).toBe("https://x.vercel.app");
    expect(getSiteUrl({})).toBe("http://localhost:3000");
  });
});

describe("robots.ts", () => {
  const rules = () => [robots().rules].flat();

  it("blocks /admin and /api for every crawler but allows the public site", () => {
    const all = rules().find((r) => r.userAgent === "*");
    expect(all?.disallow).toEqual(expect.arrayContaining(["/admin", "/api"]));
    expect(all?.allow).toBe("/");
  });

  it("explicitly disallows every AI training scraper across the whole site", () => {
    const ai = rules().find((r) => Array.isArray(r.userAgent));
    expect(ai?.disallow).toBe("/");
    expect(ai?.userAgent).toEqual(
      expect.arrayContaining(["GPTBot", "ChatGPT-User", "CCBot", "Google-Extended", "anthropic-ai", "ClaudeBot", "Bytespider"]),
    );
    expect([...(ai?.userAgent as string[])].sort()).toEqual([...AI_BOTS].sort());
  });

  it("points to the sitemap on the public origin", () => {
    expect(robots().sitemap).toBe("https://melissabarbanti.it/sitemap.xml");
  });
});

describe("sitemap.ts", () => {
  it("lists static routes even with an empty database", async () => {
    const urls = (await sitemap()).map((s) => s.url);
    expect(urls).toEqual(
      expect.arrayContaining([
        "https://melissabarbanti.it",
        "https://melissabarbanti.it/opere",
        "https://melissabarbanti.it/eventi",
        "https://melissabarbanti.it/profilo",
        "https://melissabarbanti.it/note-legali",
      ]),
    );
    expect(urls).toHaveLength(5);
  });

  it("includes every painting and event slug", async () => {
    await createPainting(db, painting({ title: "Rosa Blu" }));
    await createPainting(db, painting({ title: "Verde" }));
    await createEvent(db, event({ title: "Grande Mostra" }));
    const urls = (await sitemap()).map((s) => s.url);
    expect(urls).toEqual(
      expect.arrayContaining([
        "https://melissabarbanti.it/opere/rosa-blu",
        "https://melissabarbanti.it/opere/verde",
        "https://melissabarbanti.it/eventi/grande-mostra",
      ]),
    );
    expect(new Set(urls).size).toBe(urls.length);
  });
});

describe("dynamic metadata for social previews", () => {
  it("painting: Italian title, description and OpenGraph/Twitter image", async () => {
    await createPainting(db, painting({ title: "Rosa Blu", mainImageUrl: "https://cdn/x.webp", description: "Una  bella\n\nopera" }));
    const m = await paintingMeta({ params: Promise.resolve({ slug: "rosa-blu" }) } as never);
    expect(m.title).toBe("Rosa Blu — Melissa Barbanti");
    expect(m.description).toBe("Una bella opera");
    expect(m.openGraph?.images).toEqual([{ url: "https://cdn/x.webp", alt: "Rosa Blu" }]);
    expect(m.twitter).toMatchObject({ card: "summary_large_image", images: ["https://cdn/x.webp"] });
    expect(m.alternates?.canonical).toBe("/opere/rosa-blu");
  });

  it("event: uses the cover image, falls back to the first event photo", async () => {
    await createEvent(db, event({ title: "Con Cover", coverImageUrl: "https://cdn/c.webp" }));
    await createEvent(db, event({ title: "Senza Cover", eventImages: ["https://cdn/p1.webp"] }));
    const a = await eventMeta({ params: Promise.resolve({ slug: "con-cover" }) } as never);
    expect(a.openGraph?.images).toEqual([{ url: "https://cdn/c.webp", alt: "Con Cover" }]);
    const b = await eventMeta({ params: Promise.resolve({ slug: "senza-cover" }) } as never);
    expect(b.twitter).toMatchObject({ images: ["https://cdn/p1.webp"] });
  });

  it("unknown slugs get a not-found title and no social image", async () => {
    const m = await paintingMeta({ params: Promise.resolve({ slug: "nope" }) } as never);
    expect(m.title).toMatch(/non trovata/);
    expect(m.openGraph).toBeUndefined();
  });
});
