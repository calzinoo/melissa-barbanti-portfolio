/** Gallery wall presets: colors + surface texture. Pure data. */

import { FANTASY_WALLS, LEGACY_WALL_IDS } from "./wall-fantasy";

export const DEFAULT_WALL = "chiaroscuro";

export type WallPreset = {
  id: string;
  label: string;
  description: string;
  /** Surface/wall colors. */
  bg: string;
  surface: string;
  border: string;
  fg: string;
  muted: string;
  /** Opacity (0–1) of the soft spotlight on the upper part of the wall. */
  glow: number;
  /** Wall surface pattern, see wall-textures.css (data-texture). */
  texture: WallTexture;
  /** Opacity (0–1) of the texture layer. */
  grain: number;
  /** Hue rotation (deg) applied to the texture so its splashes match the wall color. */
  hue?: number;
  /** Saturation multiplier of the texture (1 = as painted, ~0.1 = neutral). */
  sat?: number;
  /** Color variant key shared across patterns (e.g. "rosso"). */
  colorKey?: string;
};

export type WallTexture =
  | "none"
  | "plaster"
  | "brick"
  | "brick-warm"
  | "cracked"
  | "cracked-light"
  | "concrete"
  | "peeling"
  | "splash-pour"
  | "splash-petals"
  | "splash-marble"
  | "splash-veins"
  | "splash-splatter"
  | "splash-brush"
  | "splash-cells"
  | "splash-watercolor"
  | "splash-materia"
  | "splash-cosmo";


