# Listing Boost Workflow Implementation Plan

## Overview

This document outlines the comprehensive strategy for implementing a priority-based listing system where users who purchase boost packages get higher visibility in search results and category listings. The system uses the existing `AD_PACKAGES` (boost packages) defined in `lib/constants/packages.ts` with priority levels 1-4 and duration of 1-30 days.

---

## 1. Database Schema Changes

### 1.1 New Columns for `escorts` Table

```sql
ALTER TABLE escorts ADD COLUMN IF NOT EXISTS boost_until TIMESTAMPTZ;
ALTER TABLE escorts ADD COLUMN IF NOT EXISTS boost_priority INTEGER DEFAULT 0;
ALTER TABLE escorts ADD COLUMN IF NOT EXISTS active_boost_package_id TEXT;
ALTER TABLE escorts ADD COLUMN IF NOT EXISTS boost_credits_spent INTEGER DEFAULT 0;
ALTER TABLE escorts ADD COLUMN IF NOT EXISTS boost_activated_at TIMESTAMPTZ;
```

### 1.2 New Columns for `agencies` Table

```sql
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS boost_until TIMESTAMPTZ;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS boost_priority INTEGER DEFAULT 0;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS active_boost_package_id TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS boost_credits_spent INTEGER DEFAULT 0;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS boost_activated_at TIMESTAMPTZ;
```

### 1.3 Indexes for Performance

```sql
-- For boost-based sorting in listings
CREATE INDEX IF NOT EXISTS idx_escorts_boost_priority ON escorts (boost_priority DESC, boost_until DESC) WHERE boost_until > NOW();
CREATE INDEX IF NOT EXISTS idx_agencies_boost_priority ON agencies (boost_priority DESC, boost_until DESC) WHERE boost_until > NOW();

-- For expiration cleanup queries
CREATE INDEX IF NOT EXISTS idx_escorts_boost_until ON escorts (boost_until) WHERE boost_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agencies_boost_until ON agencies (boost_until) WHERE boost_until IS NOT NULL;
```

---

## 2. Core Data Model

### 2.1 Boost Package Definition (Existing)

From `lib/constants/packages.ts`:

| Package ID | Name | Priority | Duration | Credits |
|------------|------|----------|----------|---------|
| `quick_boost` | Quick Boost | 1 | 1 day | 10 |
| `weekly_boost` | Weekly Boost | 2 | 7 days | 50 |
| `premium_boost` | Premium Boost | 3 | 14 days | 90 |
| `monthly_vip` | Monthly VIP | 4 | 30 days | 150 |

**Key Properties:**
- `priority`: Integer 1-4 (higher = more visible)
- `durationDays`: How long the boost lasts
- `credits`: Cost in credits

### 2.2 Boost State in Database

| Column | Type | Description |
|--------|------|-------------|
| `boost_until` | TIMESTAMPTZ | When the current boost expires |
| `boost_priority` | INTEGER | Current boost priority level (0 = no boost) |
| `active_boost_package_id` | TEXT | ID of active package (e.g., "weekly_boost") |
| `boost_credits_spent` | INTEGER | Credits deducted for current boost |
| `boost_activated_at` | TIMESTAMPTZ | When current boost was activated |

---

## 3. Boost Activation Flow

### 3.1 Trigger Point

Boost is activated **immediately after successful payment** in the IPN handler (`app/api/pesapal/ipn/route.ts`) when:
- Payment status = `COMPLETED`
- Package type = `boost` (from `getAdPackageById`)

### 3.2 Activation Logic (Pseudo-code)

```typescript
async function activateBoost(userId: string, packageId: string, userType: 'escort' | 'agency') {
  const pkg = getAdPackageById(packageId);
  if (!pkg || pkg.type !== 'boost') throw new Error('Invalid boost package');

  const now = new Date();
  const expiresAt = new Date(now.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000);

  const table = userType === 'escort' ? 'escorts' : 'agencies';
  const idColumn = userType === 'escort' ? 'clerk_user_id' : 'owner_id';

  await executeQuery(
    `UPDATE ${table} SET 
      boost_until = $1,
      boost_priority = $2,
      active_boost_package_id = $3,
      boost_credits_spent = $4,
      boost_activated_at = $5
    WHERE ${idColumn} = $6`,
    [expiresAt, pkg.priority, pkg.id, pkg.credits, now, userId]
  );
}
```

