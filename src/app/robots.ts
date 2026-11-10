import type { MetadataRoute } from "next";
import { AI_BOTS, getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
      // Explicit AI-training opt-out, matching the clause in /note-legali.
      { userAgent: [...AI_BOTS], disallow: "/" },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
