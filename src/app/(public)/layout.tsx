import { Suspense } from "react";
import Footer from "@/components/public/Footer";
import Navbar from "@/components/public/Navbar";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Suspense fallback={<div className="mt-24 h-32 border-t border-border" />}>
        <Footer />
      </Suspense>
    </>
  );
}
