"use client";

import { useState } from "react";
import Lightbox from "./Lightbox";

/** Responsive masonry grid (natural aspect ratios) with lightbox. */
export default function ImageMasonry({ images, alt }: { images: string[]; alt: string }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {images.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={() => setOpen(i)}
            aria-label={`Ingrandisci immagine ${i + 1}`}
            className="mb-4 block w-full cursor-zoom-in break-inside-avoid overflow-hidden rounded-sm border border-border transition-colors hover:border-accent/60 focus-visible:border-accent"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${alt} — foto ${i + 1}`} loading="lazy" className="block h-auto w-full" />
          </button>
        ))}
      </div>
      {open !== null && (
        <Lightbox images={images} alt={alt} index={open} onClose={() => setOpen(null)} onChange={setOpen} />
      )}
    </>
  );
}
