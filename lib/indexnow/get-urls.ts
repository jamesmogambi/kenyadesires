import { get as httpGet } from "node:http";
import { get as httpsGet } from "node:https";

const SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9";

export interface SitemapFetchResult {
  urls: string[];
  errors: string[];
}

/**
 * Fetched with node:http(s) rather than global fetch on purpose: undici
 * (behind fetch) aborts the TCP connect after a hard 10s, and DNS for this
 * host regularly takes ~15s, so every submission failed with
 * "Connect Timeout Error" and reported 0 URLs. node:https has no such cap;
 * the `timeout` option below is the only bound we apply.
 */
async function fetchXml(url: string): Promise<string | null> {
  const TIMEOUT_MS = 90_000;
  const ATTEMPTS = 3;

  let lastError = "unknown error";

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const { statusCode, body } = await fetchText(url, TIMEOUT_MS);

      if (statusCode >= 200 && statusCode < 300) {
        return body;
      }
      lastError = `HTTP ${statusCode}`;
    } catch (err: any) {
      lastError = err?.code
        ? `${err.code} (${err.message})`
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

function fetchText(
  url: string,
  timeoutMs: number,
): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith("https:");
    const request = (isHttps ? httpsGet : httpGet)(
      url,
      {
        headers: {
          "User-Agent": "KenyaDesires IndexNow Bot",
          Accept: "application/xml, text/xml",
        },
        timeout: timeoutMs,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        res.on("end", () =>
          resolve({
            statusCode: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf8"),
          }),
        );
        res.on("error", reject);
      },
    );

    request.on("timeout", () => {
      request.destroy(
        Object.assign(new Error(`No response within ${timeoutMs}ms`), {
          code: "ETIMEDOUT",
        }),
      );
    });
    request.on("error", reject);
  });
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