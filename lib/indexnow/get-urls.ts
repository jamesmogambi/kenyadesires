import { SitemapUrl } from "./indexnow";

const SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9";

export interface SitemapFetchResult {
  urls: string[];
  errors: string[];
}

async function fetchXml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "KenyaDesires IndexNow Bot",
        Accept: "application/xml, text/xml",
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return null;
    }
    return await res.text();
  } catch {
    return null;
  }
}

function parseSitemap(xml: string): string[] {
  const urls: string[] = [];

  const urlMatches = xml.match(/<url>[\s\S]*?<\/url>/g) || [];
  for (const urlBlock of urlMatches) {
    const locMatch = urlBlock.match(/<loc>([^<]+)<\/loc>/);
    if (locMatch && locMatch[1]) {
      urls.push(locMatch[1].trim());
    }
  }

  return urls;
}

function parseSitemapIndex(xml: string): string[] {
  const sitemapUrls: string[] = [];

  const sitemapMatches = xml.match(/<sitemap>[\s\S]*?<\/sitemap>/g) || [];
  for (const smBlock of sitemapMatches) {
    const locMatch = smBlock.match(/<loc>([^<]+)<\/loc>/);
    if (locMatch && locMatch[1]) {
      sitemapUrls.push(locMatch[1].trim());
    }
  }

  return sitemapUrls;
}

export async function getUrlsFromSitemap(baseUrl: string): Promise<SitemapFetchResult> {
  const sitemapUrl = `${baseUrl.replace(/\/$/, "")}/sitemap.xml`;
  const errors: string[] = [];
  const allUrls: string[] = [];

  const xml = await fetchXml(sitemapUrl);
  if (!xml) {
    return { urls: [], errors: [`Failed to fetch sitemap: ${sitemapUrl}`] };
  }

  const isSitemapIndex = xml.includes("<sitemapindex") || xml.includes("<sitemapindex ");

  if (isSitemapIndex) {
    const childSitemaps = parseSitemapIndex(xml);
    console.log(`[IndexNow] Found sitemap index with ${childSitemaps.length} child sitemaps`);

    for (const childUrl of childSitemaps) {
      const childXml = await fetchXml(childUrl);
      if (childXml) {
        const urls = parseSitemap(childXml);
        allUrls.push(...urls);
      } else {
        errors.push(`Failed to fetch child sitemap: ${childUrl}`);
      }
    }
  } else {
    const urls = parseSitemap(xml);
    allUrls.push(...urls);
  }

  return { urls: allUrls, errors };
}

export async function getAllIndexNowUrls(baseUrl?: string): Promise<SitemapFetchResult> {
  const url = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.xyz";
  return getUrlsFromSitemap(url);
}