import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Area Pittrice — Melissa Barbanti",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="admin" className="min-h-screen bg-bg text-fg">
      {children}
    </div>
  );
}
