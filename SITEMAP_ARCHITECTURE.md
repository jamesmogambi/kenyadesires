# Sitemap Architecture — KenyaDesires.xyz

## Overview

The sitemap is split into a **sitemap index** plus **6 per-section sitemaps** to avoid a single monolithic XML file that exceeds the sitemap protocol limit (50,000 URLs / 50 MB) and crashes the server in production.

## URL Structure

| Sitemap | URL | Content | Data Source | Count (dev) |
|---------|-----|---------|-------------|-------------|
| Index | `/sitemap.xml` | References all 6 sub-sitemaps | Static list | 6 |
| Static | `/sitemaps/static` | Homepage, about, FAQ, contact, legal, category landing pages | Hardcoded routes | 14 |
| Blog | `/sitemaps/blog` | All blog post URLs | Sanity API | 34 |
| Agencies | `/sitemaps/agencies` | All agency profile pages | MySQL (`getAgenciesForSitemap`) | 2 |
| Counties | `/sitemaps/counties` | All county-filtered girls listing pages | MySQL (`getAllCounties`) | 47 |
| Practices | `/sitemaps/practices` | All practice-filtered girls listing pages | MySQL (`getPracticesFromCleanedEscorts`) | 100+ |
| Combos | `/sitemaps/combos` | County+region, county+practice, region+practice combos | MySQL (3 joined queries) | Large (combinatorial) |

## Production URLs

Submit each individually to Google Search Console and Bing Webmaster Tools:

```
https://kenyadesires.xyz/sitemaps/static
https://kenyadesires.xyz/sitemaps/blog
https://kenyadesires.xyz/sitemaps/agencies
https://kenyadesires.xyz/sitemaps/counties
https://kenyadesires.xyz/sitemaps/practices
https://kenyadesires.xyz/sitemaps/combos
```

Or submit just the index:

```
https://kenyadesires.xyz/sitemap.xml
```

## Implementation Files

| File | Purpose |
|------|---------|
| `app/sitemap.ts` | Sitemap index Route Handler (Next.js metadata). Returns the 6 sub-sitemap references with `application/xml` content type. |
| `app/sitemaps/[section]/route.ts` | Per-section Route Handlers. Each section generates its own XML independently, capped at 45,000 URLs, with try/catch error isolation so one failing section never crashes the whole sitemap. |
| `scripts/generate-sitemap.ts` | CLI script that writes static sitemap files to `public/sitemaps/` (alternative to runtime Route Handlers). |
| `proxy.ts` | Clerk middleware config — `/sitemaps/(.*)` added to public routes so sitemaps are not blocked by authentication. |
| `.env.development` | `NEXT_PUBLIC_SITE_URL=http://localhost:3000` for local development. |

## Domain Logic (`baseUrl()`)

Both `app/sitemap.ts` and `app/sitemaps/[section]/route.ts` use the same `baseUrl()` function:

1. If `NEXT_PUBLIC_SITE_URL` is set → use it (trailing slash stripped)
2. Else if `NODE_ENV === "development"` → `http://localhost:3000`
3. Else → `https://kenyadesires.xyz`

## Production Constraints

- **`cacheComponents: true`** is enabled in `next.config.ts`, so Route Handlers cannot use `export const dynamic` or `export const revalidate`. Route Handlers are dynamic by default — no config needed.
- Each section is **error-isolated**: if MySQL or Sanity is unavailable, that section returns an empty `<urlset>` with a server console warning, rather than crashing the entire sitemap response.
- URL cap per section: **45,000** (under the 50,000 sitemap protocol limit).
- Deduplication is applied via `dedupeSitemapEntries()` in `lib/sanity/sitemap-helper.ts`.

## Local Development Testing

1. Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` in `.env.development`
2. Start dev server: `npm run dev`
3. Test endpoints:

```bash
curl http://localhost:3000/sitemap.xml        # Index (6 sections)
curl http://localhost:3000/sitemaps/static    # Static routes (no DB needed)
curl http://localhost:3000/sitemaps/blog      # Blog posts (Sanity API)
curl http://localhost:3000/sitemaps/counties  # County pages (MySQL)
curl http://localhost:3000/sitemaps/agencies  # Agency pages (MySQL)
curl http://localhost:3000/sitemaps/practices # Practice pages (MySQL)
curl http://localhost:3000/sitemaps/combos    # Combo pages (MySQL)
```

4. Check server console for log lines like `[sitemaps/counties] 47 county URLs` — if a section returns 0 URLs, check the error log above it.

## Production Deployment

1. Set `NEXT_PUBLIC_SITE_URL=https://kenyadesires.xyz` in `.env.production`
2. Run `npm run build` — verifies all Route Handlers compile
3. Deploy to production hosting
4. Submit each sitemap URL to Google Search Console and Bing Webmaster Tools
5. Run IndexNow submission after any content publish (see `scripts/indexnow-submit.ts`)

## Notes

- The sitemap index uses `<urlset>` (not `<sitemapindex>`) format with `<loc>` + `<lastmod>` per entry — this is the valid format for a sitemap index referencing other sitemap files.
- Individual section sitemaps use `<urlset>` with `<loc>`, `<lastmod>`, `<changefreq>`, `<priority>` per URL.
- Clerk authentication does **not** block sitemap routes (`/sitemaps/(.*)` is in the public route matcher).
- MySQL connection errors in local dev are expected if MySQL isn't running — DB-dependent sections (counties, agencies, practices, combos) will return empty until MySQL is available.
