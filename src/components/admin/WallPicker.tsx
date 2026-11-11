"use client";

import { useState } from "react";
import { getWall, themeVars } from "@/lib/theme";
import { WALL_PATTERNS, getPattern, patternOf, wallsInPattern } from "@/lib/wall-patterns";
import type { WallPreset } from "@/lib/wall-presets";

const ring = (on: boolean) =>
  on ? "border-accent ring-2 ring-accent/40" : "border-border hover:border-accent/60";

function Swatch({ wall, className }: { wall: WallPreset; className: string }) {
  return (
    <span
      aria-hidden
      data-texture={wall.texture}
      className={`wall wall-contained shrink-0 border border-black/10 ${className}`}
      style={themeVars({ wall: wall.id, accent: null }) as React.CSSProperties}
    />
  );
}

export default function WallPicker({ value: rawValue, onChange }: { value: string; onChange: (id: string) => void }) {
  const current = getWall(rawValue);
  const value = current.id;
  const [patternId, setPatternId] = useState(patternOf(current).id);
  const pattern = getPattern(patternId);
  const colors = wallsInPattern(patternId);

  // Picking a pattern selects its default color (neutral for the painted patterns).
  const pickPattern = (id: string) => {
    setPatternId(id);
    if (!wallsInPattern(id).some((w) => w.id === value)) onChange(wallsInPattern(id)[0].id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold">1. Scegli il motivo</h3>
        <div role="radiogroup" aria-label="Motivo della parete" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {WALL_PATTERNS.map((p) => {
            const on = p.id === patternId;
            const sample = wallsInPattern(p.id).find((w) => w.id === value) ?? wallsInPattern(p.id)[0];
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => pickPattern(p.id)}
                className={`flex flex-col gap-2 rounded-xl border p-2 text-left transition ${ring(on)}`}
              >
                <Swatch wall={sample} className="h-16 w-full rounded-lg" />
                <span className="px-1 pb-1">
                  <span className="block text-[15px] font-medium">{p.label}</span>
                  <span className="block text-xs leading-snug text-muted">{p.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">2. Scegli il colore — {pattern.label}</h3>
        <div role="radiogroup" aria-label="Colore della parete" className="grid gap-3 sm:grid-cols-2">
          {colors.map((w) => {
            const on = w.id === value;
            return (
              <button
                key={w.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onChange(w.id)}
                className={`flex gap-3 rounded-xl border p-3 text-left transition ${ring(on)}`}
              >
                <Swatch wall={w} className="h-14 w-16 rounded-lg" />
                <span>
                  <span className="block text-[15px] font-medium">
                    {w.label}
                    {w.id === "chiaroscuro" && <span className="ml-2 text-xs font-normal text-muted">(attuale)</span>}
                  </span>
                  <span className="block text-xs leading-snug text-muted">{w.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
