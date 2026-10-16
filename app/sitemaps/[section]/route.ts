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

const baseUrl = () => {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  return process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://kenyadesires.xyz";
};

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
      (featuredPosts || []).map((fp: any) => fp._id),
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

    console.log(`[sitemaps/blog] ${posts?.length ?? 0} blog URLs`);
  } catch (error) {
    console.error("[sitemaps/blog] generation error:", error);
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

    if (!Array.isArray(agencies)) {
      console.error(
        `[sitemaps/agencies] getAgenciesForSitemap returned non-array: ${typeof agencies}`,
      );
      return entries;
    }

    for (const agency of agencies) {
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

    console.log(`[sitemaps/agencies] ${agencies.length} agency URLs`);
  } catch (error) {
    console.error("[sitemaps/agencies] generation error:", error);
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

    if (!res?.success || !Array.isArray(res.data)) {
      console.error(
        `[sitemaps/counties] getAllCounties failed: success=${
          res?.success
        }, data=${Array.isArray(res?.data) ? res.data.length : "undefined"}`,
      );
      return entries;
    }

    const counties = res.data;

    for (const county of counties) {
      if (!county?.name) continue;
      entries.push({
        url: sanitizeUrl(
          base,
          buildListingHref("/girls", { county: county.name }),
        ),
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.7,
      });
    }

    console.log(`[sitemaps/counties] ${counties.length} county URLs`);
  } catch (error) {
    console.error("[sitemaps/counties] generation error:", error);
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

    if (!Array.isArray(practices)) {
      console.error(
        `[sitemaps/practices] getPracticesFromCleanedEscorts returned non-array: ${typeof practices}`,
      );
      return entries;
    }

    for (const p of practices) {
      if (!p?.practice) continue;
      entries.push({
        url: sanitizeUrl(
          base,
          buildListingHref("/girls", { practice: p.practice }),
        ),
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.6,
      });
    }

    console.log(`[sitemaps/practices] ${practices.length} practice URLs`);
  } catch (error) {
    console.error("[sitemaps/practices] generation error:", error);
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

    if (!countiesRes?.success || !Array.isArray(countiesRes.data)) {
      console.error(
        `[sitemaps/combos] counties failed: success=${
          countiesRes?.success
        }, data=${Array.isArray(countiesRes?.data) ? countiesRes.data.length : "undefined"}`,
      );
    }
    if (!regionsRes?.success || !Array.isArray(regionsRes.data)) {
      console.error(
        `[sitemaps/combos] regions failed: success=${
          regionsRes?.success
        }, data=${Array.isArray(regionsRes?.data) ? regionsRes.data.length : "undefined"}`,
      );
    }
    if (!Array.isArray(practicesRes)) {
      console.error(
        `[sitemaps/combos] practices returned non-array: ${typeof practicesRes}`,
      );
    }

    const counties = countiesRes?.success && Array.isArray(countiesRes.data)
      ? countiesRes.data
      : [];
    const regions = regionsRes?.success && Array.isArray(regionsRes.data)
      ? regionsRes.data
      : [];
    const practices = Array.isArray(practicesRes) ? practicesRes : [];

    // County + region combos
    for (const r of regions) {
      if (!r?.county || !r?.name) continue;
      entries.push({
        url: sanitizeUrl(
          base,
          buildListingHref("/girls", { county: r.county, region: r.name }),
        ),
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.5,
      });
    }

    // County + practice combos
    for (const c of counties) {
      if (!c?.name) continue;
      for (const p of practices) {
        if (!p?.practice) continue;
        entries.push({
          url: sanitizeUrl(
            base,
            buildListingHref("/girls", {
              county: c.name,
              practice: p.practice,
            }),
          ),
          lastModified: new Date(),
          changeFrequency: "daily",
          priority: 0.5,
        });
      }
    }

    // Region + practice combos
    for (const r of regions) {
      if (!r?.county || !r?.name) continue;
      for (const p of practices) {
        if (!p?.practice) continue;
        entries.push({
          url: sanitizeUrl(
            base,
            buildListingHref("/girls", {
              county: r.county,
              region: r.name,
              practice: p.practice,
            }),
          ),
          lastModified: new Date(),
          changeFrequency: "daily",
          priority: 0.4,
        });
      }
    }

    console.log(
      `[sitemaps/combos] ${entries.length} combo URLs (${counties.length} counties, ${regions.length} regions, ${practices.length} practices)`,
    );
  } catch (error) {
    console.error("[sitemaps/combos] generation error:", error);
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
  const { section } = await params;
  const fetchEntries = SECTION_FETCHERS[section];

  let entries: MetadataRoute.Sitemap = [];

  if (fetchEntries) {
    try {
      entries = await fetchEntries();
    } catch (error) {
      console.error(`[sitemaps/${section}] generation failed:`, error);
      entries = [];
    }
  } else {
    console.error(`[sitemaps/${section}] unknown section — no fetcher registered`);
  }

  if (entries.length === 0) {
    console.warn(
      `[sitemaps/${section}] returning empty sitemap (0 URLs). Check server logs above for the cause.`,
    );
  }

  console.log(`[sitemaps/${section}] serving ${entries.length} URLs`);

  const xml = toSitemapXml(entries);

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
