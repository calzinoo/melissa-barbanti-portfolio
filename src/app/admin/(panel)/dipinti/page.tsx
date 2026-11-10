import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader, primaryBtn } from "@/components/admin/FormUi";
import PaintingsTable from "@/components/admin/PaintingsTable";
import { listPaintingsAdmin } from "@/lib/admin-queries";

async function List() {
  return <PaintingsTable rows={await listPaintingsAdmin()} />;
}

export default function PaintingsPage() {
  return (
    <>
      <PageHeader
        title="I miei Dipinti"
        action={
          <Link href="/admin/dipinti/nuovo" className={primaryBtn}>
            <Plus size={18} /> Nuovo dipinto
          </Link>
        }
      />
      <Suspense fallback={<p className="text-muted">Caricamento…</p>}>
        <List />
      </Suspense>
    </>
  );
}
