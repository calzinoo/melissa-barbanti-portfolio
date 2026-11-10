import { Suspense } from "react";
import HomeManager from "@/components/admin/HomeManager";
import { PageHeader } from "@/components/admin/FormUi";
import { getHomeAdminData } from "@/lib/admin-queries";

async function HomeContent() {
  const d = await getHomeAdminData();
  return (
    <HomeManager
      initialMode={d.mode}
      initialHero={d.heroType && d.heroId != null ? { type: d.heroType, id: d.heroId } : null}
      initialSlots={d.slots.map(({ type, id }) => ({ type, id }))}
      items={d.items}
    />
  );
}

export default function AdminHomePage() {
  return (
    <>
      <PageHeader title="Gestione Home Page" subtitle="Scegli cosa mostrare in evidenza e nella griglia della home." />
      <Suspense fallback={<p className="text-muted">Caricamento…</p>}>
        <HomeContent />
      </Suspense>
    </>
  );
}
