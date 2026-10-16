/**
 * app/sitemaps/[section]/route.ts
 *
 * Per-section XML sitemap Route Handlers. Each section is generated
 * independently, capped at MAX_URLS entries, wrapped in try/catch, and served
 * with an explicit `application/xml` content type.
 *
 * Sections:
 *   static    - homepage, about, FAQ, contact, legal, category landing pages
 *   blog      - Sanity blog posts
 *   agencies  - agency profile pages
 *   counties  - county-filtered girls listing pages
 *   practices - practice-filtered girls listing pages
 *   combos    - county+region, county+practice, region+practice combos
 */

import type { MetadataRoute } from "next";

import {
  dedupeSitemapEntries,
  escapeXmlEntities,
  sanitizeUrl,
  validateSitemapEntries,
} from "@/lib/sanity/sitemap-helper";
import { buildListingHref } from "@/lib/utils";
import {
  getBlogPostsCountForSitemap,
  getBlogPostsForSitemap,
  getFeaturedBlogPostsForSitemap,
} from "@/lib/sanity/queries";

/** Hard cap per sitemap file (sitemap protocol limit is 50,000). */
const MAX_URLS = 45000;

const baseUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.xyz").replace(
    /\/$/,
    ""
  );

/** Serialize entries to a valid XML sitemap document. */
function toSitemapXml(entries: MetadataRoute.Sitemap): string {
  const valid = validateSitemapEntries(entries).valid;
  const deduped = dedupeSitemapEntries(valid);
  const limited = deduped.slice(0, MAX_URLS);

  const items = limited
    .map(
      (e) => `
  <url>
    <loc>${escapeXmlEntities(e.url)}</loc>
    <lastmod>${e.lastModified instanceof Date
      ? e.lastModified.toISOString()
      : e.lastModified}</lastmod>
    <changefreq>${e.changeFrequency}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}
</urlset>`;
}

/** ---------- Static routes ---------- */
async function staticEntries(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const now = new Date();
  const routes = [
    { path: "", priority: 1.0, changefreq: "daily" as const },
    { path: "/about", priority: 0.9, changefreq: "monthly" as const },
    { path: "/frequent-questions", priority: 0.8, changefreq: "monthly" as const },
    { path: "/girls", priority: 0.9, changefreq: "daily" as const },
    { path: "/agencies", priority: 0.8, changefreq: "daily" as const },
    { path: "/blog", priority: 0.9, changefreq: "daily" as const },
    { path: "/contact", priority: 0.7, changefreq: "monthly" as const },
    { path: "/terms", priority: 0.5, changefreq: "yearly" as const },
    { path: "/privacy-policy", priority: 0.5, changefreq: "yearly" as const },
    { path: "/bdsm", priority: 0.6, changefreq: "monthly" as const },
    { path: "/erotic-massages", priority: 0.6, changefreq: "monthly" as const },
    { path: "/join-provider", priority: 0.9, changefreq: "weekly" as const },
    { path: "/join-agency", priority: 0.9, changefreq: "weekly" as const },
  ];

  return routes.map((r) => ({
    url: sanitizeUrl(base, r.path),
    lastModified: now,
    changeFrequency: r.changefreq,
    priority: r.priority,
  }));
}

/** ---------- Blog posts (Sanity) ---------- */
async function blogEntries(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const entries: MetadataRoute.Sitemap = [];

  try {
    const featuredPosts = await getFeaturedBlogPostsForSitemap();
    const posts = await getBlogPostsForSitemap();

    const featuredIds = new Set(
      (featuredPosts || []).map((fp: any) => fp._id)
    );

    for (const post of posts || []) {
      if (!post.slug?.current) continue;
      const isFeatured = featuredIds.has(post._id);
      entries.push({
        url: sanitizeUrl(base, `blog/${post.slug.current}`),
        lastModified: post._updatedAt
          ? new Date(post._updatedAt)
          : new Date(),
        changeFrequency: isFeatured ? "weekly" : "monthly",
        priority: isFeatured ? 0.9 : 0.7,
      });
    }
  } catch {
    // Sanity unavailable — return empty, never crash the sitemap
  }

  return entries;
}

/** ---------- Agency profiles ---------- */
async function agencyEntries(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const entries: MetadataRoute.Sitemap = [];

  try {
    const { getAgenciesForSitemap } = await import(
      "@/server-actions/agency.action"
    );
    const agencies = await getAgenciesForSitemap();

    for (const agency of agencies || []) {
      if (!agency?.id) continue;
      entries.push({
        url: sanitizeUrl(base, `agencies/${agency.id}`),
        lastModified: agency.updatedAt
          ? new Date(agency.updatedAt)
          : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // DB unavailable — return empty
  }

  return entries;
}

/** ---------- County-filtered girls pages ---------- */
async function countyEntries(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const entries: MetadataRoute.Sitemap = [];

  try {
    const { getAllCounties } = await import("@/server-actions/region.action");
    const res = await getAllCounties();
    const counties = res?.data || [];

    for (const county of counties || []) {
      if (!county?.name) continue;
      entries.push({
        url: sanitizeUrl(
          base,
          buildListingHref("/girls", { county: county.name })
        ),
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.7,
      });
    }
  } catch {
    // DB unavailable — return empty
  }

  return entries;
}

/** ---------- Practice-filtered girls pages ---------- */
async function practiceEntries(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const entries: MetadataRoute.Sitemap = [];

  try {
    const { getPracticesFromCleanedEscorts } = await import(
      "@/server-actions/cleaned-escorts.action"
    );
    const practices = await getPracticesFromCleanedEscorts();

    for (const p of practices || []) {
      if (!p?.practice) continue;
      entries.push({
        url: sanitizeUrl(
          base,
          buildListingHref("/girls", { practice: p.practice })
        ),
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.6,
      });
    }
  } catch {
    // DB unavailable — return empty
  }

  return entries;
}

/** ---------- Combination pages ---------- */
async function comboEntries(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const entries: MetadataRoute.Sitemap = [];

  try {
    const [
      { getAllCounties },
      { getAllRegions },
      { getPracticesFromCleanedEscorts },
    ] = await Promise.all([
      import("@/server-actions/region.action"),
      import("@/server-actions/region.action"),
      import("@/server-actions/cleaned-escorts.action"),
    ]);

    const [countiesRes, regionsRes, practicesRes] = await Promise.all([
      getAllCounties(),
      getAllRegions(),
      getPracticesFromCleanedEscorts(),
    ]);

    const counties = countiesRes?.data || [];
    const regions = regionsRes?.data || [];
    const practices = practicesRes || [];

    // County + region combos
    for (const r of regions || []) {
      if (!r?.county || !r?.name) continue;
      entries.push({
        url: sanitizeUrl(
          base,
          buildListingHref("/girls", { county: r.county, region: r.name })
        ),
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.5,
      });
    }

    // County + practice combos
    for (const c of counties || []) {
      if (!c?.name) continue;
      for (const p of practices || []) {
        if (!p?.practice) continue;
        entries.push({
          url: sanitizeUrl(
            base,
            buildListingHref("/girls", {
              county: c.name,
              practice: p.practice,
            })
          ),
          lastModified: new Date(),
          changeFrequency: "daily",
          priority: 0.5,
        });
      }
    }

    // Region + practice combos
    for (const r of regions || []) {
      if (!r?.county || !r?.name) continue;
      for (const p of practices || []) {
        if (!p?.practice) continue;
        entries.push({
          url: sanitizeUrl(
            base,
            buildListingHref("/girls", {
              county: r.county,
              region: r.name,
              practice: p.practice,
            })
          ),
          lastModified: new Date(),
          changeFrequency: "daily",
          priority: 0.4,
        });
      }
    }
  } catch {
    // DB unavailable — return empty
  }

  return entries;
}

const SECTION_FETCHERS: Record<
  string,
  () => Promise<MetadataRoute.Sitemap>
> = {
  static: staticEntries,
  blog: blogEntries,
  agencies: agencyEntries,
  counties: countyEntries,
  practices: practiceEntries,
  combos: comboEntries,
};

export async function GET(
  _req: Request,
  { params }: { params: { section: string } }
) {
  const section = params.section;
  const fetchEntries = SECTION_FETCHERS[section];

  let entries: MetadataRoute.Sitemap = [];

  if (fetchEntries) {
    try {
      entries = await fetchEntries();
    } catch (error) {
      console.error(`[sitemaps/${section}] generation failed:`, error);
      entries = [];
    }
  }

  const xml = toSitemapXml(entries);

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
