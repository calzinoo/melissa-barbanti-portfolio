"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { uploadImage } from "@/lib/image-optimize";

type Props = {
  /** Current image URLs (single mode uses at most one). */
  value: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  label: string;
  hint?: string;
  /** Hide the WebP badge when several uploaders share a section. */
  hideBadge?: boolean;
};

export default function ImageUploader({ value, onChange, multiple = false, label, hint, hideBadge }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  async function handleFiles(list: FileList | File[]) {
    const files = Array.from(list).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    setError(null);
    const batch = multiple ? files : files.slice(0, 1);
    setBusy(batch.length);
    const uploaded: string[] = [];
    for (const file of batch) {
      try {
        uploaded.push(await uploadImage(file));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Caricamento non riuscito");
      } finally {
        setBusy((n) => n - 1);
      }
    }
    if (uploaded.length) onChange(multiple ? [...value, ...uploaded] : [uploaded[0]]);
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= value.length || from === to) return;
    const next = [...value];
    next.splice(to, 0, next.splice(from, 1)[0]);
    onChange(next);
  }

  const dropProps = {
    onDragOver: (e: React.DragEvent) => {
      if (dragIndex !== null) return;
      e.preventDefault();
      setDragOver(true);
    },
    onDragLeave: () => setDragOver(false),
    onDrop: (e: React.DragEvent) => {
      if (dragIndex !== null) return;
      e.preventDefault();
      setDragOver(false);
      void handleFiles(e.dataTransfer.files);
    },
  };

  const showDropzone = multiple || value.length === 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        {!hideBadge && (
          <span className="inline-flex items-center gap-1 rounded-md bg-accent/15 px-2 py-1 text-xs text-[#7a5f27]">
            <Check size={12} /> Ottimizzazione WebP automatica attiva
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {value.map((url, i) => (
          <div
            key={url}
            draggable={multiple}
            onDragStart={() => setDragIndex(i)}
            onDragEnd={() => setDragIndex(null)}
            onDragOver={(e) => dragIndex !== null && e.preventDefault()}
            onDrop={() => {
              if (dragIndex !== null) move(dragIndex, i);
              setDragIndex(null);
            }}
            className={`relative overflow-hidden rounded-xl border border-border bg-bg ${
              !multiple ? "col-span-2 sm:col-span-3 xl:col-span-4" : ""
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`${label} ${i + 1}`}
              className={`w-full object-contain ${multiple ? "aspect-square" : "max-h-80"}`}
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5">
              {multiple ? (
                <div className="flex gap-1">
                  <IconBtn label="Sposta indietro" disabled={i === 0} onClick={() => move(i, i - 1)}>
                    <ArrowLeft size={16} />
                  </IconBtn>
                  <IconBtn label="Sposta avanti" disabled={i === value.length - 1} onClick={() => move(i, i + 1)}>
                    <ArrowRight size={16} />
                  </IconBtn>
                </div>
              ) : (
                <span />
              )}
              <IconBtn label="Rimuovi immagine" onClick={() => onChange(value.filter((_, j) => j !== i))}>
                <Trash2 size={16} />
              </IconBtn>
            </div>
          </div>
        ))}

        {Array.from({ length: busy }, (_, i) => (
          <div key={`busy-${i}`} className="flex aspect-square items-center justify-center rounded-xl border border-border bg-bg">
            <Loader2 className="animate-spin text-muted" size={24} />
          </div>
        ))}

        {showDropzone && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            {...dropProps}
            className={`flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center text-sm text-muted transition ${
              multiple ? "aspect-square" : "col-span-2 min-h-44 sm:col-span-3 xl:col-span-4"
            } ${dragOver ? "border-accent bg-accent/10" : "border-border hover:border-accent"}`}
          >
            <ImagePlus size={24} />
            <span className="font-medium text-fg">{multiple ? "Aggiungi foto" : "Scegli una foto"}</span>
            <span className="hidden sm:inline">oppure trascinala qui</span>
          </button>
        )}
      </div>

      {hint && <p className="text-xs text-muted">{hint}</p>}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={(e) => {
          if (e.target.files) void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-fg disabled:opacity-40"
    >
      {children}
    </button>
  );
}
