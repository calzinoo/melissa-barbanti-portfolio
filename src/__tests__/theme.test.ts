import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { siteSettings } from "@/db/schema";
import type { Database } from "@/db/types";
import { saveSiteTheme } from "@/lib/settings";
import {
  DEFAULT_ACCENT,
  WALL_PRESETS,
  contrast,
  normalizeHex,
  readableAccent,
  sanitizeTheme,
  themeVars,
} from "@/lib/theme";
import { createTestDb } from "./helpers/test-db";

describe("theme helpers", () => {
  it("keeps the original dark theme as the first/default preset", () => {
    const v = themeVars({ wall: "chiaroscuro", accent: null });
    expect(v["--bg"]).toBe("#141413");
    expect(v["--surface"]).toBe("#1e1d1b");
    expect(v["--accent"]).toBe(DEFAULT_ACCENT);
  });

  it("falls back to the default wall for unknown ids", () => {
    expect(themeVars({ wall: "nope", accent: null })["--bg"]).toBe("#141413");
  });

  it("normalizes hex colors", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
    expect(normalizeHex("c5a059")).toBe("#c5a059");
    expect(normalizeHex("red")).toBeNull();
  });

  it("makes the accent legible on every wall", () => {
    for (const w of WALL_PRESETS) {
      const accent = themeVars({ wall: w.id, accent: "#ffee88" })["--accent"];
      expect(contrast(accent, w.bg)).toBeGreaterThanOrEqual(3);
    }
    expect(readableAccent("#c5a059", "#141413", "#f4f1ea")).toBe("#c5a059");
  });

  it("rejects invalid input", () => {
    expect(sanitizeTheme({ wall: "x", accent: null }).ok).toBe(false);
    expect(sanitizeTheme({ wall: "gesso-caldo", accent: "zzz" }).ok).toBe(false);
    expect(sanitizeTheme({ wall: "gesso-caldo", accent: "  " })).toEqual({
      ok: true,
      data: { wall: "gesso-caldo", accent: null },
    });
  });
});

describe("wall presets", () => {
  it("has unique ids and a stylesheet rule for every texture", () => {
    const ids = WALL_PRESETS.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
    const css = readFileSync("src/app/wall-textures.css", "utf8");
    for (const w of WALL_PRESETS) {
      if (w.texture !== "none") expect(css).toContain(`[data-texture="${w.texture}"]`);
    }
    expect(ids).toEqual(expect.arrayContaining(["mattoni-bianchi", "muro-crepato", "cemento-a-vista"]));
  });

  it("has readable text colors on every wall", () => {
    for (const w of WALL_PRESETS) {
      expect(contrast(w.fg, w.bg)).toBeGreaterThanOrEqual(7);
      expect(contrast(w.muted, w.bg)).toBeGreaterThanOrEqual(4);
    }
  });
});

describe("saveSiteTheme", () => {
  let db: Database;
  beforeEach(async () => {
    db = await createTestDb();
  });

  it("upserts the single settings row", async () => {
    await saveSiteTheme(db, { wall: "bordeaux-salone", accent: "#A23A4A" });
    await saveSiteTheme(db, { wall: "blu-notte", accent: null });
    const rows = await db.select().from(siteSettings);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 1, wallPreset: "blu-notte", accentColor: null });
  });

  it("does not write invalid themes", async () => {
    const res = await saveSiteTheme(db, { wall: "bad", accent: null });
    expect(res.ok).toBe(false);
    expect(await db.select().from(siteSettings)).toHaveLength(0);
  });
});
