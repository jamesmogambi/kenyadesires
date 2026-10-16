import { writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from "fs";
import { join } from "path";

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const MAX_URLS = 45000;
const baseUrl =
  (process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.xyz").replace(
    /\/$/,
    "");

function toSitemapXml(
  entries: Array<{
    url: string;
    lastModified: Date;
    changeFrequency: string;
    priority: number;
  }>
): string {
  const limited = entries.slice(0, MAX_URLS);
  const items = limited
    .map(
      (e) => `
  <url>
    <loc>${escapeXml(e.url)}</loc>
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

function writeSitemap(fileName: string, xml: string): void {
  const publicDir = join(process.cwd(), "public");
  mkdirSync(publicDir, { recursive: true });

  const sectionDir = join(publicDir, "sitemaps");
  mkdirSync(sectionDir, { recursive: true });

  const filePath = join(sectionDir, fileName);
  writeFileSync(filePath, xml);
  console.log(`✅ Wrote ${filePath} (${xml.length} bytes)`);
}

function writeSitemapIndex(entries: Array<{ url: string; lastModified: Date }>): void {
  const publicDir = join(process.cwd(), "public");
  mkdirSync(publicDir, { recursive: true });

  const now = new Date();
  const items = entries
    .map(
      (e) => `
  <sitemap>
    <loc>${escapeXml(e.url)}</loc>
    <lastmod>${e.lastModified.toISOString()}</lastmod>
  </sitemap>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}
</sitemapindex>`;

  const filePath = join(publicDir, "sitemap.xml");
  writeFileSync(filePath, xml);
  console.log(`✅ Wrote ${filePath} (${xml.length} bytes)`);
}

/** Clear any stale sitemap files before regenerating. */
function cleanSitemaps(): void {
  const publicDir = join(process.cwd(), "public");
  const sitemapPath = join(publicDir, "sitemap.xml");
  if (existsSync(sitemapPath)) unlinkSync(sitemapPath);

  const sectionDir = join(publicDir, "sitemaps");
  if (existsSync(sectionDir)) {
    for (const file of readdirSync(sectionDir)) {
      if (file.endsWith(".xml")) unlinkSync(join(sectionDir, file));
    }
  }
}

async function generateSitemap() {
  console.log("🔄 Generating sitemap via CLI...");
  cleanSitemaps();

  try {
    // Import the sitemap index from app/sitemap.ts
    const { default: sitemapIndex } = await import("../app/sitemap");
    const index = await sitemapIndex();

    // Build base URL
    const base = baseUrl;

    // Section data fetchers (mirrors app/sitemaps/[section]/route.ts)
    async function staticEntries() {
      const now = new Date();
      const routes = [
        { path: "", priority: 1.0, changefreq: "daily" as const },
        { path: "/about", priority: 0.9, changefreq: "monthly" as const },
        {
          path: "/frequent-questions",
          priority: 0.8,
          changefreq: "monthly" as const,
        },
        { path: "/girls", priority: 0.9, changefreq: "daily" as const },
        { path: "/agencies", priority: 0.8, changefreq: "daily" as const },
        { path: "/blog", priority: 0.9, changefreq: "daily" as const },
        { path: "/contact", priority: 0.7, changefreq: "monthly" as const },
        { path: "/terms", priority: 0.5, changefreq: "yearly" as const },
        {
          path: "/privacy-policy",
          priority: 0.5,
          changefreq: "yearly" as const,
        },
        { path: "/bdsm", priority: 0.6, changefreq: "monthly" as const },
        {
          path: "/erotic-massages",
          priority: 0.6,
          changefreq: "monthly" as const,
        },
        {
          path: "/join-provider",
          priority: 0.9,
          changefreq: "weekly" as const,
        },
        {
          path: "/join-agency",
          priority: 0.9,
          changefreq: "weekly" as const,
        },
      ];
      return routes.map((r) => ({
        url: `${base}${r.path}`,
        lastModified: now,
        changeFrequency: r.changefreq,
        priority: r.priority,
      }));
    }

    async function blogEntries() {
      const entries: Array<{
        url: string;
        lastModified: Date;
        changeFrequency: string;
        priority: number;
      }> = [];
      try {
        const {
          getBlogPostsCountForSitemap,
          getBlogPostsForSitemap,
          getFeaturedBlogPostsForSitemap,
        } = await import("@/lib/sanity/queries");
        const featuredPosts = await getFeaturedBlogPostsForSitemap();
        const posts = await getBlogPostsForSitemap();
        const featuredIds = new Set(
          (featuredPosts || []).map((fp: any) => fp._id)
        );
        for (const post of posts || []) {
          if (!post.slug?.current) continue;
          const isFeatured = featuredIds.has(post._id);
          entries.push({
            url: `${base}/blog/${post.slug.current}`,
            lastModified: post._updatedAt
              ? new Date(post._updatedAt)
              : new Date(),
            changeFrequency: isFeatured ? "weekly" : "monthly",
            priority: isFeatured ? 0.9 : 0.7,
          });
        }
      } catch {
        // Sanity unavailable
      }
      return entries;
    }

    async function agencyEntries() {
      const entries: Array<{
        url: string;
        lastModified: Date;
        changeFrequency: string;
        priority: number;
      }> = [];
      try {
        const { getAgenciesForSitemap } = await import(
          "@/server-actions/agency.action"
        );
        const agencies = await getAgenciesForSitemap();
        for (const agency of agencies || []) {
          if (!agency?.id) continue;
          entries.push({
            url: `${base}/agencies/${agency.id}`,
            lastModified: agency.updatedAt
              ? new Date(agency.updatedAt)
              : new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
          });
        }
      } catch {
        // DB unavailable
      }
      return entries;
    }

    async function countyEntries() {
      const entries: Array<{
        url: string;
        lastModified: Date;
        changeFrequency: string;
        priority: number;
      }> = [];
      try {
        const { getAllCounties } = await import("@/server-actions/region.action");
        const res = await getAllCounties();
        const counties = res?.data || [];
        for (const county of counties || []) {
          if (!county?.name) continue;
          entries.push({
            url: `${base}/girls?county=${encodeURIComponent(county.name)}`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.7,
          });
        }
      } catch {
        // DB unavailable
      }
      return entries;
    }

    async function practiceEntries() {
      const entries: Array<{
        url: string;
        lastModified: Date;
        changeFrequency: string;
        priority: number;
      }> = [];
      try {
        const { getPracticesFromCleanedEscorts } = await import(
          "@/server-actions/cleaned-escorts.action"
        );
        const practices = await getPracticesFromCleanedEscorts();
        for (const p of practices || []) {
          if (!p?.practice) continue;
          entries.push({
            url: `${base}/girls?practice=${encodeURIComponent(p.practice)}`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.6,
          });
        }
      } catch {
        // DB unavailable
      }
      return entries;
    }

    async function comboEntries() {
      const entries: Array<{
        url: string;
        lastModified: Date;
        changeFrequency: string;
        priority: number;
      }> = [];
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

        for (const r of regions || []) {
          if (!r?.county || !r?.name) continue;
          entries.push({
            url: `${base}/girls?county=${encodeURIComponent(
              r.county
            )}&region=${encodeURIComponent(r.name)}`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.5,
          });
        }
        for (const c of counties || []) {
          if (!c?.name) continue;
          for (const p of practices || []) {
            if (!p?.practice) continue;
            entries.push({
              url: `${base}/girls?county=${encodeURIComponent(
                c.name
              )}&practice=${encodeURIComponent(p.practice)}`,
              lastModified: new Date(),
              changeFrequency: "daily",
              priority: 0.5,
            });
          }
        }
        for (const r of regions || []) {
          if (!r?.county || !r?.name) continue;
          for (const p of practices || []) {
            if (!p?.practice) continue;
            entries.push({
              url: `${base}/girls?county=${encodeURIComponent(
                r.county
              )}&region=${encodeURIComponent(r.name)}&practice=${encodeURIComponent(
                p.practice
              )}`,
              lastModified: new Date(),
              changeFrequency: "daily",
              priority: 0.4,
            });
          }
        }
      } catch {
        // DB unavailable
      }
      return entries;
    }

    const fetchers: Record<string, () => Promise<Array<{ url: string; lastModified: Date; changeFrequency: string; priority: number }>>> = {
      static: staticEntries,
      blog: blogEntries,
      agencies: agencyEntries,
      counties: countyEntries,
      practices: practiceEntries,
      combos: comboEntries,
    };

    const indexEntries: Array<{ url: string; lastModified: Date }> = [];

    for (const [section, fetcher] of Object.entries(fetchers)) {
      let entries: Array<{
        url: string;
        lastModified: Date;
        changeFrequency: string;
        priority: number;
      }> = [];
      try {
        entries = await fetcher();
      } catch (error) {
        console.error(`[sitemaps/${section}] generation failed:`, error);
        entries = [];
      }

      writeSitemap(`${section}.xml`, toSitemapXml(entries));
      indexEntries.push({
        url: `${base}/sitemaps/${section}.xml`,
        lastModified: new Date(),
      });

      console.log(`📊 Section "${section}": ${entries.length} URLs`);
    }

    writeSitemapIndex(indexEntries);
    console.log("✅ Sitemap generation complete.");
  } catch (error) {
    console.error("❌ Failed to generate sitemap:", error);
    process.exit(1);
  }
}

generateSitemap();
