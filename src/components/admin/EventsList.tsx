"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { deleteEventAction } from "@/app/admin/content-actions";
import { formatDateRange } from "@/lib/format";
import DeleteButton from "./DeleteButton";
import { secondaryBtn } from "./FormUi";

type Row = {
  id: number;
  title: string;
  coverImageUrl: string | null;
  startDate: string;
  endDate: string | null;
  location: string | null;
  paintingCount: number;
};

export default function EventsList({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return <p className="rounded-2xl border border-border bg-surface p-8 text-center text-muted">Non ci sono ancora eventi.</p>;
  }
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface p-3 sm:p-4">
          {r.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.coverImageUrl} alt="" className="size-20 shrink-0 rounded-lg bg-bg object-cover" />
          ) : (
            <div className="size-20 shrink-0 rounded-lg border border-dashed border-border bg-bg" />
          )}
          <div className="min-w-48 flex-1">
            <p className="font-serif text-xl font-semibold leading-tight">{r.title}</p>
            <p className="mt-1 text-sm text-muted">{formatDateRange(r.startDate, r.endDate)}</p>
            {r.location && (
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                <MapPin size={14} aria-hidden /> {r.location}
              </p>
            )}
            <p className="mt-1 text-xs text-muted">
              {r.paintingCount === 1 ? "1 dipinto esposto" : `${r.paintingCount} dipinti esposti`}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/eventi/${r.id}`} className={`${secondaryBtn} h-11 text-sm`}>
              Modifica
            </Link>
            <DeleteButton action={() => deleteEventAction(r.id)} confirmMessage={`Eliminare definitivamente "${r.title}"?`} />
          </div>
        </li>
      ))}
    </ul>
  );
}
