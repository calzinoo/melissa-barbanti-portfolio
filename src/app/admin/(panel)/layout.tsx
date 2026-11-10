import { Suspense } from "react";
import AdminShell from "@/components/admin/AdminShell";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  // AdminShell reads usePathname(), which is request-time data on dynamic routes.
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
