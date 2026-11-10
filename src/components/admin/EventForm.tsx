"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Info } from "lucide-react";
import { createEventAction, updateEventAction, type ActionResult } from "@/app/admin/content-actions";
import type { PaintingOption } from "@/lib/admin-queries";
import { Field, FormActions, cardCls, inputCls, textareaCls } from "./FormUi";
import ImageUploader from "./ImageUploader";

export type EventFormValues = {
  title: string;
  summary: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  coverImageUrl: string;
  eventImages: string[];
  paintingIds: number[];
};

type Props = { id?: number; initial: EventFormValues; paintings: PaintingOption[] };

export default function EventForm({ id, initial, paintings }: Props) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const set = <K extends keyof EventFormValues>(k: K, val: EventFormValues[K]) =>
    setV((s) => ({ ...s, [k]: val }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      let res: ActionResult;
      try {
        res = id ? await updateEventAction(id, v) : await createEventAction(v);
      } catch {
        res = { ok: false, errors: { _form: "Salvataggio non riuscito. Riprova." } };
      }
      if (res.ok) {
        router.push("/admin/eventi");
        router.refresh();
      } else setErrors(res.errors);
    });
  }

  const toggle = (pid: number) =>
    set("paintingIds", v.paintingIds.includes(pid) ? v.paintingIds.filter((x) => x !== pid) : [...v.paintingIds, pid]);

  return (
    <form onSubmit={submit} className="mx-auto max-w-4xl space-y-6">
      <div className={`${cardCls} grid gap-5 sm:grid-cols-2`}>
        <div className="sm:col-span-2">
          <Field label="Titolo" htmlFor="title" error={errors.title}>
            <input id="title" className={inputCls} value={v.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
        </div>
        <Field label="Data di inizio" htmlFor="startDate" error={errors.startDate}>
          <input id="startDate" type="date" className={inputCls} value={v.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </Field>
        <Field label="Data di fine (facoltativa)" htmlFor="endDate" error={errors.endDate}>
          <input id="endDate" type="date" className={inputCls} value={v.endDate} onChange={(e) => set("endDate", e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Sede e Città" htmlFor="location" hint="Es. Galleria Civica, Bologna">
            <input id="location" className={inputCls} value={v.location} onChange={(e) => set("location", e.target.value)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Anteprima breve" htmlFor="summary" error={errors.summary} hint="2-3 righe mostrate nelle liste.">
            <textarea id="summary" rows={3} className={textareaCls} value={v.summary} onChange={(e) => set("summary", e.target.value)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Descrizione libera" htmlFor="description" error={errors.description}>
            <p className="mb-2 inline-flex items-start gap-2 rounded-md bg-accent/15 px-3 py-2 text-xs text-[#7a5f27]">
              <Info size={14} className="mt-0.5 shrink-0" />
              Il testo diviso in paragrafi e le foto verranno impaginati automaticamente a zig-zag e Bento grid
            </p>
            <textarea id="description" rows={10} className={textareaCls} value={v.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </div>
      </div>

      <div className={cardCls}>
        <ImageUploader
          label="Immagine di copertina"
          value={v.coverImageUrl ? [v.coverImageUrl] : []}
          onChange={(u) => set("coverImageUrl", u[0] ?? "")}
        />
        <div className="mt-6">
          <ImageUploader
            multiple
            hideBadge
            label="Foto dell'evento"
            value={v.eventImages}
            onChange={(u) => set("eventImages", u)}
            hint="Le prime due foto accompagnano i primi paragrafi; le altre finiscono nella griglia."
          />
        </div>
      </div>

      <fieldset className={cardCls}>
        <legend className="px-1 text-sm font-medium">Dipinti esposti ({v.paintingIds.length})</legend>
        {paintings.length === 0 ? (
          <p className="text-sm text-muted">Nessun dipinto disponibile.</p>
        ) : (
          <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {paintings.map((p) => {
              const on = v.paintingIds.includes(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggle(p.id)}
                    className={`relative block w-full overflow-hidden rounded-xl border-2 text-left transition ${
                      on ? "border-accent" : "border-border hover:border-accent/50"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.imageUrl} alt="" className="aspect-square w-full bg-bg object-contain" />
                    <span className="block truncate px-2 py-2 text-sm">{p.title}</span>
                    {on && (
                      <span className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-accent text-fg">
                        <Check size={16} />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </fieldset>

      <FormActions pending={pending} error={errors._form} cancelHref="/admin/eventi" label={id ? "Salva modifiche" : "Crea evento"} />
    </form>
  );
}