const BASE_WALLS: WallPreset[] = [
  {
    id: "chiaroscuro",
    label: "Chiaroscuro",
    description: "Il tema scuro originale: buio profondo, luce sulle opere.",
    bg: "#141413",
    surface: "#1e1d1b",
    border: "#2e2c29",
    fg: "#f4f1ea",
    muted: "#a39e93",
    glow: 0,
    texture: "none",
    grain: 0,
  },
  {
    id: "bianco-galleria",
    label: "Bianco galleria",
    description: "La classica parete bianca del white cube, luce neutra dall'alto.",
    bg: "#f3f1ec",
    surface: "#ffffff",
    border: "#ddd8ce",
    fg: "#1c1b19",
    muted: "#6b665c",
    glow: 0.7,
    texture: "plaster",
    grain: 0.05,
  },
  {
    id: "gesso-caldo",
    label: "Gesso caldo",
    description: "Intonaco avorio, come le sale di un palazzo storico.",
    bg: "#e9e1d2",
    surface: "#f5efe3",
    border: "#d2c8b4",
    fg: "#2a2620",
    muted: "#6e6454",
    glow: 0.5,
    texture: "plaster",
    grain: 0.09,
  },
  {
    id: "grigio-museo",
    label: "Grigio museo",
    description: "Grigio tortora sobrio, lascia parlare i colori dei dipinti.",
    bg: "#d6d2ca",
    surface: "#e8e5de",
    border: "#bdb8ad",
    fg: "#1f1e1b",
    muted: "#5a564e",
    glow: 0.4,
    texture: "plaster",
    grain: 0.08,
  },
  {
    id: "salvia-salotto",
    label: "Verde salvia",
    description: "Parete verde profondo in stile salotto ottocentesco.",
    bg: "#3f4a41",
    surface: "#4a564c",
    border: "#5d6a5f",
    fg: "#f2f0e8",
    muted: "#bcc2b5",
    glow: 0.1,
    texture: "plaster",
    grain: 0.1,
  },
  {
    id: "bordeaux-salone",
    label: "Bordeaux",
    description: "Rosso vino da sala espositiva, caldo e teatrale.",
    bg: "#3a1e22",
    surface: "#46262b",
    border: "#5a353a",
    fg: "#f4ebe4",
    muted: "#c4a9a5",
    glow: 0.1,
    texture: "plaster",
    grain: 0.1,
  },
  {
    id: "blu-notte",
    label: "Blu notte",
    description: "Blu di Prussia, una parete intensa che fa risaltare l'oro.",
    bg: "#1d2b3a",
    surface: "#263647",
    border: "#364a5e",
    fg: "#eef0f2",
    muted: "#a5b2bf",
    glow: 0.1,
    texture: "plaster",
    grain: 0.08,
  },
  {
    id: "mattoni-bianchi",
    label: "Mattoni bianchi",
    description: "Muro di mattoni imbiancati, come in un loft-atelier.",
    bg: "#e8e4dc",
    surface: "#f7f4ee",
    border: "#cfc9bd",
    fg: "#1f1d1a",
    muted: "#625d53",
    glow: 0.45,
    texture: "brick",
    grain: 0.7,
  },
  {
    id: "mattoni-rossi",
    label: "Mattoni rossi",
    description: "Laterizio a vista e fughe chiare, un ex opificio diventato galleria.",
    bg: "#6e3a2e",
    surface: "#7c4538",
    border: "#94564a",
    fg: "#f7ede4",
    muted: "#dbbfb2",
    glow: 0.08,
    texture: "brick-warm",
    grain: 1,
  },
  {
    id: "muro-crepato",
    label: "Muro crepato",
    description: "Intonaco beige segnato dal tempo, con crepe sottili.",
    bg: "#ddd5c6",
    surface: "#eee8dc",
    border: "#c4baa6",
    fg: "#25221d",
    muted: "#695f50",
    glow: 0.4,
    texture: "cracked",
    grain: 0.9,
  },
  {
    id: "muro-antico",
    label: "Muro antico",
    description: "Parete scura con crepe chiare, il fascino di una cantina storica.",
    bg: "#2a2926",
    surface: "#353330",
    border: "#48453f",
    fg: "#f1ede4",
    muted: "#aaa498",
    glow: 0.08,
    texture: "cracked-light",
    grain: 1,
  },
  {
    id: "cemento-a-vista",
    label: "Cemento a vista",
    description: "Calcestruzzo grezzo con i fori dei casseri, stile museo contemporaneo.",
    bg: "#b9b7b1",
    surface: "#d3d1cb",
    border: "#9d9a93",
    fg: "#1b1a18",
    muted: "#4f4c46",
    glow: 0.3,
    texture: "concrete",
    grain: 0.55,
  },
  {
    id: "intonaco-scrostato",
    label: "Intonaco scrostato",
    description: "Colore ocra consumato, con chiazze dove l'intonaco si è staccato.",
    bg: "#d8c9ad",
    surface: "#eadfc9",
    border: "#bfae8e",
    fg: "#2b2418",
    muted: "#6a5b42",
    glow: 0.4,
    texture: "peeling",
    grain: 1,
  },
  {
    id: "affioramenti",
    label: "Affioramenti",
    description: "Grigio ardesia e carbone, con la materia che emerge in superficie.",
    bg: "#25282c",
    surface: "#30343a",
    border: "#454a52",
    fg: "#eef0f1",
    muted: "#b0b6bc",
    glow: 0.1,
    texture: "concrete",
    grain: 0.35,
  },
  {
    id: "verde-acqua-galleria",
    label: "Verde acqua",
    description: "Salvia e verde acqua chiaro, le pareti delle sale dove espone.",
    bg: "#d5e2dc",
    surface: "#e8f0ec",
    border: "#b7cbc2",
    fg: "#17221e",
    muted: "#4c5f57",
    glow: 0.5,
    texture: "plaster",
    grain: 0.07,
  },
];

export const WALL_PRESETS: WallPreset[] = [...BASE_WALLS, ...FANTASY_WALLS];

/** Maps a stored id (possibly a retired one) to a current preset id. */
export const resolveWallId = (id: string | null | undefined): string => LEGACY_WALL_IDS[id ?? ""] ?? id ?? DEFAULT_WALL;
