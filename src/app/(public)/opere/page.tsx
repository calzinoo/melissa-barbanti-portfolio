import { Suspense } from "react";
import type { Metadata } from "next";
import PaintingsGallery from "@/components/public/PaintingsGallery";
import { getGalleryData } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Opere — Melissa Barbanti",
  description: "La galleria completa delle opere di Melissa Barbanti.",
};

async function GalleryContent() {
  const { paintings, exhibitedIds } = await getGalleryData();
  if (paintings.length === 0) {
    return (
      <p className="py-24 text-center font-serif text-2xl text-muted">
        Nuove opere in arrivo presto.
      </p>
    );
  }
  return <PaintingsGallery paintings={paintings} exhibitedIds={exhibitedIds} />;
}

export default function OperePage() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <p className="text-xs uppercase tracking-[0.25em] text-accent">Galleria</p>
      <h1 className="mt-4 mb-12 font-serif text-4xl text-fg md:text-5xl">Opere</h1>
      <Suspense fallback={<div className="min-h-[50vh]" />}>
        <GalleryContent />
      </Suspense>
    </section>
  );
}
