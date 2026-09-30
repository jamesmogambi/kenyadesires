import { SitemapUrl } from "./indexnow";

const SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9";

export interface SitemapFetchResult {
  urls: string[];
  errors: string[];
}

async function fetchXml(url: string): Promise<string | null> {
  // Node's undici fetch gives up on the TCP connect after 10s, and
  // /sitemap.xml is generated per request and regularly takes ~18s end to
  // end, so the default fetch threw "Connect Timeout Error" and the submission
  // silently found 0 URLs. Budget well past the slow path and retry.
  const TIMEOUT_MS = 90_000;
  const ATTEMPTS = 3;

  let lastError = "unknown error";

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "KenyaDesires IndexNow Bot",
          Accept: "application/xml, text/xml",
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        next: { revalidate: 0 },
      });

      if (res.ok) {
        return await res.text();
      }
      lastError = `HTTP ${res.status} ${res.statusText}`;
    } catch (err: any) {
      lastError = err?.cause?.code
        ? `${err?.cause?.code} (${err?.cause?.message || err?.message})`
        : err?.message || String(err);
    }

    if (attempt < ATTEMPTS) {
      console.warn(
        `[IndexNow] Attempt ${attempt}/${ATTEMPTS} failed for ${url}: ${lastError}. Retrying...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  console.warn(
    `[IndexNow] Giving up on ${url} after ${ATTEMPTS} attempts: ${lastError}`,
  );
  return null;
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
    return {
      urls: [],
      errors: [`Failed to fetch sitemap: ${sitemapUrl} (see warnings above for the cause)`],
    };
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