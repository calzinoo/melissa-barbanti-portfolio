import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/FormUi";
import PaintingForm from "@/components/admin/PaintingForm";
import { getPaintingForEdit, listEventOptions } from "@/lib/admin-queries";
import { parseJsonArray } from "@/lib/format";

async function Content({ params }: { params: PageProps<"/admin/dipinti/[id]">["params"] }) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id)) notFound();
  const [data, events] = await Promise.all([getPaintingForEdit(id), listEventOptions()]);
  if (!data) notFound();
  const p = data.painting;
  return (
    <>
      <PageHeader title={`Modifica: ${p.title}`} />
      <PaintingForm
        id={p.id}
        events={events}
        initial={{
          title: p.title,
          mainImageUrl: p.mainImageUrl,
          detailImages: parseJsonArray<string>(p.detailImagesJson),
          description: p.description,
          poem: p.poem ?? "",
          date: p.date,
          dimensions: p.dimensions ?? "",
          technique: p.technique ?? "",
          availability: p.availability,
          eventIds: data.eventIds,
        }}
      />
    </>
  );
}

export default function EditPaintingPage(props: PageProps<"/admin/dipinti/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted">Caricamento…</p>}>
      <Content params={props.params} />
    </Suspense>
  );
}
