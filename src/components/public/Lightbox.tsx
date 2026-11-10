"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type Props = {
  images: string[];
  alt: string;
  index: number;
  onClose: () => void;
  onChange: (index: number) => void;
};

const btn =
  "absolute rounded-full bg-black/50 p-3 text-fg transition-colors hover:text-accent focus-visible:text-accent";

/** Full-screen zoom modal. Images are shown contained, never cropped. */
export default function Lightbox({ images, alt, index, onClose, onChange }: Props) {
  const count = images.length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onChange((index - 1 + count) % count);
      else if (e.key === "ArrowRight") onChange((index + 1) % count);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [index, count, onClose, onChange]);

  const step = (delta: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange((index + delta + count) % count);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visualizzazione ingrandita"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 md:p-10"
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[index]}
        alt={`${alt} (${index + 1} di ${count})`}
        className="max-h-full max-w-full select-none object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <button type="button" aria-label="Chiudi" onClick={onClose} className={`${btn} right-4 top-4`}>
        <X size={22} />
      </button>
      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Immagine precedente"
            onClick={step(-1)}
            className={`${btn} left-4 top-1/2 -translate-y-1/2`}
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            aria-label="Immagine successiva"
            onClick={step(1)}
            className={`${btn} right-4 top-1/2 -translate-y-1/2`}
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}
    </div>
  );
}
