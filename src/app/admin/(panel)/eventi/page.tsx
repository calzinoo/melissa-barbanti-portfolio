import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import EventsList from "@/components/admin/EventsList";
import { PageHeader, primaryBtn } from "@/components/admin/FormUi";
import { listEventsAdmin } from "@/lib/admin-queries";

async function List() {
  return <EventsList rows={await listEventsAdmin()} />;
}

export default function EventsPage() {
  return (
    <>
      <PageHeader
        title="Eventi e Mostre"
        action={
          <Link href="/admin/eventi/nuovo" className={primaryBtn}>
            <Plus size={18} /> Nuovo evento
          </Link>
        }
      />
      <Suspense fallback={<p className="text-muted">Caricamento…</p>}>
        <List />
      </Suspense>
    </>
  );
}
