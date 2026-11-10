import Link from "next/link";
import type { Painting } from "@/db/schema";
import { yearOf } from "@/lib/format";

const availabilityLabel = {
  available: "Disponibile",
  private_collection: "Collezione privata",
} as const;

export default function PaintingCard({ painting }: { painting: Painting }) {
  const { title, slug, mainImageUrl, date, technique, dimensions, availability } = painting;
  const details = [technique, dimensions].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/opere/${slug}`}
      className="group block rounded-sm border border-border bg-surface transition-colors hover:border-accent/60 focus-visible:border-accent"
    >
      {/* Natural aspect ratio: never crop the artwork. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mainImageUrl} alt={title} loading="lazy" className="block h-auto w-full" />

      <div className="p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="min-w-0 break-words font-serif text-xl leading-tight text-fg">{title}</h3>
          <span className="text-xs text-muted">{yearOf(date)}</span>
        </div>

        {details && (
          <p className="mt-1 text-xs text-muted transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100">
            {details}
          </p>
        )}

        <p className="mt-3 flex items-center gap-2 text-xs text-muted">
          <span
            aria-hidden
            className={`size-2 rounded-full ${availability === "available" ? "bg-accent" : "border border-muted"}`}
          />
          {availabilityLabel[availability]}
        </p>
      </div>
    </Link>
  );
}
