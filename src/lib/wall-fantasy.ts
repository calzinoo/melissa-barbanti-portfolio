/**
 * "Fantasia" walls: each paint-pour texture is a pattern that can be recolored.
 * The wall color comes from the preset; the pour itself is hue-rotated (CSS filter) so
 * background and splashes always stay in harmony. Pure data.
 */

import type { WallPreset, WallTexture } from "./wall-presets";

/** Painted styles; most are baked in the same red/gold palette (dominant hue 355), see scripts/. */
const BASE_HUE = 355;
/** Textures baked with a different dominant hue than the shared red palette. */
const BASE_HUE_OVERRIDE: Partial<Record<WallTexture, number>> = {
  "splash-brush": 215,
  "splash-cosmo": 215,
  "splash-materia": 10,
};
export const FANTASY_STYLES: WallTexture[] = [
  "splash-pour",
  "splash-petals",
  "splash-marble",
  "splash-veins",
  "splash-splatter",
  "splash-brush",
  "splash-cells",
  "splash-watercolor",
  "splash-materia",
  "splash-cosmo",
];

type FantasyColor = {
  key: string;
  label: string;
  /** Wall hue. */
  hue: number;
  light?: boolean;
  /** Paint hue when it deliberately differs from the wall (complementary accents). */
  paint?: number;
  /** Paint saturation multiplier (low = nearly colorless paint). */
  sat?: number;
  /** Wall itself is (nearly) colorless. */
  mute?: boolean;
};

const FANTASY_COLORS: FantasyColor[] = [
  // White first: it is the default color shown when a pattern is picked.
  { key: "bianco", label: "Bianco", hue: 40, light: true, sat: 0.1, mute: true },
  { key: "neutro", label: "Grafite", hue: 35, sat: 0.12, mute: true },
  { key: "rosso", label: "Rosso", hue: 355 },
  { key: "ruggine", label: "Ruggine", hue: 20 },
  { key: "oro", label: "Oro", hue: 42 },
  { key: "smeraldo", label: "Smeraldo", hue: 160 },
  { key: "petrolio", label: "Petrolio", hue: 190 },
  { key: "blu", label: "Blu", hue: 220 },
  { key: "viola", label: "Viola", hue: 285 },
  { key: "rosa", label: "Rosa", hue: 330 },
  { key: "perla", label: "Perla rosa", hue: 345, light: true },
  { key: "pesca", label: "Pesca", hue: 20, light: true },
  { key: "acqua", label: "Verde acqua", hue: 170, light: true },
  // Contrasting pairs: wall and paint in different, complementary hues.
  { key: "blu-rame", label: "Blu e rame", hue: 220, paint: 25 },
  { key: "petrolio-corallo", label: "Petrolio e corallo", hue: 190, paint: 8 },
  { key: "smeraldo-rosa", label: "Smeraldo e rosa", hue: 160, paint: 340 },
  { key: "viola-oro", label: "Viola e oro", hue: 285, paint: 45 },
  { key: "bordeaux-oro", label: "Bordeaux e oro", hue: 350, paint: 45 },
  { key: "grafite-rosso", label: "Grafite e rosso", hue: 35, paint: 355, sat: 1, mute: true },
];

function hsl(h: number, s: number, l: number): string {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const k = (n: number) => (n + h / 30) % 12;
  const c = (n: number) => {
    const v = l / 100 - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return Math.round(v * 255).toString(16).padStart(2, "0");
  };
  return `#${c(0)}${c(8)}${c(4)}`;
}

const mod360 = (n: number) => ((n % 360) + 360) % 360;

export const FANTASY_WALLS: WallPreset[] = FANTASY_STYLES.flatMap((texture) =>
  FANTASY_COLORS.map(({ key, label, hue, light, paint, sat, mute }): WallPreset => {
    const shared = {
      id: `${texture}-${key}`,
      label,
      colorKey: key,
      texture,
      hue: mod360((paint ?? hue) - (BASE_HUE_OVERRIDE[texture] ?? BASE_HUE)),
      sat,
    };
    const s = (colored: number, muted: number) => (mute ? muted : colored);
    const about = paint !== undefined ? "con macchie di un colore a contrasto" : "con le macchie dello stesso colore";
    return light
      ? {
          ...shared,
          description: `Versione chiara, ${label.toLowerCase()} tenue.`,
          bg: hsl(hue, s(38, 14), s(90, 97)),
          surface: hsl(hue, s(42, 20), s(96, 100)),
          border: hsl(hue, s(26, 8), 78),
          fg: hsl(hue, 30, 10),
          muted: hsl(hue, 14, 32),
          glow: 0.55,
          grain: 0.5,
        }
      : {
          ...shared,
          description: `Fondo scuro ${label.toLowerCase()}, ${about}.`,
          bg: hsl(hue, s(50, 6), 11),
          surface: hsl(hue, s(42, 6), 15),
          border: hsl(hue, s(32, 5), 26),
          fg: hsl(hue, 25, 94),
          muted: hsl(hue, 16, 72),
          glow: 0.1,
          grain: 0.9,
        };
  }),
);

/** Ids of the retired one-off splash presets, mapped to their recolorable equivalent. */
export const LEGACY_WALL_IDS: Record<string, string> = {
  "rosso-interiore": "splash-pour-rosso",
  "oro-e-notte": "splash-pour-oro",
  "ocra-dorata": "splash-pour-oro",
  "blu-petrolio": "splash-pour-petrolio",
  "blu-cobalto": "splash-pour-blu",
  "verde-smeraldo": "splash-pour-smeraldo",
  "ruggine-e-rame": "splash-pour-ruggine",
  "prugna-viola": "splash-pour-viola",
  "perla-e-rosa": "splash-pour-perla",
  "pesca-e-rame": "splash-pour-pesca",
};

/** Retired textures: saved walls fall back to the same color of "Colature". */
for (const old of ["splash-rings", "splash-drips"]) {
  for (const { key } of FANTASY_COLORS) LEGACY_WALL_IDS[`${old}-${key}`] = `splash-pour-${key}`;
}
