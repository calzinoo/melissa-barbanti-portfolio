import { Suspense } from "react";
import type { Metadata } from "next";
import EventCard from "@/components/public/EventCard";
import { yearOf } from "@/lib/format";
import { getAllEvents } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Mostre ed Eventi — Melissa Barbanti",
  description: "Le mostre e gli eventi di Melissa Barbanti, in ordine cronologico.",
};

async function Timeline() {
  const events = await getAllEvents();
  if (events.length === 0) {
    return <p className="py-24 text-center font-serif text-2xl text-muted">Nessuna mostra in programma.</p>;
  }

  const byYear = new Map<string, typeof events>();
  for (const e of events) {
    const y = yearOf(e.startDate);
    byYear.set(y, [...(byYear.get(y) ?? []), e]);
  }

  return (
    <div className="space-y-14">
      {[...byYear].map(([year, items]) => (
        <section key={year} aria-labelledby={`anno-${year}`} className="grid gap-6 md:grid-cols-[6rem_1fr]">
          <h2 id={`anno-${year}`} className="font-serif text-4xl text-accent md:sticky md:top-24 md:self-start">
            {year}
          </h2>
          <div className="space-y-6 border-l border-border pl-6 md:pl-10">
            {items.map((e) => (
              <div key={e.id} className="relative">
                <span
                  aria-hidden
                  className="absolute -left-[1.85rem] top-8 size-2.5 rounded-full bg-accent md:-left-[2.85rem]"
                />
                <EventCard event={e} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function EventiPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <p className="text-xs uppercase tracking-[0.25em] text-accent">Esposizioni</p>
      <h1 className="mt-4 mb-12 font-serif text-4xl text-fg md:text-5xl">Mostre ed Eventi</h1>
      <Suspense fallback={<div className="min-h-[50vh]" />}>
        <Timeline />
      </Suspense>
    </section>
  );
}
