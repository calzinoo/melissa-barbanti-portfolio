/** Public-site theming: gallery "wall" presets + a customizable main (accent) color. Pure, no I/O. */

import { DEFAULT_WALL, WALL_PRESETS, type WallPreset, type WallTexture } from "./wall-presets";

export { WALL_PRESETS, type WallPreset, type WallTexture };
export const DEFAULT_ACCENT = "#c5a059";

export const ACCENT_SWATCHES: Array<{ label: string; value: string }> = [
  { label: "Oro antico", value: "#c5a059" },
  { label: "Terracotta", value: "#b5573a" },
  { label: "Verde bosco", value: "#4f7a5a" },
  { label: "Blu cobalto", value: "#3f6fb5" },
  { label: "Bordeaux", value: "#a23a4a" },
  { label: "Grafite", value: "#4a4a47" },
];

export type SiteTheme = { wall: string; accent: string | null };

export const DEFAULT_THEME: SiteTheme = { wall: DEFAULT_WALL, accent: null };

export const wallTexture = (theme: SiteTheme): WallTexture => getWall(theme.wall).texture;

export function getWall(id: string | null | undefined): WallPreset {
  return WALL_PRESETS.find((w) => w.id === id) ?? WALL_PRESETS[0];
}

export function normalizeHex(input: string | null | undefined): string | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((input ?? "").trim());
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  return `#${h.toLowerCase()}`;
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
}

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Nudges `accent` toward the text color until it is legible (>= 3:1) on `bg`. */
export function readableAccent(accent: string, bg: string, fg: string): string {
  const a = rgb(accent);
  const t = rgb(fg);
  for (let i = 0; i <= 20; i++) {
    const k = i * 0.05;
    const c = toHex([0, 1, 2].map((j) => a[j] + (t[j] - a[j]) * k) as [number, number, number]);
    if (contrast(c, bg) >= 3) return c;
  }
  return fg;
}

/** CSS custom properties applied to the public wrapper element. */
export function themeVars(theme: SiteTheme): Record<string, string> {
  const wall = getWall(theme.wall);
  const base = normalizeHex(theme.accent) ?? DEFAULT_ACCENT;
  return {
    "--bg": wall.bg,
    "--surface": wall.surface,
    "--border": wall.border,
    "--fg": wall.fg,
    "--muted": wall.muted,
    "--accent": readableAccent(base, wall.bg, wall.fg),
    "--wall-glow": String(wall.glow),
    "--wall-grain": String(wall.grain),
  };
}

export function sanitizeTheme(raw: Partial<SiteTheme>): { ok: true; data: SiteTheme } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!WALL_PRESETS.some((w) => w.id === raw.wall)) errors.wall = "Sfondo non valido";
  const accent = raw.accent?.trim() ? normalizeHex(raw.accent) : null;
  if (raw.accent?.trim() && !accent) errors.accent = "Colore non valido (es. #C5A059)";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { wall: raw.wall as string, accent } };
}