### 3.3 Idempotency

- Use `pesapal_order_tracking_id` to prevent duplicate boost activation
- Check if order already processed before activating

---

## 4. Listing Query Modifications

### 4.1 Sorting Strategy

**New Default Sort Order:**
1. **Active Boost Priority** (DESC) - Higher priority boosts first
2. **Boost Expiry** (ASC) - Sooner expiring boosts first (fairness)
3. **Secondary Sort** - User-selected (created_at, rating, views, etc.)

### 4.2 Modified Query Logic

**For Escorts (`server-actions/cleaned-escorts.action.ts`):**

```typescript
// Add boost columns to SELECT
const LISTING_COLUMNS = [
  // ...existing columns
  "boost_until", "boost_priority", "active_boost_package_id", 
  "boost_credits_spent", "boost_activated_at"
];

// In getCleanedEscortsBase - modify ORDER BY:
const boostSort = `
  CASE 
    WHEN escorts.boost_until > NOW() THEN escorts.boost_priority 
    ELSE 0 
  END DESC,
  CASE 
    WHEN escorts.boost_until > NOW() THEN escorts.boost_until 
    ELSE '9999-12-31'::timestamptz 
  END ASC,
  ${safeSort} ${sortOrder}
`;
```

**For Agencies (`server-actions/agency.action.ts`):**

```typescript
// Same pattern in fetchAgenciesFromNeon and agency-listing.action.ts
const boostSort = `
  CASE 
    WHEN agencies.boost_until > NOW() THEN agencies.boost_priority 
    ELSE 0 
  END DESC,
  CASE 
    WHEN agencies.boost_until > NOW() THEN agencies.boost_until 
    ELSE '9999-12-31'::timestamptz 
  END ASC,
  agencies.created_at DESC
`;
```

### 4.3 Boost-Aware Filtering

Add optional filter to exclude expired boosts from priority sorting:

```typescript
// In GetEscortsParams / GetAgenciesServerParams
interface BoostFilterParams {
  includeBoostedOnly?: boolean;  // Only show currently boosted
  excludeExpiredBoosts?: boolean; // Default true - don't sort by expired boosts
}
```

---

## 5. Boost Expiration Handling

### 5.1 Strategy: Lazy Expiration (On-Read)

**Pros:** No cron jobs needed, always accurate
**Cons:** Slight overhead on each query

**Implementation:** The `CASE` statement in ORDER BY naturally handles this - expired boosts get priority 0.

### 5.2 Strategy: Scheduled Cleanup (Daily Cron)

**Pros:** Keeps data clean, enables analytics on expired boosts
**Cons:** Requires cron infrastructure

**Implementation:** Daily job to reset expired boost columns:

```sql
-- Run daily via cron
UPDATE escorts SET 
  boost_priority = 0,
  active_boost_package_id = NULL,
  boost_credits_spent = 0,
  boost_activated_at = NULL
WHERE boost_until IS NOT NULL AND boost_until <= NOW();

UPDATE agencies SET 
  boost_priority = 0,
  active_boost_package_id = NULL,
  boost_credits_spent = 0,
  boost_activated_at = NULL
WHERE boost_until IS NOT NULL AND boost_until <= NOW();
```

### 5.3 Recommendation

**Use both:**
- Lazy expiration in queries (always correct)
- Daily cleanup cron (data hygiene + analytics)

---

## 6. User-Facing Features

### 6.1 Boost Purchase UI (Already Implemented)

- `AdvertisingPriceList.tsx` shows "Purchase {packageName} Now" button
- Pesapal iframe checkout completes payment
- Credits deducted on IPN completion

### 6.2 Boost Status Display

**Profile Page / Dashboard:**
- Show active boost badge with countdown timer
- Display: "Boost Active: Weekly Boost (3 days remaining)"
- Show boost priority level indicator

**Listing Cards:**
- Visual indicator for boosted listings (badge, star, gradient border)
- Tooltip: "Boosted with Weekly Boost - Priority 2"

### 6.3 Boost Management

**Extend/Boost Page (`app/extend/page.tsx`):**
- Show current active boost (if any)
- Allow purchasing new boost (queues or replaces)
- Show boost history

