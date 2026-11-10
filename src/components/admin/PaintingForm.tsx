"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createPaintingAction,
  updatePaintingAction,
  type ActionResult,
} from "@/app/admin/content-actions";
import type { Availability } from "@/db/schema";
import type { EventOption } from "@/lib/admin-queries";
import { formatDate } from "@/lib/format";
import { Field, FormActions, cardCls, inputCls, textareaCls } from "./FormUi";
import ImageUploader from "./ImageUploader";
import PaintingPreview from "./PaintingPreview";

export type PaintingFormValues = {
  title: string;
  mainImageUrl: string;
  detailImages: string[];
  description: string;
  poem: string;
  date: string;
  dimensions: string;
  technique: string;
  availability: Availability;
  eventIds: number[];
};

type Props = { id?: number; initial: PaintingFormValues; events: EventOption[] };

export default function PaintingForm({ id, initial, events }: Props) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const set = <K extends keyof PaintingFormValues>(k: K, val: PaintingFormValues[K]) =>
    setV((s) => ({ ...s, [k]: val }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      let res: ActionResult;
      try {
        res = id ? await updatePaintingAction(id, v) : await createPaintingAction(v);
      } catch {
        res = { ok: false, errors: { _form: "Salvataggio non riuscito. Riprova." } };
      }
      if (res.ok) {
        router.push("/admin/dipinti");
        router.refresh();
      } else setErrors(res.errors);
    });
  }

  const toggleEvent = (eid: number) =>
    set("eventIds", v.eventIds.includes(eid) ? v.eventIds.filter((x) => x !== eid) : [...v.eventIds, eid]);

  return (
    <form onSubmit={submit} className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-6">
        <div className={cardCls}>
          <ImageUploader
            label="Immagine principale"
            value={v.mainImageUrl ? [v.mainImageUrl] : []}
            onChange={(u) => set("mainImageUrl", u[0] ?? "")}
          />
          {errors.mainImageUrl && (
            <p role="alert" className="mt-2 text-sm text-red-700">
              {errors.mainImageUrl}
            </p>
          )}
          <div className="mt-6">
            <ImageUploader
              multiple
              hideBadge
              label="Dettagli e cornice"
              value={v.detailImages}
              onChange={(u) => set("detailImages", u)}
              hint="Trascina le foto o usa le frecce per cambiare l'ordine."
            />
          </div>
        </div>

        <div className={`${cardCls} grid gap-5 sm:grid-cols-2`}>
          <div className="sm:col-span-2">
            <Field label="Titolo" htmlFor="title" error={errors.title}>
              <input id="title" className={inputCls} value={v.title} onChange={(e) => set("title", e.target.value)} />
            </Field>
          </div>
          <Field label="Data" htmlFor="date" error={errors.date} hint="Formato AAAA-MM-GG">
            <input id="date" type="date" className={inputCls} value={v.date} onChange={(e) => set("date", e.target.value)} />
          </Field>
          <Field label="Dimensioni" htmlFor="dimensions" hint="Es. 60x80 cm">
            <input id="dimensions" className={inputCls} value={v.dimensions} onChange={(e) => set("dimensions", e.target.value)} />
          </Field>
          <Field label="Tecnica" htmlFor="technique" hint="Es. Olio su tela">
            <input id="technique" className={inputCls} value={v.technique} onChange={(e) => set("technique", e.target.value)} />
          </Field>
          <Field label="Disponibilità" htmlFor="availability" error={errors.availability}>
            <select
              id="availability"
              className={inputCls}
              value={v.availability}
              onChange={(e) => set("availability", e.target.value as Availability)}
            >
              <option value="available">Disponibile</option>
              <option value="private_collection">Collezione privata</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Descrizione" htmlFor="description" error={errors.description}>
              <textarea id="description" rows={6} className={textareaCls} value={v.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Poesia (facoltativa)" htmlFor="poem" hint="Ogni a capo viene mantenuto.">
              <textarea id="poem" rows={5} className={`${textareaCls} font-serif italic`} value={v.poem} onChange={(e) => set("poem", e.target.value)} />
            </Field>
          </div>
        </div>

        <fieldset className={cardCls}>
          <legend className="px-1 text-sm font-medium">Collega a Eventi/Mostre</legend>
          {events.length === 0 ? (
            <p className="text-sm text-muted">Nessuna mostra disponibile.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {events.map((ev) => (
                <li key={ev.id}>
                  <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-bg">
                    <input
                      type="checkbox"
                      className="size-5 accent-[#C5A059]"
                      checked={v.eventIds.includes(ev.id)}
                      onChange={() => toggleEvent(ev.id)}
                    />
                    <span className="font-medium">{ev.title}</span>
                    <span className="text-sm text-muted">{formatDate(ev.startDate)}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        <FormActions
          pending={pending}
          error={errors._form}
          cancelHref="/admin/dipinti"
          label={id ? "Salva modifiche" : "Crea dipinto"}
        />
      </div>

      <aside className="xl:sticky xl:top-6 xl:self-start">
        <PaintingPreview
          title={v.title}
          imageUrl={v.mainImageUrl}
          date={v.date}
          technique={v.technique}
          dimensions={v.dimensions}
          availability={v.availability}
          poem={v.poem}
        />
      </aside>
    </form>
  );
}
