import { Suspense } from "react";
import { notFound } from "next/navigation";
import EventForm from "@/components/admin/EventForm";
import { PageHeader } from "@/components/admin/FormUi";
import { getEventForEdit, listPaintingOptions } from "@/lib/admin-queries";
import { parseJsonArray } from "@/lib/format";

async function Content({ params }: { params: PageProps<"/admin/eventi/[id]">["params"] }) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id)) notFound();
  const [data, paintings] = await Promise.all([getEventForEdit(id), listPaintingOptions()]);
  if (!data) notFound();
  const e = data.event;
  return (
    <>
      <PageHeader title={`Modifica: ${e.title}`} />
      <EventForm
        id={e.id}
        paintings={paintings}
        initial={{
          title: e.title,
          summary: e.summary,
          description: e.description,
          startDate: e.startDate,
          endDate: e.endDate ?? "",
          location: e.location ?? "",
          coverImageUrl: e.coverImageUrl ?? "",
          eventImages: parseJsonArray<string>(e.eventImagesJson),
          paintingIds: data.paintingIds,
        }}
      />
    </>
  );
}

export default function EditEventPage(props: PageProps<"/admin/eventi/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted">Caricamento…</p>}>
      <Content params={props.params} />
    </Suspense>
  );
}
