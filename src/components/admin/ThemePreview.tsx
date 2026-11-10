import { themeVars, wallTexture, type SiteTheme } from "@/lib/theme";

/** Miniature of the public site rendered with the selected wall and main color. */
export default function ThemePreview({ theme }: { theme: SiteTheme }) {
  return (
    <div
      className="wall wall-contained rounded-2xl border border-border"
      data-texture={wallTexture(theme)}
      style={themeVars(theme) as React.CSSProperties}
      aria-label="Anteprima del sito pubblico"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <span className="font-serif text-xl font-semibold text-fg">Melissa Barbanti</span>
        <span className="flex gap-4 text-xs">
          <span className="text-accent">Opere</span>
          <span className="text-muted">Eventi</span>
          <span className="text-muted">Profilo</span>
        </span>
      </div>
      <div className="px-5 py-8">
        <p className="text-[10px] uppercase tracking-[0.25em] text-accent">In evidenza</p>
        <h3 className="mt-2 font-serif text-3xl leading-tight text-fg">Luce sul muro</h3>
        <p className="mt-3 border-l-2 border-accent pl-3 font-serif text-base italic text-fg/90">
          Un verso, una pennellata, un silenzio.
        </p>
        <div className="mt-6 grid grid-cols-3 items-end gap-3">
          {[
            ["h-24", "Senza titolo"],
            ["h-32", "Notturno"],
            ["h-20", "Studio n.3"],
          ].map(([h, title]) => (
            <div key={title} className="rounded-sm border border-border bg-surface p-2 shadow-sm">
              <div className={`${h} bg-muted/30`} />
              <p className="mt-2 truncate font-serif text-sm text-fg">{title}</p>
              <p className="flex items-center gap-1.5 text-[10px] text-muted">
                <span className="size-1.5 rounded-full bg-accent" /> Disponibile
              </p>
            </div>
          ))}
        </div>
        <span className="mt-6 inline-block border border-accent px-5 py-2 text-xs tracking-wide text-accent">
          Scopri tutte le opere
        </span>
      </div>
    </div>
  );
}
