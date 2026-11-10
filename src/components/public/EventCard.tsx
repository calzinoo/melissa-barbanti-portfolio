import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import type { Event } from "@/db/schema";
import { formatDateRange } from "@/lib/format";

export default function EventCard({ event }: { event: Event }) {
  const { title, slug, summary, startDate, endDate, location, coverImageUrl } = event;

  return (
    <Link
      href={`/eventi/${slug}`}
      className="group flex flex-col overflow-hidden rounded-sm border border-border bg-surface transition-colors hover:border-accent/60 focus-visible:border-accent sm:flex-row"
    >
      {/* Fixed-ratio frame on mobile; on wider screens it stretches to the text height. The cover is cropped to fill it. */}
      <div className="relative aspect-[16/10] bg-bg sm:aspect-auto sm:min-h-56 sm:w-2/5 sm:shrink-0">
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImageUrl}
            alt={title}
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center font-serif text-4xl text-border">
            MB
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 p-5 sm:p-6">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/50 px-3 py-1 text-xs text-accent">
          <CalendarDays size={14} aria-hidden />
          {formatDateRange(startDate, endDate)}
        </span>
        {location && (
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <MapPin size={14} aria-hidden />
            {location}
          </p>
        )}
        <h3 className="break-words font-serif text-2xl leading-tight text-fg transition-colors group-hover:text-accent">
          {title}
        </h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted">{summary}</p>
      </div>
    </Link>
  );
}
