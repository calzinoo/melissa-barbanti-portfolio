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
      <div className="bg-bg sm:w-2/5 sm:shrink-0">
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImageUrl}
            alt={title}
            loading="lazy"
            className="h-full max-h-72 w-full object-cover sm:max-h-none"
          />
        ) : (
          <div className="flex aspect-[4/3] h-full items-center justify-center font-serif text-4xl text-border sm:aspect-auto">
            MB
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center gap-3 p-6">
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
        <h3 className="font-serif text-2xl leading-tight text-fg transition-colors group-hover:text-accent">
          {title}
        </h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted">{summary}</p>
      </div>
    </Link>
  );
}
