import { Suspense } from "react";
import EventCard from "@/components/public/EventCard";
import HomeHero from "@/components/public/HomeHero";
import PaintingCard from "@/components/public/PaintingCard";
import SectionHeader from "@/components/public/SectionHeader";
import { getHomeData } from "@/lib/queries";

async function HomeContent() {
  const { hero, paintings, events, mode } = await getHomeData();
  const manual = mode === "manual";

  return (
    <>
      {hero && <HomeHero hero={hero} />}

      {paintings.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-12">
          <SectionHeader
            title={manual ? "Opere in evidenza" : "Ultime Opere"}
            href="/opere"
            linkLabel="Tutte le opere"
          />
          <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
            {paintings.map((p) => (
              <div key={p.id} className="mb-6 break-inside-avoid">
                <PaintingCard painting={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {events.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-12">
          <SectionHeader
            title={manual ? "Mostre ed Eventi in evidenza" : "Mostre ed Eventi Recenti"}
            href="/eventi"
            linkLabel="Tutti gli eventi"
          />
          <div className="grid gap-6 lg:grid-cols-2">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      {!hero && paintings.length === 0 && events.length === 0 && (
        <p className="py-32 text-center font-serif text-2xl text-muted">
          Nuove opere in arrivo presto.
        </p>
      )}
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <HomeContent />
    </Suspense>
  );
}
