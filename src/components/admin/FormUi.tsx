import Link from "next/link";
import { Loader2 } from "lucide-react";

export const inputCls =
  "h-12 w-full rounded-lg border border-border bg-surface px-4 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";
export const textareaCls =
  "w-full rounded-lg border border-border bg-surface px-4 py-3 text-base leading-relaxed outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";
export const cardCls = "rounded-2xl border border-border bg-surface p-5 sm:p-6";
export const primaryBtn =
  "inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-fg px-6 text-base font-medium text-bg transition hover:bg-black disabled:opacity-60";
export const secondaryBtn =
  "inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-5 text-base font-medium transition hover:border-accent";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <div className="mt-1.5 text-xs text-muted">{hint}</div>}
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormActions({
  pending,
  uploading = false,
  error,
  cancelHref,
  label = "Salva",
}: {
  pending: boolean;
  /** An image upload is still running: saving is blocked until it ends. */
  uploading?: boolean;
  error?: string;
  cancelHref?: string;
  label?: string;
}) {
  return (
    <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-border bg-bg/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
      <button type="submit" disabled={pending || uploading} className={primaryBtn}>
        {(pending || uploading) && <Loader2 size={18} className="animate-spin" />}
        {pending ? "Salvataggio…" : uploading ? "Caricamento immagini…" : label}
      </button>
      {cancelHref && (
        <Link href={cancelHref} className={secondaryBtn}>
          Annulla
        </Link>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
