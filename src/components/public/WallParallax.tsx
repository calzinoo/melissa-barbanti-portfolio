"use client";

import { useEffect } from "react";

/**
 * Publishes the page scroll progress (0..1) as --wall-progress on <html>.
 * The oversized wall texture layer uses it to slide slowly, revealing more of the background as you scroll.
 */
export default function WallParallax() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      if (reduced.matches) {
        root.style.setProperty("--wall-progress", "0");
        return;
      }
      const max = root.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      root.style.setProperty("--wall-progress", p.toFixed(4));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
      root.style.removeProperty("--wall-progress");
    };
  }, []);

  return null;
}
