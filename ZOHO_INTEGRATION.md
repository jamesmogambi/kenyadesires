# Zoho CRM Integration

This document describes the Zoho CRM integration for KenyaDesires, including the OAuth workflow,
data synchronization, and provider lead management.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [OAuth 2.0 Workflow](#oauth-20-workflow)
- [Token Management](#token-management)
- [Provider Lead Sync](#provider-lead-sync)
- [Referral Tracking](#referral-tracking)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Troubleshooting](#troubleshooting)

---

## Overview

The KenyaDesires application integrates with Zoho CRM to:

1. **Capture leads** acquired through TrafficStars ad campaigns and store them as leads in Zoho CRM.
2. **Track referrals** and award credit rewards when referred leads convert.
3. **Sync provider events** (registration, profile completion, verification, paid upgrades) as audit trail records
   in both the local MySQL database and Zoho CRM.
4. **Maintain Zoho connection state** with automatic token refresh.

## Architecture

The integration is organized across the following files:

| File | Purpose |
|------|---------|
| `lib/zoho/auth.ts` | OAuth 2.0 token exchange, storage, and refresh |
| `lib/zoho/client.ts` | Authenticated HTTP client with auto-retry on 401 |
| `lib/zoho/leads.ts` | Zoho CRM Leads API wrapper (create, update, convert, search) |
| `lib/db/provider-leads.ts` | MySQL access for `provider_leads` table |
| `lib/db/provider-events.ts` | MySQL access for `provider_events` audit table |
| `lib/db/provider-referrals.ts` | MySQL access for `provider_referrals` table |
| `lib/db/zoho-sync-queue.ts` | MySQL access for `zoho_sync_queue` retry queue |
| `lib/db/trafficstars-postbacks.ts` | MySQL access for `trafficstars_postbacks` log table |
| `lib/provider-acquisition/trafficstars.ts` | Business logic for TrafficStars postback handling |
| `app/api/zoho/authorize/route.ts` | Redirects user to Zoho OAuth consent screen |
| `app/api/zoho/callback/route.ts` | Handles OAuth callback and stores tokens |
| `app/api/zoho/test/route.ts` | Tests the Zoho CRM connection |
| `app/zoho-connect/page.tsx` | Frontend UI for managing the Zoho connection |

### Data Flow

```
TrafficStars Ad → Provider Lead → Zoho CRM Lead → Verification → Referral Rewards
     ↓              ↓                ↓              ↓               ↓
provider_leads    provider_events   zoho_sync_queue   provider_referrals  transactions
     ↓              ↓                ↓              ↓               ↓
   MySQL           MySQL           MySQL           MySQL            MySQL
```

## OAuth 2.0 Workflow

### Step 1: User Authorization

1. User navigates to `/zoho-connect` page.
2. Clicks "Connect to Zoho" which calls `GET /api/zoho/authorize`.
3. The endpoint calls `getZohoAuthorizeUrl()` which constructs a Zoho OAuth URL with:
   - `client_id`: `ZOHO_CLIENT_ID`
   - `response_type`: `code`
   - `redirect_uri`: `ZOHO_REDIRECT_URI`
   - `scope`: `ZohoCRM.leads ZohoCRM.contacts`
   - `access_type`: `offline` (enables refresh token)
   - `prompt`: `consent` (forces consent screen)
4. User is redirected to Zoho's OAuth consent screen.

### Step 2: Token Exchange

1. Zoho redirects to `GET /api/zoho/callback?code=<authorization_code>`.
2. The callback handler calls `exchangeCodeForTokens(code)`:
   - POST to `https://accounts.zoho.com/oauth/v2/token` with `grant_type: authorization_code`.
   - Receives `access_token`, `refresh_token`, and `expires_in`.
3. `storeZohoConnection(tokens)` is called:
   - Deletes any existing connection for provider='zoho' in `zoho_connections` table.
   - Inserts the new connection with tokens and expiry timestamp.
   - Uses MySQL transaction (`executeTransaction`) for atomic delete + insert.

### Step 3: Token Refresh

When the access token expires (or is within 60 seconds of expiry):

1. `getZohoAccessToken()` is called by the Zoho client.
2. Retrieves stored connection from `zoho_connections` table.
3. If expired, calls `refreshAccessToken(refreshToken)`:
   - POST to `https://accounts.zoho.com/oauth/v2/token` with `grant_type: refresh_token`.
   - Receives new `access_token` and `expires_in`.
4. `storeZohoConnection(refreshed, accountId)` persists the refreshed tokens.

### API Client (`lib/zoho/client.ts`)

The `zohoFetch()` function:

1. Obtains a valid access token via `getZohoAccessToken()`.
2. Sends the request with `Authorization: Zoho-oauthtoken <token>` header.
3. On 401 response, automatically refreshes the token and retries the request once.
4. Returns the raw `Response` for the caller to process.

## Provider Lead Sync

### Lead Creation

When a lead is captured through TrafficStars or other ad providers:

1. `createProviderLead(input)` inserts a record into the `provider_leads` MySQL table.
2. The lead is assigned a UUID `id`, with associated `click_id`, `utm_*` params, and consent data.

### Zoho CRM Lead Creation

The `createZohoLead(payload)` function in `lib/zoho/leads.ts`:

1. Calls `zohoFetch("/crm/v8/Leads", { method: "POST", body: JSON.stringify({ data: [payload] }) })`.
2. Validates response: `response.ok && result.code === 0 && result.data?.length`.
3. Returns the created Zoho lead record (with Zoho `id`).

### Lead-to-Contact Conversion

The `convertLeadToContact(leadId, opts)` function:

1. POSTs to `/crm/v8/Leads/{leadId}/actions/convert`.
2. Returns `{ contact_id, account_id, deal_id }` from the response.

### Deduplication

Before creating a lead, `findLeadByEmail(email)` searches Zoho CRM by email to prevent duplicates.

## Referral Tracking

### Referral Flow

1. When a user signs up using a referral code, a `provider_referrals` record is created with status = `pending`.
2. When the referred lead registers (`registration` event), status changes to `registered`.
3. When verified (`verification` event), status changes to `verified`.
4. When rewarded (`rewarded` event), credit rewards are issued and status updates to `rewarded`.

### Reward System

- `REWARD_CREDITS`: Number of credits awarded to the referrer.
- `REWARD_AMOUNT_KSH`: Kenyan Shillings equivalent of the reward.
- Rewards are tracked in `provider_referrals.reward_credits` and `reward_amount_ksh` columns.

## API Endpoints

### Zoho OAuth

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/zoho/authorize` | GET | Redirects to Zoho OAuth consent screen |
| `/api/zoho/callback` | GET | Handles OAuth callback, stores tokens |
| `/api/zoho/test` | GET | Tests Zoho CRM connection and API access |

### Provider Acquisition (via `lib/provider-acquisition/trafficstars.ts`)

The `fireTrafficStarsPostback()` function handles TrafficStars postback tracking:

1. **Validates event type** against `VALID_POSTBACK_EVENTS`: `registration`, `profile_complete`,
   `verification`, `paid_upgrade`.
2. **Validates click_id** exists in `provider_leads`.
3. **Deduplicates**: Checks if postback already sent for this `click_id + event` combination.
4. **Creates log entry** in `trafficstars_postbacks` table.
5. **Fires postback** to `TRAFFICSTARS_POSTBACK_URL` with retry (up to 3 attempts, exponential backoff).
6. On success: marks postback as `sent` with timestamp.
7. On failure: marks postback as `failed` with error message, increments retry count.

### Zoho Sync Queue

Failed Zoho sync operations are queued in `zoho_sync_queue` for retry:

- `enqueueSync(input)`: Inserts with status `pending` and `next_retry_at`.
- `findPendingSyncs(limit)`: Retrieves pending syncs where `next_retry_at <= NOW()`.
- `markSyncProcessing(id)`: Sets status to `processing`.
- `markSyncDone(id, zohoEntityId)`: Sets status to `done`.
- `markSyncFailed(id, error, delayMs)`: Sets status to `pending`, increments retry count,
  schedules next retry with `DATE_ADD(NOW(), INTERVAL delayMs MILLISECOND)`.
- `markSyncDead(id, error)`: Sets status to `dead` (max retries exhausted).

## Environment Variables

```bash
# Zoho CRM OAuth
ZOHO_CLIENT_ID=1000.YOUR_CLIENT_ID
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REDIRECT_URI=https://yoursite.com/api/zoho/callback
ZOHO_ACCOUNTS_URL=https://accounts.zoho.com
ZOHO_API_BASE_URL=https://www.zohoapis.com

# TrafficStars Postback
TRAFFICSTARS_POSTBACK_URL=https://postback.trafficstars.com

# MySQL (for storing Zoho connections and provider data)
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=your_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=kenyadesires-db
```

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Zoho Campaigns | `npm run zoho-campaigns` | Creates Zoho CRM campaigns from provider leads |
| Zoho Retry | `npm run zoho-retry` | Retries failed Zoho sync queue entries |
| Store Tokens (manual) | `npx tsx scripts/zoho-store-tokens.ts` | Manually stores Zoho tokens (uses Postgres — see note below) |
| Verify Tables | `npx tsx scripts/verify-tables.ts` | Verifies database tables (uses Postgres — see note below) |

> **Note**: The `scripts/zoho-store-tokens.ts` and `scripts/verify-tables.ts` scripts still reference
> PostgreSQL/Neon directly. These are standalone maintenance scripts and not used by the application's
> runtime. Production token storage is handled by `lib/zoho/auth.ts` using MySQL via `executeQuery`
> and `executeTransaction`.

## Troubleshooting

### "Zoho CRM is not connected"

- Ensure `ZOHO_CLIENT_ID` and `ZOHO_REDIRECT_URI` are set.
- Visit `/zoho-connect` and click "Connect to Zoho".
- Check the `zoho_connections` table in MySQL for stored tokens.

### "Token exchange failed"

- Verify `ZOHO_CLIENT_SECRET` matches the one registered in Zoho CRM.
- Ensure `ZOHO_REDIRECT_URI` exactly matches the redirect URI registered in Zoho CRM console.

### "Zoho API returned status 401"

- The access token may have expired. The auto-refresh mechanism should handle this.
- If the refresh token has been revoked, re-authorize via `/zoho-connect`.
- Check Zoho CRM console for OAuth token status.

### "Zoho CRM connection test failed"

- Verify MySQL database connectivity (`MYSQL_HOST`, `MYSQL_USER`, `MYSQL_DATABASE`).
- Check `zoho_connections` table exists in MySQL.
