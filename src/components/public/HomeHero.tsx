import Link from "next/link";
import type { HeroItem } from "@/lib/queries";

export default function HomeHero({ hero }: { hero: HeroItem }) {
  const href = hero.type === "painting" ? `/opere/${hero.slug}` : `/eventi/${hero.slug}`;
  const cta = hero.type === "painting" ? "Scopri l'opera" : "Scopri l'evento";

  return (
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-12 md:grid-cols-2 md:gap-16 md:py-20">
      <div className="flex justify-center bg-surface p-4 md:p-6">
        {hero.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hero.imageUrl}
            alt={hero.title}
            className="h-auto max-h-[75vh] w-auto max-w-full object-contain"
          />
        )}
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-accent">
          {hero.type === "painting" ? "In evidenza" : "Evento in evidenza"}
        </p>
        <h1 className="mt-4 font-serif text-5xl leading-[1.05] text-fg md:text-6xl">{hero.title}</h1>
        {hero.meta && <p className="mt-3 text-sm text-muted">{hero.meta}</p>}
        {hero.excerpt && (
          <p
            className={`mt-8 whitespace-pre-line font-serif text-xl leading-relaxed text-fg/90 md:text-2xl ${
              hero.type === "painting" ? "border-l-2 border-accent pl-5 italic" : "line-clamp-4"
            }`}
          >
            {hero.excerpt}
          </p>
        )}
        <Link
          href={href}
          className="mt-10 inline-block border border-accent px-7 py-3 text-sm tracking-wide text-accent transition-colors hover:bg-accent hover:text-bg"
        >
          {cta}
        </Link>
      </div>
    </section>
  );
}
