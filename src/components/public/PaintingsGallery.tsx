"use client";

import { useMemo, useState } from "react";
import type { Availability, Painting } from "@/db/schema";
import { yearOf } from "@/lib/format";
import PaintingCard from "./PaintingCard";

type AvailabilityFilter = "all" | Availability;

const availabilityOptions: { value: AvailabilityFilter; label: string }[] = [
  { value: "all", label: "Tutte" },
  { value: "available", label: "Disponibili" },
  { value: "private_collection", label: "Collezione privata" },
];

const chip = (active: boolean) =>
  `rounded-full border px-4 py-1.5 text-sm transition-colors ${
    active
      ? "border-accent bg-accent text-bg"
      : "border-border text-muted hover:border-accent/60 hover:text-fg"
  }`;

export default function PaintingsGallery({
  paintings,
  exhibitedIds,
}: {
  paintings: Painting[];
  exhibitedIds: number[];
}) {
  const [year, setYear] = useState("all");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [exhibitedOnly, setExhibitedOnly] = useState(false);

  const years = useMemo(
    () => [...new Set(paintings.map((p) => yearOf(p.date)))].sort().reverse(),
    [paintings],
  );
  const exhibited = useMemo(() => new Set(exhibitedIds), [exhibitedIds]);

  const visible = paintings.filter(
    (p) =>
      (year === "all" || yearOf(p.date) === year) &&
      (availability === "all" || p.availability === availability) &&
      (!exhibitedOnly || exhibited.has(p.id)),
  );

  return (
    <>
      <div className="mb-10 flex flex-col gap-5 border-b border-border pb-8">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtra per anno">
          <span className="mr-2 text-xs uppercase tracking-widest text-muted">Anno</span>
          {["all", ...years].map((y) => (
            <button
              key={y}
              type="button"
              aria-pressed={year === y}
              onClick={() => setYear(y)}
              className={chip(year === y)}
            >
              {y === "all" ? "Tutti" : y}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtra per disponibilità">
          <span className="mr-2 text-xs uppercase tracking-widest text-muted">Disponibilità</span>
          {availabilityOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={availability === o.value}
              onClick={() => setAvailability(o.value)}
              className={chip(availability === o.value)}
            >
              {o.label}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={exhibitedOnly}
            onClick={() => setExhibitedOnly((v) => !v)}
            className={`${chip(exhibitedOnly)} sm:ml-4`}
          >
            Esposte in mostra
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-20 text-center font-serif text-2xl text-muted">
          Nessuna opera corrisponde ai filtri selezionati.
        </p>
      ) : (
        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
          {visible.map((p) => (
            <div key={p.id} className="mb-6 break-inside-avoid">
              <PaintingCard painting={p} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
