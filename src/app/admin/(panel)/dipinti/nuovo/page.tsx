import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/FormUi";
import PaintingForm from "@/components/admin/PaintingForm";
import { listEventOptions } from "@/lib/admin-queries";

async function Content() {
  await connection(); // default date depends on the current time
  const events = await listEventOptions();
  return (
    <PaintingForm
      events={events}
      initial={{
        title: "",
        mainImageUrl: "",
        detailImages: [],
        description: "",
        poem: "",
        date: new Date().toISOString().slice(0, 10),
        dimensions: "",
        technique: "",
        availability: "available",
        eventIds: [],
      }}
    />
  );
}

export default function NewPaintingPage() {
  return (
    <>
      <PageHeader title="Nuovo dipinto" />
      <Suspense fallback={<p className="text-muted">Caricamento…</p>}>
        <Content />
      </Suspense>
    </>
  );
}