---

## 7. Search & Category Pages Integration

### 7.1 Pages to Update

| Page | Component | Action |
|------|-----------|--------|
| `/girls` | Search results | Apply boost sorting |
| `/agencies` | Agency listings | Apply boost sorting |
| `/girls/[county]` | County listings | Apply boost sorting |
| `/girls/[county]/[region]` | Region listings | Apply boost sorting |
| Category pages | Filtered results | Apply boost sorting |
| Profile pages | Individual profiles | Show boost badge |

### 7.2 API Routes to Update

- `app/api/search/route.ts` - If exists
- Server actions: `getEscortsWithCleanedImages`, `fetchAgenciesFromNeon`

---

## 8. Analytics & Monitoring

### 8.1 Events to Track

```typescript
// In analytics.ts - add these events
type BoostEvent = 
  | 'boost_purchased'       // User bought boost package
  | 'boost_activated'       // Boost applied to profile
  | 'boost_expired'         // Boost expired naturally
  | 'boost_replaced'        // New boost replaced existing
  | 'boost_viewed';         // User viewed boost status

interface BoostEventData {
  userId: string;
  userType: 'escort' | 'agency';
  packageId: string;
  priority: number;
  durationDays: number;
  creditsSpent: number;
}
```

### 8.2 Key Metrics

- Boost conversion rate (views → purchases)
- Average boost duration purchased
- Revenue per boost package
- Listing position improvement after boost
- Boost renewal rate

---

## 9. Implementation Phases

### Phase 1: Database & Core Logic (Week 1)

1. **Create migration** for new boost columns + indexes
2. **Update IPN handler** to activate boost on payment completion
3. **Add boost columns** to `ESCORT_NEON_COLUMNS` and `AGENCY_NEON_COLUMNS`
4. **Update mapping functions** to include boost fields in Escort/Agency types

### Phase 2: Query Modifications (Week 1-2)

1. **Modify `getCleanedEscortsBase`** in `cleaned-escorts.action.ts`:
   - Add boost columns to SELECT
   - Update ORDER BY with boost priority logic
2. **Modify `fetchAgenciesFromNeon`** in `agency.action.ts`:
   - Same changes for agencies
3. **Update `agency-listing.action.ts`** for agency directory

### Phase 3: UI Integration (Week 2)

1. **Add boost badge** to listing components (`GirlCard`, `AgencyCard`)
2. **Update profile pages** to show boost status with countdown
3. **Enhance `app/extend/page.tsx`** with boost management UI
4. **Add boost indicator** in search results

### Phase 4: Expiration & Cron (Week 2-3)

1. **Create daily cleanup script** (`scripts/cleanup-expired-boosts.ts`)
2. **Add cron job** (Vercel Cron or external)
3. **Verify lazy expiration works** in all query paths

### Phase 5: Analytics & Polish (Week 3)

1. **Add analytics events** for boost lifecycle
2. **Create admin dashboard** for boost metrics (optional)
3. **A/B test** boost positioning algorithms
4. **Documentation** for users (FAQ already has content)

---

## 10. Edge Cases & Considerations

### 10.1 Multiple Boost Purchases

**Scenario:** User buys Weekly Boost, then 2 days later buys Premium Boost

**Options:**
- **Queue:** New boost starts after current expires
- **Replace:** New boost immediately replaces current (refund/prorate?)
- **Stack:** Not recommended - complex priority

**Recommendation:** **Replace with proration**
- Calculate remaining value of current boost
- Apply as credit toward new boost
- Immediately activate new higher-priority boost

### 10.2 Boost During Existing Boost

```typescript
async function handleNewBoostDuringActive(userId, newPackageId, userType) {
  const current = await getCurrentBoost(userId, userType);
  const newPkg = getAdPackageById(newPackageId);
  
  if (!current || current.priority >= newPkg.priority) {
    // Simple case: no current boost OR new is same/lower priority
    return activateBoost(userId, newPackageId, userType);
  }
  
  // Prorate: calculate unused credits from current boost
  const daysUsed = (Date.now() - current.activatedAt) / (1000 * 60 * 60 * 24);
  const daysRemaining = current.durationDays - daysUsed;
  const proratedCredits = Math.floor(current.creditsSpent * (daysRemaining / current.durationDays));
  
  // Activate new boost with credit adjustment
  const adjustedCredits = newPkg.credits - proratedCredits;
  await deductCredits(userId, Math.max(0, adjustedCredits), userType);
  return activateBoost(userId, newPackageId, userType);
}
```

