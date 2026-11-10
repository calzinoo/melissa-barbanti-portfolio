import type { MetadataRoute } from "next";
import { getAllEvents, getGalleryData } from "@/lib/queries";
import { getSiteUrl } from "@/lib/site";

const STATIC_ROUTES = ["/", "/opere", "/eventi", "/profilo", "/note-legali"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  // Both queries degrade to empty lists if the database is unreachable.
  const [{ paintings }, events] = await Promise.all([getGalleryData(), getAllEvents()]);
  return [
    ...STATIC_ROUTES.map((path) => ({ url: `${base}${path === "/" ? "" : path}`, changeFrequency: "weekly" as const })),
    ...paintings.map((p) => ({ url: `${base}/opere/${p.slug}`, lastModified: p.date, changeFrequency: "monthly" as const })),
    ...events.map((e) => ({ url: `${base}/eventi/${e.slug}`, lastModified: e.startDate, changeFrequency: "monthly" as const })),
  ];
}
