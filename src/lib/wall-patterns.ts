/** Groups wall presets into patterns (surface families); each preset is a color variant. Pure data. */

import { WALL_PRESETS, type WallPreset, type WallTexture } from "./wall-presets";

export type WallPattern = {
  id: string;
  label: string;
  description: string;
  textures: WallTexture[];
};

export const WALL_PATTERNS: WallPattern[] = [
  { id: "solid", label: "Tinta unita", description: "Parete liscia, solo colore.", textures: ["none", "plaster"] },
  { id: "brick", label: "Mattoni", description: "Muro di mattoni a vista.", textures: ["brick", "brick-warm"] },
  { id: "cracked", label: "Muro crepato", description: "Intonaco segnato dal tempo.", textures: ["cracked", "cracked-light"] },
  { id: "concrete", label: "Cemento", description: "Calcestruzzo grezzo.", textures: ["concrete"] },
  { id: "peeling", label: "Scrostato", description: "Intonaco consumato a chiazze.", textures: ["peeling"] },
  { id: "pour", label: "Colature", description: "Colore versato con bolle e gocce.", textures: ["splash-pour"] },
  { id: "petals", label: "Petali", description: "Fiori di petali dipinti.", textures: ["splash-petals"] },
  { id: "marble", label: "Marmorizzato", description: "Larghe onde di colore.", textures: ["splash-marble"] },
  { id: "splatter", label: "Schizzi", description: "Spruzzi e schizzi d'azione.", textures: ["splash-splatter"] },
  { id: "brush", label: "Pennellate", description: "Larghe pennellate a secco.", textures: ["splash-brush"] },
  { id: "cells", label: "Cellule", description: "Anelli fluidi come acrilico versato.", textures: ["splash-cells"] },
  { id: "watercolor", label: "Acquerello", description: "Morbide macchie trasparenti.", textures: ["splash-watercolor"] },
  { id: "materia", label: "Materia", description: "Masse nere, bianche e corallo con aloni dorati.", textures: ["splash-materia"] },
  { id: "cosmo", label: "Cosmo", description: "Sfere luminose con bordo ramato.", textures: ["splash-cosmo"] },
  { id: "veins", label: "Vene d'oro", description: "Sottili venature dorate.", textures: ["splash-veins"] },
];

export function getPattern(id: string): WallPattern {
  return WALL_PATTERNS.find((p) => p.id === id) ?? WALL_PATTERNS[0];
}

export function patternOf(wall: WallPreset): WallPattern {
  return WALL_PATTERNS.find((p) => p.textures.includes(wall.texture)) ?? WALL_PATTERNS[0];
}

/** Color variants available for a pattern. */
export function wallsInPattern(patternId: string): WallPreset[] {
  const { textures } = getPattern(patternId);
  return WALL_PRESETS.filter((w) => textures.includes(w.texture));
}
