import type { Availability } from "@/db/schema";

export type Result<T> = { ok: true; data: T } | { ok: false; errors: Record<string, string> };

export type PaintingInput = {
  title: string;
  mainImageUrl: string;
  detailImages: string[];
  description: string;
  poem: string | null;
  date: string;
  dimensions: string | null;
  technique: string | null;
  availability: Availability;
  eventIds: number[];
};

export type EventInput = {
  title: string;
  summary: string;
  description: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  coverImageUrl: string | null;
  eventImages: string[];
  paintingIds: number[];
};

const AVAILABILITY: readonly string[] = ["available", "private_collection"];

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const opt = (v: unknown) => str(v) || null;
const strings = (v: unknown) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];
const ids = (v: unknown) => [
  ...new Set((Array.isArray(v) ? v : []).map(Number).filter((n) => Number.isInteger(n) && n > 0)),
];

function finish<T>(errors: Record<string, string>, data: T): Result<T> {
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}

export function validatePainting(raw: Record<string, unknown>): Result<PaintingInput> {
  const errors: Record<string, string> = {};
  const title = str(raw.title);
  const mainImageUrl = str(raw.mainImageUrl);
  const description = str(raw.description);
  const date = str(raw.date);
  const availability = str(raw.availability) || "available";

  if (!title) errors.title = "Il titolo è obbligatorio";
  if (!mainImageUrl) errors.mainImageUrl = "L'immagine principale è obbligatoria";
  if (!isIsoDate(date)) errors.date = "Inserisci una data valida (AAAA-MM-GG)";
  if (!AVAILABILITY.includes(availability)) errors.availability = "Disponibilità non valida";

  return finish(errors, {
    title,
    mainImageUrl,
    detailImages: strings(raw.detailImages),
    description,
    poem: opt(raw.poem),
    date,
    dimensions: opt(raw.dimensions),
    technique: opt(raw.technique),
    availability: availability as Availability,
    eventIds: ids(raw.eventIds),
  });
}

export function validateEvent(raw: Record<string, unknown>): Result<EventInput> {
  const errors: Record<string, string> = {};
  const title = str(raw.title);
  const summary = str(raw.summary);
  const description = str(raw.description);
  const startDate = str(raw.startDate);
  const endDate = opt(raw.endDate);

  if (!title) errors.title = "Il titolo è obbligatorio";
  if (!summary) errors.summary = "Il sommario è obbligatorio";
  if (!description) errors.description = "La descrizione è obbligatoria";
  if (!isIsoDate(startDate)) errors.startDate = "Inserisci una data di inizio valida (AAAA-MM-GG)";
  if (endDate !== null) {
    if (!isIsoDate(endDate)) errors.endDate = "Inserisci una data di fine valida (AAAA-MM-GG)";
    else if (isIsoDate(startDate) && endDate < startDate) {
      errors.endDate = "La data di fine non può precedere quella di inizio";
    }
  }

  return finish(errors, {
    title,
    summary,
    description,
    startDate,
    endDate,
    location: opt(raw.location),
    coverImageUrl: opt(raw.coverImageUrl),
    eventImages: strings(raw.eventImages),
    paintingIds: ids(raw.paintingIds),
  });
}
