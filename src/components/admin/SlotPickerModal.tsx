"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import type { PickerItem } from "@/lib/admin-queries";
import { inputCls } from "./FormUi";

type Props = {
  title: string;
  items: PickerItem[];
  /** Items already used elsewhere are shown as disabled. */
  takenKeys?: Set<string>;
  onPick: (item: PickerItem) => void;
  onClose: () => void;
};

export const itemKey = (i: { type: string; id: number }) => `${i.type}:${i.id}`;

export default function SlotPickerModal({ title, items, takenKeys, onPick, onClose }: Props) {
  const [tab, setTab] = useState<"painting" | "event">("painting");
  const [q, setQ] = useState("");
  const shown = items.filter(
    (i) => i.type === tab && i.title.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-t-2xl bg-surface sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-serif text-2xl font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Chiudi" className="flex size-11 items-center justify-center rounded-lg hover:bg-bg">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 border-b border-border p-4">
          <div className="flex gap-2" role="tablist">
            {(["painting", "event"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`h-11 rounded-lg px-5 text-sm font-medium ${
                  tab === t ? "bg-fg text-bg" : "border border-border hover:border-accent"
                }`}
              >
                {t === "painting" ? "Dipinti" : "Eventi"}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cerca per titolo…"
              aria-label="Cerca per titolo"
              className={`${inputCls} pl-10`}
            />
          </div>
        </div>

        <ul className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3">
          {shown.length === 0 && <li className="col-span-full py-8 text-center text-muted">Nessun risultato.</li>}
          {shown.map((i) => {
            const taken = takenKeys?.has(itemKey(i));
            return (
              <li key={itemKey(i)}>
                <button
                  type="button"
                  disabled={taken}
                  onClick={() => onPick(i)}
                  className="block w-full overflow-hidden rounded-xl border border-border text-left transition hover:border-accent disabled:opacity-40"
                >
                  {i.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={i.imageUrl} alt="" className="aspect-square w-full bg-bg object-contain" />
                  ) : (
                    <div className="aspect-square w-full bg-bg" />
                  )}
                  <div className="p-2">
                    <p className="truncate text-sm font-medium">{i.title}</p>
                    <p className="truncate text-xs text-muted">{taken ? "Già in uso" : i.subtitle}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
