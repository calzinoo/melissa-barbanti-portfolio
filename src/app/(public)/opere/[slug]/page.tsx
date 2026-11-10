import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import PaintingViewer from "@/components/public/PaintingViewer";
import { formatDateRange, parseJsonArray, yearOf } from "@/lib/format";
import { getPaintingBySlug } from "@/lib/queries";

export async function generateMetadata({ params }: PageProps<"/opere/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPaintingBySlug(slug);
  if (!data) return { title: "Opera non trovata — Melissa Barbanti" };
  return {
    title: `${data.painting.title} — Melissa Barbanti`,
    description: data.painting.description.slice(0, 160),
  };
}

async function PaintingContent({ params }: { params: PageProps<"/opere/[slug]">["params"] }) {
  const { slug } = await params;
  const data = await getPaintingBySlug(slug);
  if (!data) notFound();
  const { painting: p, events } = data;

  const meta = [
    { label: "Anno", value: yearOf(p.date) },
    { label: "Dimensioni", value: p.dimensions },
    { label: "Tecnica", value: p.technique },
  ].filter((m) => m.value);
  const available = p.availability === "available";

  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <PaintingViewer
          title={p.title}
          mainImageUrl={p.mainImageUrl}
          detailImages={parseJsonArray<string>(p.detailImagesJson)}
        />
      </div>

      <div>
        <Link href="/opere" className="text-sm text-muted transition-colors hover:text-accent">
          ← Tutte le opere
        </Link>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-fg md:text-5xl">{p.title}</h1>

        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-y border-border py-5">
          {meta.map((m) => (
            <div key={m.label}>
              <dt className="text-xs uppercase tracking-widest text-muted">{m.label}</dt>
              <dd className="mt-1 text-fg">{m.value}</dd>
            </div>
          ))}
        </dl>

        <span
          className={`mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm ${
            available ? "border-accent text-accent" : "border-muted text-muted"
          }`}
        >
          <span
            aria-hidden
            className={`size-2 rounded-full ${available ? "bg-accent" : "border border-muted"}`}
          />
          {available ? "Disponibile" : "Collezione privata"}
        </span>

        {p.poem && (
          <blockquote className="mt-10 whitespace-pre-line border-l-2 border-[#C5A059] pl-6 font-serif text-xl italic leading-relaxed text-fg md:text-2xl">
            {p.poem}
          </blockquote>
        )}

        <div className="mt-10 space-y-5 text-lg leading-[1.85] text-fg/90">
          {p.description
            .replace(/\r\n/g, "\n")
            .split("\n\n")
            .map((para, i) => (
              <p key={i} className="whitespace-pre-line">
                {para}
              </p>
            ))}
        </div>

        {events.length > 0 && (
          <section className="mt-14">
            <h2 className="font-serif text-2xl text-fg">Esposto nelle mostre:</h2>
            <ul className="mt-5 space-y-3">
              {events.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/eventi/${e.slug}`}
                    className="group flex items-center gap-4 rounded-sm border border-border bg-surface p-3 transition-colors hover:border-accent/60"
                  >
                    {e.coverImageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.coverImageUrl} alt="" loading="lazy" className="size-16 shrink-0 rounded-sm object-cover" />
                    )}
                    <div className="min-w-0">
                      <p className="font-serif text-lg leading-tight text-fg transition-colors group-hover:text-accent">
                        {e.title}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                        <CalendarDays size={13} aria-hidden />
                        {formatDateRange(e.startDate, e.endDate)}
                      </p>
                      {e.location && (
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                          <MapPin size={13} aria-hidden />
                          {e.location}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

export default function PaintingPage(props: PageProps<"/opere/[slug]">) {
  return (
    <article className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <Suspense fallback={<div className="min-h-[70vh]" />}>
        <PaintingContent params={props.params} />
      </Suspense>
    </article>
  );
}
