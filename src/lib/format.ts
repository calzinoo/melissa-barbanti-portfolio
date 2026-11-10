const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("it-IT", { timeZone: "UTC", ...opts });

const parse = (iso: string) => new Date(`${iso}T00:00:00Z`);

export const yearOf = (iso: string) => iso.slice(0, 4);

export function formatDate(iso: string): string {
  return fmt({ day: "numeric", month: "short", year: "numeric" }).format(parse(iso));
}

/** "10 gen – 20 feb 2025", or a single date when there is no (distinct) end date. */
export function formatDateRange(start: string, end?: string | null): string {
  if (!end || end === start) return formatDate(start);
  const short = fmt({ day: "numeric", month: "short" });
  const sameYear = yearOf(start) === yearOf(end);
  const from = sameYear ? short.format(parse(start)) : formatDate(start);
  return `${from} – ${formatDate(end)}`;
}

export function parseJsonArray<T>(json: string | null | undefined): T[] {
  if (!json) return [];
  try {
    const value: unknown = JSON.parse(json);
    return Array.isArray(value) ? (value as T[]) : [];
  } catch {
    return [];
  }
}
