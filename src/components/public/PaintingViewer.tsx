"use client";

import { useState } from "react";
import { ZoomIn } from "lucide-react";
import Lightbox from "./Lightbox";

/** Main artwork viewer + detail thumbnails + zoom lightbox. */
export default function PaintingViewer({
  title,
  mainImageUrl,
  detailImages,
}: {
  title: string;
  mainImageUrl: string;
  detailImages: string[];
}) {
  const images = [mainImageUrl, ...detailImages];
  const [current, setCurrent] = useState(0);
  const [zoom, setZoom] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setZoom(true)}
        aria-label="Ingrandisci immagine"
        className="group relative block w-full cursor-zoom-in overflow-hidden rounded-sm border border-border bg-surface"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[current]}
          alt={current === 0 ? title : `${title} — dettaglio ${current}`}
          className="mx-auto block h-auto max-h-[70vh] lg:max-h-[calc(100vh-14rem)] w-full object-contain"
        />
        <span className="absolute bottom-3 right-3 rounded-full bg-black/60 p-2 text-fg opacity-80 transition-opacity group-hover:opacity-100">
          <ZoomIn size={18} aria-hidden />
        </span>
      </button>

      {images.length > 1 && (
        <ul className="mt-4 flex flex-wrap gap-3">
          {images.map((src, i) => (
            <li key={`${src}-${i}`}>
              <button
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={i === 0 ? "Immagine principale" : `Dettaglio ${i}`}
                aria-current={current === i}
                className={`block overflow-hidden rounded-sm border-2 transition-colors ${
                  current === i ? "border-accent" : "border-border hover:border-accent/60"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" loading="lazy" className="size-20 object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {zoom && (
        <Lightbox
          images={images}
          alt={title}
          index={current}
          onClose={() => setZoom(false)}
          onChange={setCurrent}
        />
      )}
    </div>
  );
}
