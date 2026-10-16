import { MetadataRoute } from "next";

/**
 * Sitemap index for KenyaDesires.
 *
 * Instead of rendering every URL in a single (huge) /sitemap.xml, this index
 * references per-section sitemaps served by `app/sitemaps/[section]/route.ts`.
 * Each section is independently generated, size-capped, and error-isolated so
 * one failing section can never crash the whole sitemap.
 *
 * Next.js renders this as `/sitemap.xml` with `application/xml` content type.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.xyz";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  return [
    { url: `${BASE_URL}/sitemaps/static`, lastModified: now },
    { url: `${BASE_URL}/sitemaps/blog`, lastModified: now },
    { url: `${BASE_URL}/sitemaps/agencies`, lastModified: now },
    { url: `${BASE_URL}/sitemaps/counties`, lastModified: now },
    { url: `${BASE_URL}/sitemaps/practices`, lastModified: now },
    { url: `${BASE_URL}/sitemaps/combos`, lastModified: now },
  ];
}
