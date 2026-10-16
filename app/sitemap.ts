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

const baseUrl = () => {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  return process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://kenyadesires.xyz";
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const base = baseUrl();

  return [
    { url: `${base}/sitemaps/static`, lastModified: now },
    { url: `${base}/sitemaps/blog`, lastModified: now },
    { url: `${base}/sitemaps/agencies`, lastModified: now },
    { url: `${base}/sitemaps/counties`, lastModified: now },
    { url: `${base}/sitemaps/practices`, lastModified: now },
    { url: `${base}/sitemaps/combos`, lastModified: now },
  ];
}
