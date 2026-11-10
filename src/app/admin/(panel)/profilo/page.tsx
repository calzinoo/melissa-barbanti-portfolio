import { Suspense } from "react";
import { PageHeader } from "@/components/admin/FormUi";
import ProfileForm from "@/components/admin/ProfileForm";
import { getProfileAdmin } from "@/lib/admin-queries";
import { parseJsonArray } from "@/lib/format";

async function Content() {
  const p = await getProfileAdmin();
  return (
    <ProfileForm
      initial={{
        avatarUrl: p?.avatarUrl ?? "",
        bioDescription: p?.bioDescription ?? "",
        profileImages: parseJsonArray<string>(p?.profileImagesJson),
        instagramUrl: p?.instagramUrl ?? "",
        email: p?.email ?? "",
      }}
    />
  );
}

export default function AdminProfilePage() {
  return (
    <>
      <PageHeader title="Profilo e Bio" subtitle="Ritratto, biografia, foto dello studio e contatti." />
      <Suspense fallback={<p className="text-muted">Caricamento…</p>}>
        <Content />
      </Suspense>
    </>
  );
}
