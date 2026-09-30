# IndexNow Integration for KenyaDesires

## Overview

This integration enables bulk URL submission to IndexNow (Bing, Yandex, Naver, Seznam) via:

- **Manual trigger**: `npm run indexnow`
- **Post-deploy hook**: Runs after successful build
- **Admin API**: `POST /api/indexnow/submit` (protected)

## Quick Start

### 1. Verify Key File

```bash
curl https://kenyadesires.xyz/325f14a44fd640ac9ab3a818858a5ccf.txt
```

Should return exactly: `325f14a44fd640ac9ab3a818858a5ccf`

### 2. Verify Endpoint

```bash
curl https://kenyadesires.xyz/api/indexnow/verify
```

Expected response:
```json
{
  "keyFileOk": true,
  "sitemapOk": true,
  "urlCount": 642
}
```

### 3. Manual Submission

```bash
# Requires NODE_ENV=production
NODE_ENV=production npm run indexnow
```

Or with admin token:
```bash
curl -X POST https://kenyadesires.xyz/api/indexnow/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"source": "sitemap"}'
```

### 4. Post-Deploy Hook

Add to your deployment pipeline (e.g., GitHub Actions, Vercel):

```yaml
- name: Submit to IndexNow
  if: success()
  run: |
    NODE_ENV=production npm run indexnow
  env:
    NEXT_PUBLIC_SITE_URL: https://kenyadesires.xyz
```

## Configuration

### Environment Variables (.env.local)

```bash
INDEXNOW_KEY=325f14a44fd640ac9ab3a818858a5ccf
INDEXNOW_HOST=kenyadesires.xyz
INDEXNOW_ENDPOINT=https://api.indexnow.org/indexnow
INDEXNOW_ADMIN_TOKEN=your_secure_random_token
NEXT_PUBLIC_SITE_URL=https://kenyadesires.xyz
```

### Key File

- Location: `public/325f14a44fd640ac9ab3a818858a5ccf.txt`
- Must contain exactly the key string (no newline, no whitespace)
- **Do not rename** - the filename IS the key identifier

## Architecture

### Files

| File | Purpose |
|------|---------|
| `lib/indexnow.ts` | Core bulk submission client |
| `lib/indexnow/get-urls.ts` | Sitemap URL fetcher |
| `app/api/indexnow/submit/route.ts` | Admin API endpoint |
| `app/api/indexnow/verify/route.ts` | Verification endpoint |
| `scripts/indexnow-submit.ts` | Manual submission script |

### Bulk Submission Logic

1. Fetches all URLs from `/sitemap.xml` (handles sitemap indexes)
2. Deduplicates and filters to `kenyadesires.xyz` host only
3. Batches into groups of 500 URLs
4. Sequential POST to `https://api.indexnow.org/indexnow` with 200ms delay
5. Returns aggregate result with per-batch statuses

### Rate Limiting

- Maximum 1 submission per hour (enforced by script checking `.next/cache/indexnow-last-run.json`)
- Override with `?force=true` query param
- 200ms delay between batches to respect IndexNow rate limits

## Troubleshooting

### 403 - Key File Not Found / Invalid

1. Verify key file at `https://kenyadesires.xyz/325f14a44fd640ac9ab3a818858a5ccf.txt`
2. Check file contents match `INDEXNOW_KEY` exactly
3. Ensure file is in `public/` not project root

### 422 - URL Host Mismatch

- All URLs must be on `kenyadesires.xyz` (or `www.kenyadesires.xyz` if that's canonical)
- Sitemap must not contain external URLs
- Check `get-urls.ts` filtering logic

### 429 - Rate Limited

- Wait before retrying
- Reduce batch size (modify `INDEXNOW_BATCH_SIZE` in `lib/indexnow.ts`)
- Increase delay between batches (`INDEXNOW_DELAY_MS`)

### No URLs Submitted in Dev/Staging

- Submission is **disabled** when `NODE_ENV !== 'production'`
- Check `lib/indexnow.ts` line 15-22
- For testing, temporarily change the check or use production build

## Bing Webmaster Tools Verification

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters/)
2. Select your site: `kenyadesires.xyz`
3. Navigate to **IndexNow** → **URL Submission**
4. After running submission, check "URLs submitted" count
5. Allow 24 hours for full reporting

## Adding to Content Update Flow

When you publish new content:

1. **Automatic** (recommended): Post-deploy hook runs after every successful build
2. **Manual**: Run `npm run indexnow` after deploying
3. **Webhook** (future): Add Sanity/MySQL webhook to trigger submission on content change

## Testing Checklist

- [ ] Key file returns exact key at `https://kenyadesires.xyz/325f14a44fd640ac9ab3a818858a5ccf.txt`
- [ ] `/api/indexnow/verify` returns `keyFileOk: true, sitemapOk: true`
- [ ] `npm run indexnow` returns `success: true, submitted: >0`
- [ ] Bing Webmaster Tools shows increased "URLs submitted" count
- [ ] No submission when `NODE_ENV=development`
- [ ] Second run within 1 hour is rate limited

## Common Issues

| Issue | Fix |
|-------|-----|
| Key file has newline | `echo -n "key" > public/key.txt` |
| Wrong host in URLs | Check sitemap generation uses correct `NEXT_PUBLIC_SITE_URL` |
| Empty sitemap | Debug `app/sitemap.ts` - check Sanity/MySQL queries |
| Admin token invalid | Generate new token: `openssl rand -hex 32` |

## Files Reference

### `lib/indexnow.ts`
Core client with batching, deduplication, host filtering, rate limiting.

### `lib/indexnow/get-urls.ts`
Fetches and parses sitemap.xml, handles nested sitemap indexes.

### `app/api/indexnow/submit/route.ts`
POST endpoint requiring `Authorization: Bearer <INDEXNOW_ADMIN_TOKEN>`.
Accepts `{ urls: string[] }` or `{ source: "sitemap" }`.

### `app/api/indexnow/verify/route.ts`
GET endpoint for health checks. Returns key file status, sitemap status, URL count.

### `scripts/indexnow-submit.ts`
CLI script for manual runs. Exits with code 0 on success, 1 on failure.

### `.env.example`
Template with all required variables.

### `package.json`
Added `"indexnow": "tsx scripts/indexnow-submit.ts"` script.