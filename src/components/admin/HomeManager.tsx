"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, Info } from "lucide-react";
import { saveHomeSettingsAction } from "@/app/admin/content-actions";
import type { PickerItem } from "@/lib/admin-queries";
import type { ItemType } from "@/db/schema";
import { MAX_SLOTS } from "@/lib/home-constants";
import { FormActions, cardCls } from "./FormUi";
import SlotPickerModal, { itemKey } from "./SlotPickerModal";

type Props = {
  initialMode: "auto" | "manual";
  initialHero: { type: ItemType; id: number } | null;
  initialSlots: Array<{ type: ItemType; id: number }>;
  items: PickerItem[];
};

type Slots = Array<PickerItem | null>;
type Target = "hero" | number | null;

const radioCls = (on: boolean) =>
  `flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 ${
    on ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
  }`;

export default function HomeManager({ initialMode, initialHero, initialSlots, items }: Props) {
  const find = (t: ItemType, id: number) => items.find((i) => i.type === t && i.id === id) ?? null;
  const [mode, setMode] = useState(initialMode);
  const [hero, setHero] = useState<PickerItem | null>(initialHero ? find(initialHero.type, initialHero.id) : null);
  const [heroPinned, setHeroPinned] = useState(Boolean(initialHero && find(initialHero.type, initialHero.id)));
  const [slots, setSlots] = useState<Slots>(() => {
    const filled: Slots = initialSlots.map((s) => find(s.type, s.id)).filter(Boolean);
    return [...filled, ...Array<null>(MAX_SLOTS).fill(null)].slice(0, MAX_SLOTS);
  });
  const [target, setTarget] = useState<Target>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const swap = (a: number, b: number) =>
    setSlots((s) => {
      const n = [...s];
      [n[a], n[b]] = [n[b], n[a]];
      return n;
    });

  function pick(item: PickerItem) {
    if (target === "hero") setHero(item);
    else if (typeof target === "number") setSlots((s) => s.map((x, i) => (i === target ? item : x)));
    setTarget(null);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      try {
        const pinned = heroPinned ? hero : null;
        const res = await saveHomeSettingsAction({
          mode,
          heroItemType: pinned?.type ?? null,
          heroItemId: pinned?.id ?? null,
          slots: slots.filter((s): s is PickerItem => s !== null).map((s) => ({ type: s.type, id: s.id })),
        });
        setMsg(res.ok ? { ok: true, text: "Home page aggiornata." } : { ok: false, text: Object.values(res.errors)[0] });
      } catch {
        setMsg({ ok: false, text: "Salvataggio non riuscito. Riprova." });
      }
    });
  }

  const taken = new Set(slots.filter((s): s is PickerItem => s !== null).map(itemKey));

  return (
    <form onSubmit={save} className="max-w-5xl space-y-6">
      <section className={cardCls}>
        <h2 className="font-serif text-2xl font-semibold">In evidenza (Hero)</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className={radioCls(!heroPinned)}>
            <input type="radio" name="hero" checked={!heroPinned} onChange={() => setHeroPinned(false)} className="size-5 accent-[#C5A059]" />
            Automatico (Ultimo dipinto inserito)
          </label>
          <label className={radioCls(heroPinned)}>
            <input type="radio" name="hero" checked={heroPinned} onChange={() => setHeroPinned(true)} className="size-5 accent-[#C5A059]" />
            Fissa elemento specifico in Hero
          </label>
        </div>
        {heroPinned && (
          <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-bg p-3">
            <Thumb item={hero} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{hero?.title ?? "Nessun elemento scelto"}</p>
              <p className="text-sm text-muted">{hero ? (hero.type === "painting" ? "Dipinto" : "Evento") : "Scegli un dipinto o un evento"}</p>
            </div>
            <button type="button" onClick={() => setTarget("hero")} className="h-11 rounded-lg border border-border bg-surface px-4 text-sm font-medium hover:border-accent">
              {hero ? "Sostituisci" : "Scegli"}
            </button>
          </div>
        )}
      </section>

      <section className={cardCls}>
        <h2 className="font-serif text-2xl font-semibold">Griglia della Home</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className={radioCls(mode === "auto")}>
            <input type="radio" name="mode" checked={mode === "auto"} onChange={() => setMode("auto")} className="size-5 accent-[#C5A059]" />
            Automatico per Data
          </label>
          <label className={radioCls(mode === "manual")}>
            <input type="radio" name="mode" checked={mode === "manual"} onChange={() => setMode("manual")} className="size-5 accent-[#C5A059]" />
            Manuale — 6/7 Slot personalizzati
          </label>
        </div>

        {mode === "auto" ? (
          <p className="mt-4 flex items-start gap-3 rounded-xl bg-accent/10 p-4 text-sm">
            <Info size={18} className="mt-0.5 shrink-0 text-[#7a5f27]" />
            Verranno mostrati automaticamente i lavori e le mostre più recenti, ordinati per data.
          </p>
        ) : (
          <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {slots.map((item, i) => (
              <li key={i} className="flex flex-col overflow-hidden rounded-xl border border-border bg-bg">
                <div className="flex items-center justify-between px-3 py-2 text-sm font-medium">
                  <span>Slot {i + 1}</span>
                  <span className="flex gap-1">
                    <MoveBtn label="Sposta a sinistra" disabled={i === 0} onClick={() => swap(i, i - 1)}><ArrowLeft size={16} /></MoveBtn>
                    <MoveBtn label="Sposta a destra" disabled={i === MAX_SLOTS - 1} onClick={() => swap(i, i + 1)}><ArrowRight size={16} /></MoveBtn>
                  </span>
                </div>
                <button type="button" onClick={() => setTarget(i)} aria-label={`Slot ${i + 1}: ${item ? "sostituisci" : "scegli"}`} className="block">
                  <Thumb item={item} large />
                </button>
                <div className="min-h-14 px-3 py-2">
                  <p className="truncate text-sm font-medium">{item?.title ?? "Slot vuoto"}</p>
                  {item && <p className="text-xs text-muted">{item.type === "painting" ? "Dipinto" : "Evento"}</p>}
                </div>
                <div className="mt-auto flex gap-2 p-3 pt-0">
                  <button type="button" onClick={() => setTarget(i)} className="h-11 flex-1 rounded-lg border border-border bg-surface text-sm font-medium hover:border-accent">
                    Scegli / Sostituisci
                  </button>
                  {item && (
                    <button type="button" onClick={() => setSlots((s) => s.map((x, j) => (j === i ? null : x)))} className="h-11 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50">
                      Rimuovi
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <FormActions pending={pending} error={msg && !msg.ok ? msg.text : undefined} label="Salva Home Page" />
      {msg?.ok && (
        <p role="status" className="inline-flex items-center gap-2 text-sm text-green-800">
          <Check size={16} /> {msg.text}
        </p>
      )}

      {target !== null && (
        <SlotPickerModal
          title={target === "hero" ? "Scegli l'elemento in Hero" : `Scegli per lo Slot ${target + 1}`}
          items={items}
          takenKeys={target === "hero" ? undefined : taken}
          onPick={pick}
          onClose={() => setTarget(null)}
        />
      )}
    </form>
  );
}

function Thumb({ item, large }: { item: PickerItem | null; large?: boolean }) {
  const size = large ? "aspect-[4/3] w-full" : "size-16 shrink-0 rounded-lg";
  return item?.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.imageUrl} alt="" className={`${size} bg-surface object-contain`} />
  ) : (
    <div className={`${size} flex items-center justify-center border-y border-dashed border-border bg-surface text-xs text-muted`}>
      {large ? "Nessuna immagine" : ""}
    </div>
  );
}

function MoveBtn({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className="flex size-9 items-center justify-center rounded-lg border border-border bg-surface disabled:opacity-40">
      {children}
    </button>
  );
}
