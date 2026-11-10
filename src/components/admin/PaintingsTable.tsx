"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { deletePaintingAction } from "@/app/admin/content-actions";
import { formatDate } from "@/lib/format";
import DeleteButton from "./DeleteButton";
import { inputCls, secondaryBtn } from "./FormUi";

type Row = {
  id: number;
  title: string;
  mainImageUrl: string;
  date: string;
  dimensions: string | null;
  availability: "available" | "private_collection";
  eventCount: number;
};

export default function PaintingsTable({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const shown = rows.filter((r) => r.title.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca un dipinto…"
          aria-label="Cerca un dipinto"
          className={`${inputCls} pl-10`}
        />
      </div>

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface p-8 text-center text-muted">
          {rows.length === 0 ? "Non ci sono ancora dipinti." : "Nessun dipinto corrisponde alla ricerca."}
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface p-3 sm:p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.mainImageUrl} alt="" className="size-20 shrink-0 rounded-lg bg-bg object-contain" />
              <div className="min-w-48 flex-1">
                <p className="font-serif text-xl font-semibold leading-tight">{r.title}</p>
                <p className="mt-1 text-sm text-muted">
                  {formatDate(r.date)}
                  {r.dimensions ? ` · ${r.dimensions}` : ""}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full px-2.5 py-1 ${r.availability === "available" ? "bg-accent/20 text-[#7a5f27]" : "bg-bg text-muted ring-1 ring-border"}`}>
                    {r.availability === "available" ? "Disponibile" : "Collezione privata"}
                  </span>
                  <span className="text-muted">
                    {r.eventCount === 1 ? "1 mostra collegata" : `${r.eventCount} mostre collegate`}
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/dipinti/${r.id}`} className={`${secondaryBtn} h-11 text-sm`}>
                  Modifica
                </Link>
                <DeleteButton
                  action={() => deletePaintingAction(r.id)}
                  confirmMessage={`Eliminare definitivamente "${r.title}"?`}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
