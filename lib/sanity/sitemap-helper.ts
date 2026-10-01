import { MetadataRoute } from "next";

/**
 * Convert Firebase timestamp to Date
 */
export function firebaseTimestampToDate(timestamp: any): Date {
  if (!timestamp) return new Date();

  if (typeof timestamp === "object" && timestamp.toDate) {
    return timestamp.toDate();
  }

  if (timestamp instanceof Date) {
    return timestamp;
  }

  if (typeof timestamp === "string") {
    return new Date(timestamp);
  }

  if (typeof timestamp === "number") {
    return new Date(timestamp);
  }

  return new Date();
}

/**
 * Escape the five XML predefined entities.
 *
 * This is required because Next.js does NOT escape. It serialises every entry
 * with a raw template interpolation:
 *
 *   content += `<loc>${item.url}</loc>\n`;
 *
 * (next/dist/build/webpack/loaders/metadata/resolve-route-data.js). An earlier
 * version of this file assumed Next handled the escaping and therefore kept the
 * `&` literal. That assumption is wrong, and it produced a sitemap that no XML
 * parser could read.
 *
 * The `&` is not hypothetical: `buildListingHref` joins filter parameters with
 * `URLSearchParams`, so every county+region combo URL contains one, e.g.
 * `https://kenyadesires.xyz/girls?county=nairobi&region=westlands`. A bare `&`
 * starts an entity reference, so the parser fails with `EntityRef: expecting
 * ';'` and — because a consumer stops at the first error — the entire file is
 * discarded, taking every valid URL in it with it.
 *
 * This escapes for XML *source*, not for a URL. A parser decodes `&amp;` back
 * to `&`, so the `<loc>` value a crawler actually reads is the intended URL.
 * `&` must therefore be replaced first, or it would double-escape the
 * ampersands introduced by the other four replacements.
 */
export function escapeXmlEntities(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Join a base URL and a path into a sitemap entry URL.
 *
 * Returns the URL unescaped. Escaping is applied once, at the very end, by
 * `escapeXmlEntities` — see the note there on why validation and dedupe must
 * see the real URL rather than the XML-escaped one.
 */
export function sanitizeUrl(baseUrl: string, path: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  return `${cleanBase}/${cleanPath}`;
}

/**
 * Drop duplicate `<loc>` entries, keeping the first (highest priority) one.
 *
 * Filter vocabularies overlap: `?county=nairobi` and `?county=nairobi&region=`
 * style collisions, or a county and a region that slug to the same string, would
 * otherwise emit the same URL twice and waste crawl budget.
 */
export function dedupeSitemapEntries(
  entries: MetadataRoute.Sitemap,
): MetadataRoute.Sitemap {
  const seen = new Set<string>();

  return entries.filter((entry) => {
    // Compare without the scheme so an http/https mix is treated as one URL.
    const key = entry.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Create sitemap entry with validation
 */
export function createSitemapEntry(
  url: string,
  lastModified: Date,
  changeFrequency:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never",
  priority: number = 0.5,
): { url: string; lastModified: Date; changeFrequency: any; priority: number } {
  // Validate URL
  if (!url || url === "") {
    throw new Error("Invalid URL for sitemap entry");
  }

  // Validate priority
  const validPriority = Math.min(1, Math.max(0, priority));

  return {
    url,
    lastModified,
    changeFrequency,
    priority: validPriority,
  };
}

/**
 * Group sitemap entries for better organization
 */
export function groupSitemapEntries(
  entries: MetadataRoute.Sitemap,
  maxEntries: number = 50000,
): MetadataRoute.Sitemap[] {
  if (entries.length <= maxEntries) {
    return [entries];
  }

  const groups: MetadataRoute.Sitemap[] = [];
  for (let i = 0; i < entries.length; i += maxEntries) {
    groups.push(entries.slice(i, i + maxEntries));
  }

  return groups;
}

/**
 * Log sitemap statistics
 */
export function logSitemapStats(
  entries: MetadataRoute.Sitemap,
  categories: { [key: string]: number },
): void {
  const totalSize = JSON.stringify(entries).length / 1024;

  console.log(`
📊 KENYADESIRES SITEMAP STATISTICS:
   ─────────────────────────────────
   📄 Total URLs: ${entries.length}
   📝 Blog Posts: ${categories.blog || 0}
   👤 Escort Profiles: ${categories.escorts || 0}
   🏢 Agencies: ${categories.agencies || 0}
   📄 Static Pages: ${categories.static || 0}
   💾 File Size: ${totalSize.toFixed(2)} KB
   🔄 Last Updated: ${new Date().toISOString()}
  `);
}

/**
 * Validate sitemap entries
 */
export function validateSitemapEntries(entries: MetadataRoute.Sitemap): {
  valid: MetadataRoute.Sitemap;
  invalid: MetadataRoute.Sitemap;
} {
  const valid: MetadataRoute.Sitemap = [];
  const invalid: MetadataRoute.Sitemap = [];

  for (const entry of entries) {
    try {
      // Check if URL is valid
      new URL(entry.url);
      valid.push(entry);
    } catch {
      invalid.push(entry);
    }
  }

  return { valid, invalid };
}

/**
 * Get priority based on content type
 */
export function getPriorityForContentType(
  type: "home" | "blog" | "escort" | "agency" | "static" | "category",
): number {
  const priorities = {
    home: 1.0,
    static: 0.8,
    blog: 0.7,
    escort: 0.9,
    agency: 0.6,
    category: 0.5,
  };

  return priorities[type] || 0.5;
}

/**
 * Get change frequency based on content type
 */
export function getChangeFrequencyForContentType(
  type: "home" | "blog" | "escort" | "agency" | "static" | "category",
): "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never" {
  const frequencies: Record<
    "home" | "blog" | "escort" | "agency" | "static" | "category",
    "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  > = {
    home: "daily",
    static: "monthly",
    blog: "weekly",
    escort: "daily",
    agency: "weekly",
    category: "monthly",
  };

  return frequencies[type] || "weekly";
}
