type Props = {
  title: string;
  imageUrl: string;
  date: string;
  technique: string;
  dimensions: string;
  availability: "available" | "private_collection";
  poem: string;
};

/** Dark-theme preview of the public painting card and poem block. */
export default function PaintingPreview(p: Props) {
  const details = [p.technique, p.dimensions].filter(Boolean).join(" · ");
  return (
    <div className="rounded-2xl bg-[#141413] p-5 text-[#F4F1EA]">
      <p className="mb-4 text-xs uppercase tracking-widest text-[#A39E93]">Anteprima sito pubblico</p>
      <div className="rounded-sm border border-[#2E2C29] bg-[#1E1D1B]">
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.imageUrl} alt="" className="block h-auto w-full" />
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-[#A39E93]">
            Nessuna immagine
          </div>
        )}
        <div className="p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-serif text-xl leading-tight">{p.title || "Titolo del dipinto"}</h3>
            <span className="text-xs text-[#A39E93]">{p.date.slice(0, 4)}</span>
          </div>
          {details && <p className="mt-1 text-xs text-[#A39E93]">{details}</p>}
          <p className="mt-3 flex items-center gap-2 text-xs text-[#A39E93]">
            <span
              aria-hidden
              className={`size-2 rounded-full ${
                p.availability === "available" ? "bg-[#C5A059]" : "border border-[#A39E93]"
              }`}
            />
            {p.availability === "available" ? "Disponibile" : "Collezione privata"}
          </p>
        </div>
      </div>
      {p.poem.trim() && (
        <blockquote className="mt-6 whitespace-pre-line border-l-2 border-[#C5A059] pl-5 font-serif text-xl italic leading-relaxed">
          {p.poem}
        </blockquote>
      )}
    </div>
  );
}
