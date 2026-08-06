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
 * Sanitize URL to ensure it's valid
 */
export function sanitizeUrl(baseUrl: string, path: string): string {
  // Remove duplicate slashes
  const cleanPath = path.replace(/^\/+/, "");
  const url = `${baseUrl}/${cleanPath}`;
  return url.replace(/&/g, "&amp;");
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