### 10.3 Fairness & Anti-Gaming

- **Daily reshuffle:** As per FAQ, positions recalculated daily
- **Per-category/county:** Boost applies within category+county, not globally
- **Max boost duration:** 30 days (monthly_vip) prevents permanent top placement
- **Credit cost:** Higher priority = more credits = natural limit

### 10.4 Inactive/Unverified Profiles

- Boost should **not** apply if `is_active = FALSE` or `is_verified = FALSE`
- Query should filter these out before boost sorting
- IPN should verify profile is active before activating boost

---

## 11. Files to Modify

### Database
- `database/migrations/XXX_boost_columns.sql` (new)

### Server Actions
- `server-actions/cleaned-escorts.action.ts` - Escort listing queries
- `server-actions/agency.action.ts` - Agency listing queries  
- `server-actions/agency-listing.action.ts` - Agency directory queries
- `server-actions/escort.action.ts` - Add boost fields to types/mappers

### API Routes
- `app/api/pesapal/ipn/route.ts` - Activate boost on payment

### Components
- `components/GirlCard.tsx` - Boost badge
- `components/AgencyCard.tsx` - Boost badge
- `app/extend/page.tsx` - Boost management UI
- `app/girl/[slug]/page.tsx` - Profile boost status

### Types
- `server-actions/escort.action.ts` - Extend `Escort` interface
- `server-actions/agency.action.ts` - Extend `Agency` interface

### Scripts
- `scripts/cleanup-expired-boosts.ts` (new)
- `package.json` - Add cron script

---

## 12. Testing Strategy

### 12.1 Unit Tests

- Boost activation logic (IPN handler)
- Proration calculation
- Expiration detection
- Query sorting with various boost states

### 12.2 Integration Tests

- Full payment → boost activation → listing position flow
- Multiple boost purchases (replace/queue)
- Expired boost cleanup

### 12.3 Manual Testing Checklist

- [ ] Purchase Quick Boost → appears at top of category for 1 day
- [ ] Purchase Monthly VIP → appears at top for 30 days
- [ ] Buy Weekly Boost, then Premium Boost → proration works
- [ ] Expired boost → returns to normal position
- [ ] Inactive profile with boost → not shown in listings
- [ ] Unverified profile with boost → not shown in listings
- [ ] Boost badge displays correctly on cards and profile

---

## 13. Rollout Plan

1. **Deploy migration** to staging
2. **Test with sandbox Pesapal** payments
3. **Verify listing order** changes on staging
4. **Deploy to production** with feature flag
5. **Enable for 10% users** → monitor → 100%
6. **Monitor metrics** for 2 weeks post-launch

---

## 14. Future Enhancements

- **Bid-based boosting:** Real-time auction for top spots
- **Geo-targeted boosts:** Boost only in specific counties
- **Category-specific boosts:** Different priorities per category
- **Boost scheduling:** Purchase boost for future date
- **Boost analytics dashboard:** Provider-facing performance metrics
- **Referral boost rewards:** Free boost days for referrals

---

## Appendix: Current Package Definitions

```typescript
// lib/constants/packages.ts
export const AD_PACKAGES = [
  {
    id: "quick_boost",
    name: "Quick Boost",
    description: "Short-term visibility boost",
    credits: 10,
    type: "boost",
    durationDays: 1,
    priority: 1,
  },
  {
    id: "weekly_boost",
    name: "Weekly Boost",
    description: "Standard featured listing",
    credits: 50,
    type: "boost",
    durationDays: 7,
    priority: 2,
    popular: true,
  },
  {
    id: "premium_boost",
    name: "Premium Boost",
    description: "Higher visibility and longer exposure",
    credits: 90,
    type: "boost",
    durationDays: 14,
    priority: 3,
    recommended: true,
  },
  {
    id: "monthly_vip",
    name: "Monthly VIP",
    description: "Highest standard visibility",
    credits: 150,
    type: "boost",
    durationDays: 30,
    priority: 4,
    bestValue: true,
  },
] as const;
```