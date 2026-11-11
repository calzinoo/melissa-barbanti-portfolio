import { Suspense } from "react";
import Footer from "@/components/public/Footer";
import Navbar from "@/components/public/Navbar";
import WallParallax from "@/components/public/WallParallax";
import { getSiteTheme } from "@/lib/queries";
import { themeVars, wallTexture } from "@/lib/theme";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const theme = await getSiteTheme();
  return (
    // CSS variables set here override the :root defaults for the whole public site.
    <div
      className="wall flex flex-1 flex-col"
      data-texture={wallTexture(theme)}
      style={themeVars(theme) as React.CSSProperties}
    >
      <WallParallax />
      <Suspense fallback={<div className="h-16 border-b border-border" />}>
        <Navbar />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Suspense fallback={<div className="mt-24 h-32 border-t border-border" />}>
        <Footer />
      </Suspense>
    </div>
  );
}
