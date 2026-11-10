"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { saveThemeAction } from "@/app/admin/content-actions";
import {
  ACCENT_SWATCHES,
  DEFAULT_ACCENT,
  DEFAULT_THEME,
  WALL_PRESETS,
  normalizeHex,
  themeVars,
  type SiteTheme,
} from "@/lib/theme";
import { Field, FormActions, cardCls, inputCls, secondaryBtn } from "./FormUi";
import ThemePreview from "./ThemePreview";

export default function ThemeForm({ initial }: { initial: SiteTheme }) {
  const [theme, setTheme] = useState(initial);
  const [hexText, setHexText] = useState(initial.accent ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const update = (patch: Partial<SiteTheme>) => {
    setSaved(false);
    setTheme((t) => ({ ...t, ...patch }));
  };
  const pickAccent = (value: string | null) => {
    setHexText(value ?? "");
    update({ accent: value });
  };
  const typeHex = (text: string) => {
    setHexText(text);
    const hex = normalizeHex(text);
    if (hex || !text.trim()) update({ accent: hex });
  };
  const hexInvalid = hexText.trim() !== "" && !normalizeHex(hexText);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (hexInvalid) return setErrors({ accent: "Colore non valido (es. #C5A059)" });
    start(async () => {
      try {
        const res = await saveThemeAction(theme);
        setErrors(res.ok ? {} : res.errors);
        setSaved(res.ok);
      } catch {
        setErrors({ _form: "Salvataggio non riuscito. Riprova." });
      }
    });
  }

  const activeAccent = theme.accent ?? DEFAULT_ACCENT;

  return (
    <form onSubmit={submit} className="grid gap-8 2xl:grid-cols-2">
      <div className="space-y-6">
        <fieldset className={cardCls}>
          <legend className="sr-only">Sfondo del sito</legend>
          <h2 className="font-serif text-2xl font-semibold">Parete della galleria</h2>
          <p className="mb-5 mt-1 text-sm text-muted">
            Scegli il muro su cui “appendere” le tue opere.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {WALL_PRESETS.map((w) => {
              const on = theme.wall === w.id;
              return (
                <label
                  key={w.id}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${
                    on ? "border-accent ring-2 ring-accent/40" : "border-border hover:border-accent/60"
                  }`}
                >
                  <input
                    type="radio"
                    name="wall"
                    value={w.id}
                    checked={on}
                    onChange={() => update({ wall: w.id })}
                    className="sr-only"
                  />
                  <span
                    aria-hidden
                    data-texture={w.texture}
                    className="wall wall-contained h-16 w-20 shrink-0 rounded-lg border border-black/10"
                    style={themeVars({ wall: w.id, accent: null }) as React.CSSProperties}
                  />
                  <span>
                    <span className="block text-[15px] font-medium">
                      {w.label}
                      {w.id === "chiaroscuro" && (
                        <span className="ml-2 text-xs font-normal text-muted">(attuale)</span>
                      )}
                    </span>
                    <span className="block text-xs leading-snug text-muted">{w.description}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className={cardCls}>
          <legend className="sr-only">Colore principale</legend>
          <h2 className="font-serif text-2xl font-semibold">Colore principale</h2>
          <p className="mb-5 mt-1 text-sm text-muted">
            Usato per link, evidenziazioni e dettagli. Se non è leggibile sulla parete scelta viene
            scurito o schiarito automaticamente.
          </p>
          <div className="flex flex-wrap gap-3">
            {ACCENT_SWATCHES.map((s) => {
              const on = activeAccent === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => pickAccent(s.value === DEFAULT_ACCENT ? null : s.value)}
                  aria-pressed={on}
                  title={s.label}
                  className={`flex h-12 items-center gap-2 rounded-full border px-4 text-sm transition ${
                    on ? "border-fg ring-2 ring-accent/40" : "border-border hover:border-accent"
                  }`}
                >
                  <span className="size-5 rounded-full border border-black/10" style={{ background: s.value }} />
                  {s.label}
                </button>
              );
            })}
          </div>
          <div className="mt-5 grid max-w-md grid-cols-[auto_1fr] items-end gap-3">
            <input
              type="color"
              aria-label="Scegli un colore personalizzato"
              value={normalizeHex(hexText) ?? activeAccent}
              onChange={(e) => pickAccent(e.target.value)}
              className="h-12 w-14 cursor-pointer rounded-lg border border-border bg-surface p-1"
            />
            <Field label="Colore personalizzato" htmlFor="accent" error={errors.accent}>
              <input
                id="accent"
                className={inputCls}
                placeholder="#C5A059"
                value={hexText}
                onChange={(e) => typeHex(e.target.value)}
              />
            </Field>
          </div>
          <button
            type="button"
            onClick={() => {
              setHexText("");
              setSaved(false);
              setTheme({ ...DEFAULT_THEME });
            }}
            className={`${secondaryBtn} mt-5`}
          >
            Ripristina tema originale
          </button>
        </fieldset>

        <FormActions pending={pending} error={errors._form} label="Salva aspetto" />
        {saved && (
          <p role="status" className="inline-flex items-center gap-2 text-sm text-green-800">
            <Check size={16} /> Aspetto salvato e sito aggiornato.
          </p>
        )}
      </div>

      <aside className="2xl:sticky 2xl:top-6 2xl:self-start">
        <p className="mb-2 text-sm font-medium text-muted">Anteprima dal vivo</p>
        <ThemePreview theme={theme} />
      </aside>
    </form>
  );
}
