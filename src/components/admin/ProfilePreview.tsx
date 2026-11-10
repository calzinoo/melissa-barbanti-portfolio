import SmartEditorialLayout from "@/components/public/SmartEditorialLayout";

/** Live preview of the public biography layout, rendered with the dark public palette. */
export default function ProfilePreview({ text, images }: { text: string; images: string[] }) {
  return (
    <div
      className="max-h-[80vh] overflow-y-auto rounded-2xl p-6 sm:p-8"
      style={
        {
          "--bg": "#141413",
          "--surface": "#1E1D1B",
          "--border": "#2E2C29",
          "--fg": "#F4F1EA",
          "--muted": "#A39E93",
          "--accent": "#C5A059",
          background: "#141413",
          color: "#F4F1EA",
        } as React.CSSProperties
      }
    >
      <p className="mb-6 text-xs uppercase tracking-widest text-[#A39E93]">
        Anteprima impaginazione biografia
      </p>
      {text.trim() ? (
        <SmartEditorialLayout text={text} images={images} alt="Atelier" />
      ) : (
        <p className="text-sm text-[#A39E93]">Scrivi la biografia per vedere l&apos;anteprima.</p>
      )}
    </div>
  );
}
