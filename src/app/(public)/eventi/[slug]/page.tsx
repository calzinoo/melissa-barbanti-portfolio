import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import PaintingCard from "@/components/public/PaintingCard";
import SmartEditorialLayout from "@/components/public/SmartEditorialLayout";
import { formatDateRange, parseJsonArray } from "@/lib/format";
import { getEventBySlug } from "@/lib/queries";

export async function generateMetadata({ params }: PageProps<"/eventi/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await getEventBySlug(slug);
  if (!data) return { title: "Mostra non trovata — Melissa Barbanti" };
  const { title, summary, coverImageUrl, eventImagesJson, slug: s } = data.event;
  const image = coverImageUrl ?? parseJsonArray<string>(eventImagesJson)[0];
  return {
    title: `${title} — Melissa Barbanti`,
    description: summary,
    alternates: { canonical: `/eventi/${s}` },
    openGraph: { title, description: summary, type: "article", url: `/eventi/${s}`, ...(image && { images: [{ url: image, alt: title }] }) },
    twitter: { card: image ? "summary_large_image" : "summary", title, description: summary, ...(image && { images: [image] }) },
  };
}

async function EventContent({ params }: { params: PageProps<"/eventi/[slug]">["params"] }) {
  const { slug } = await params;
  const data = await getEventBySlug(slug);
  if (!data) notFound();
  const { event: e, paintings } = data;

  return (
    <>
      <header className="mx-auto max-w-3xl text-center">
        <Link href="/eventi" className="text-sm text-muted transition-colors hover:text-accent">
          ← Tutte le mostre
        </Link>
        <h1 className="mt-6 font-serif text-4xl leading-tight text-fg md:text-6xl">{e.title}</h1>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
          <span className="inline-flex items-center gap-2 text-accent">
            <CalendarDays size={16} aria-hidden />
            {formatDateRange(e.startDate, e.endDate)}
          </span>
          {e.location && (
            <span className="inline-flex items-center gap-2">
              <MapPin size={16} aria-hidden />
              {e.location}
            </span>
          )}
        </div>
        <p className="mt-8 font-serif text-xl italic leading-relaxed text-fg/90 md:text-2xl">{e.summary}</p>
      </header>

      <div className="mt-16 md:mt-24">
        <SmartEditorialLayout
          text={e.description}
          images={parseJsonArray<string>(e.eventImagesJson)}
          alt={e.title}
        />
      </div>

      {paintings.length > 0 && (
        <section className="mt-24 border-t border-border pt-12">
          <h2 className="mb-8 font-serif text-3xl text-fg">Opere Esposte in questa Mostra:</h2>
          <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
            {paintings.map((p) => (
              <div key={p.id} className="mb-6 break-inside-avoid">
                <PaintingCard painting={p} />
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export default function EventPage(props: PageProps<"/eventi/[slug]">) {
  return (
    <article className="mx-auto max-w-6xl px-6 py-12 md:py-20">
      <Suspense fallback={<div className="min-h-[70vh]" />}>
        <EventContent params={props.params} />
      </Suspense>
    </article>
  );
}
