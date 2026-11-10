import { Suspense } from "react";
import { PageHeader } from "@/components/admin/FormUi";
import ThemeForm from "@/components/admin/ThemeForm";
import { getThemeAdmin } from "@/lib/admin-queries";

async function Content() {
  return <ThemeForm initial={await getThemeAdmin()} />;
}

export default function AdminThemePage() {
  return (
    <>
      <PageHeader
        title="Aspetto del Sito"
        subtitle="Scegli la parete e il colore principale del sito pubblico."
      />
      <Suspense fallback={<p className="text-muted">Caricamento…</p>}>
        <Content />
      </Suspense>
    </>
  );
}
