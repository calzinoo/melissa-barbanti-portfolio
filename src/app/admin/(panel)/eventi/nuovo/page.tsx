import { connection } from "next/server";
import { Suspense } from "react";
import EventForm from "@/components/admin/EventForm";
import { PageHeader } from "@/components/admin/FormUi";
import { listPaintingOptions } from "@/lib/admin-queries";

async function Content() {
  await connection(); // default date depends on the current time
  return (
    <EventForm
      paintings={await listPaintingOptions()}
      initial={{
        title: "",
        summary: "",
        description: "",
        startDate: new Date().toISOString().slice(0, 10),
        endDate: "",
        location: "",
        coverImageUrl: "",
        eventImages: [],
        paintingIds: [],
      }}
    />
  );
}

export default function NewEventPage() {
  return (
    <>
      <PageHeader title="Nuovo evento" />
      <Suspense fallback={<p className="text-muted">Caricamento…</p>}>
        <Content />
      </Suspense>
    </>
  );
}
