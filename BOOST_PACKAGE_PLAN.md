# Boost Listing Package Plan - Purchase Rules & Guardrails

## Executive Summary

This document defines the purchase rules, guardrails, and business logic for boost packages to prevent abuse while maintaining fair competition. Prices remain unchanged for escorts; agencies get volume-based pricing.

---

## Current Package Definitions (Unchanged Prices)

| Package ID | Name | Priority | Duration | Credits | KSH |
|------------|------|----------|----------|---------|-----|
| `quick_boost` | Quick Boost | 1 | 1 day | 10 | 100 |
| `weekly_boost` | Weekly Boost | 2 | 7 days | 50 | 500 |
| `premium_boost` | Premium Boost | 3 | 14 days | 90 | 900 |
| `monthly_vip` | Monthly VIP | 4 | 30 days | 150 | 1,500 |

---

## Core Guardrails

### 1. Single Active Boost Per Profile

**Rule:** A profile (escort or agency) can have **only ONE active boost at a time**.

```typescript
// Before activating new boost:
const existingBoost = await getActiveBoost(userId, userType);
if (existingBoost) {
  // Handle based on priority comparison (see Section 3)
}
```

**Enforcement:**
- Database: `boost_until` + `active_boost_package_id` columns
- Application: Check before purchase, reject or offer upgrade path
- IPN: Verify no active boost before activating

### 2. No Stacking/Combining

**Rule:** Multiple boost packages **cannot** be active simultaneously.

| Scenario | Allowed? | Action |
|----------|----------|--------|
| Quick Boost + Weekly Boost | ❌ No | Replace with higher priority |
| Weekly Boost + Premium Boost | ❌ No | Replace with proration |
| Two Weekly Boosts | ❌ No | Extend duration (see Section 4) |
| Monthly VIP + any other | ❌ No | Block - already max priority |

### 3. Priority-Based Replacement Logic

When user purchases new boost while one is active:

```typescript
function handleBoostPurchase(userId, newPackageId, userType) {
  const current = getActiveBoost(userId, userType);
  const newPkg = getAdPackageById(newPackageId);
  
  if (!current) {
    return activateBoost(userId, newPackageId, userType); // Simple case
  }
  
  // Same package = extend duration
  if (current.packageId === newPackageId) {
    return extendBoost(userId, newPkg.durationDays, userType);
  }
  
  // Higher priority = replace with proration
  if (newPkg.priority > current.priority) {
    return replaceWithProration(userId, current, newPkg, userType);
  }
  
  // Lower/equal priority = block
  return { success: false, error: "You already have a higher or equal priority boost active" };
}
```

**Priority Hierarchy:** `monthly_vip (4) > premium_boost (3) > weekly_boost (2) > quick_boost (1)`

### 4. Same Package = Duration Extension (Not New Purchase)

**Rule:** Buying the same package **extends** the current boost rather than creating a new one.

```typescript
async function extendBoost(userId, additionalDays, userType) {
  const table = userType === 'escort' ? 'escorts' : 'agencies';
  const idCol = userType === 'escort' ? 'clerk_user_id' : 'owner_id';
  
  await executeQuery(
    `UPDATE ${table} SET 
      boost_until = boost_until + INTERVAL '${additionalDays} days',
      boost_credits_spent = boost_credits_spent + $1,
      updated_at = NOW()
    WHERE ${idCol} = $2 AND boost_until > NOW()`,
    [newPkg.credits, userId]
  );
}
```

**Cost:** Full package price each time (no discount for extension)

### 5. Cooldown Period After Expiration

**Rule:** 1-hour cooldown after boost expires before new boost can be purchased.

**Purpose:** Prevent rapid cycling, give fair exposure to others.

```typescript
const COOLDOWN_HOURS = 1;
const lastBoost = await getLastBoostEndTime(userId, userType);
if (lastBoost && (Date.now() - lastBoost) < COOLDOWN_HOURS * 60 * 60 * 1000) {
  return { 
    success: false, 
    error: `Please wait ${COOLDOWN_HOURS} hour(s) after boost expires before purchasing a new one` 
  };
}
```

---

## Purchase Flow with Guardrails

### UI Flow (AdvertisingPriceList.tsx)

```
User selects package
       ↓
Check: Has active boost?
       ↓ No → Proceed to payment (credits/Pesapal)
       ↓ Yes
       ↓
Check: Same package?
       ↓ Yes → Show "Extend for X days" (full price)
       ↓ No
       ↓
Check: Higher priority?
       ↓ Yes → Show "Upgrade to [Package] - prorated credit applied"
       ↓ No → Block with message: "You already have [Current] active (Priority X). 
                                 Complete it first or upgrade to higher tier."
```

### Server Action: `purchaseAdPackage` (Updated)

```typescript
export async function purchaseAdPackage(packageId: string) {
  const { userId } = await auth();
  const adPackage = getAdPackageById(packageId);
  
  // 1. Get user profile
  const user = await getUserProfileWithBoost(userId);
  
  // 2. Check cooldown
  if (user.lastBoostEndedAt && isInCooldown(user.lastBoostEndedAt)) {
    return { success: false, error: "Cooldown period active" };
  }
  
  // 3. Check active boost
  if (user.boostUntil && user.boostUntil > new Date()) {
    const currentPkg = getAdPackageById(user.activeBoostPackageId);
    
    if (currentPkg.id === packageId) {
      // Extend same package
      return extendBoost(userId, adPackage.durationDays, user.userType);
    }
    
    if (adPackage.priority > currentPkg.priority) {
      // Upgrade with proration
      return upgradeBoost(userId, currentPkg, adPackage, user.userType);
    }
    
    // Block lower/equal priority
    return { 
      success: false, 
      error: `You already have ${currentPkg.name} active. Complete it first or choose a higher tier.` 
    };
  }
  
  // 4. No active boost - normal purchase
  return processNewBoostPurchase(userId, adPackage, user);
}
```

---

## Proration Logic for Upgrades

When upgrading to higher priority:

```typescript
function calculateProration(current: BoostState, newPkg: AdPackage) {
  const now = new Date();
  const end = new Date(current.boostUntil);
  const totalMs = end.getTime() - current.activatedAt.getTime();
  const usedMs = now.getTime() - current.activatedAt.getTime();
  const remainingRatio = Math.max(0, (totalMs - usedMs) / totalMs);
  
  const proratedCredits = Math.floor(current.creditsSpent * remainingRatio);
  const newCost = newPkg.credits - proratedCredits;
  
  return {
    proratedCredits,
    newCost: Math.max(0, newCost),
    daysRemaining: Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  };
}
```

**Example:** User has Weekly Boost (50 credits, 7 days, Priority 2), 3 days used. Wants Premium Boost (90 credits, 14 days, Priority 3).
- Remaining: 4/7 days = 57%
- Prorated credit: 50 × 0.57 = 28 credits
- New cost: 90 - 28 = 62 credits (instead of 90)

---

## Agency Pricing Recommendations

### Volume Discount Tiers

| Agency Profiles | Discount | Effective Credit Price |
|-----------------|----------|------------------------|
| 1-5 profiles | 0% | 10 KSH/credit |
| 6-15 profiles | 10% | 9 KSH/credit |
| 16-30 profiles | 15% | 8.5 KSH/credit |
| 31+ profiles | 20% | 8 KSH/credit |

### Agency Package Pricing (Credits Remain Same, KSH Changes)

| Package | Standard KSH | 1-5 Profiles | 6-15 Profiles (10%) | 16-30 Profiles (15%) | 31+ Profiles (20%) |
|---------|-------------|--------------|---------------------|----------------------|-------------------|
| Quick Boost | 100 | 100 | 90 | 85 | 80 |
| Weekly Boost | 500 | 500 | 450 | 425 | 400 |
| Premium Boost | 900 | 900 | 810 | 765 | 720 |
| Monthly VIP | 1,500 | 1,500 | 1,350 | 1,275 | 1,200 |

### Implementation

```typescript
function getAgencyDiscount(agencyId: string): number {
  // Count active profiles for this agency
  const profileCount = await getActiveEscortCount(agencyId);
  
  if (profileCount >= 31) return 0.20;
  if (profileCount >= 16) return 0.15;
  if (profileCount >= 6) return 0.10;
  return 0;
}

function getPackagePrice(packageId: string, userType: 'escort' | 'agency', agencyId?: string): number {
  const pkg = getAdPackageById(packageId);
  const basePrice = pkg.credits * 10; // 10 KSH/credit
  
  if (userType === 'escort') return basePrice;
  
  const discount = agencyId ? getAgencyDiscount(agencyId) : 0;
  return Math.round(basePrice * (1 - discount));
}
```

---

## Database Schema Additions

```sql
-- Boost tracking (already in LISTING_BOOST_WORKFLOW.md)
ALTER TABLE escorts ADD COLUMN IF NOT EXISTS boost_until TIMESTAMPTZ;
ALTER TABLE escorts ADD COLUMN IF NOT EXISTS boost_priority INTEGER DEFAULT 0;
ALTER TABLE escorts ADD COLUMN IF NOT EXISTS active_boost_package_id TEXT;
ALTER TABLE escorts ADD COLUMN IF NOT EXISTS boost_credits_spent INTEGER DEFAULT 0;
ALTER TABLE escorts ADD COLUMN IF NOT EXISTS boost_activated_at TIMESTAMPTZ;
ALTER TABLE escorts ADD COLUMN IF NOT EXISTS last_boost_ended_at TIMESTAMPTZ;

ALTER TABLE agencies ADD COLUMN IF NOT EXISTS boost_until TIMESTAMPTZ;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS boost_priority INTEGER DEFAULT 0;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS active_boost_package_id TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS boost_credits_spent INTEGER DEFAULT 0;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS boost_activated_at TIMESTAMPTZ;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS last_boost_ended_at TIMESTAMPTZ;

-- Boost history for analytics
CREATE TABLE IF NOT EXISTS boost_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_type TEXT NOT NULL, -- 'escort' | 'agency'
  profile_id TEXT NOT NULL,
  package_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  priority INTEGER NOT NULL,
  duration_days INTEGER NOT NULL,
  credits_spent INTEGER NOT NULL,
  prorated_credits INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  end_reason TEXT, -- 'expired' | 'replaced' | 'extended' | 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_boost_history_user ON boost_history (user_id, user_type);
CREATE INDEX idx_boost_history_profile ON boost_history (profile_id);
CREATE INDEX idx_boost_history_active ON boost_history (ended_at) WHERE ended_at IS NULL;
```

---

## API Endpoints Needed

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/boost/check-eligibility` | GET | Check if user can purchase specific package |
| `/api/boost/active` | GET | Get current active boost details |
| `/api/boost/history` | GET | Get boost purchase history |
| `/api/boost/extend` | POST | Extend current boost (same package) |
| `/api/boost/upgrade` | POST | Upgrade to higher priority with proration |

---

## Frontend Validation (AdvertisingPriceList.tsx)

```typescript
// Disable/block packages based on current state
const getPackageStatus = (pkg: AdPackage): 'available' | 'extend' | 'upgrade' | 'blocked' => {
  if (!activeBoost) return 'available';
  
  if (activeBoost.packageId === pkg.id) return 'extend';
  if (pkg.priority > activeBoost.priority) return 'upgrade';
  return 'blocked';
};

// Render different UI per status
{status === 'extend' && <Button>Extend for ${pkg.durationDays} days (${pkg.credits} credits)</Button>}
{status === 'upgrade' && <Button>Upgrade to ${pkg.name} (${proratedCost} credits after proration)</Button>}
{status === 'blocked' && <Button disabled>Complete ${activeBoost.name} first</Button>}
```

---

## Error Messages

| Error Code | Message | When |
|------------|---------|------|
| `BOOST_ACTIVE_SAME` | "You already have this boost active. Extend for {days} more days?" | Same package repurchase |
| `BOOST_ACTIVE_HIGHER` | "You have {current} active (Priority {p}). Complete it or upgrade to a higher tier." | Lower/equal priority purchase |
| `BOOST_COOLDOWN` | "Please wait 1 hour after your boost expires before purchasing a new one." | Cooldown period |
| `BOOST_INSUFFICIENT_CREDITS` | "You need {needed} more credits. Current: {current}" | Not enough credits |
| `BOOST_UPGRADE_PRORATED` | "Upgrade to {new} for {proratedCost} credits (${proratedCredits} credited from current boost)." | Higher priority upgrade |

---

## Analytics Events

```typescript
type BoostEvent = 
  | 'boost_purchased'       // New boost activated
  | 'boost_extended'        // Same package extended
  | 'boost_upgraded'        // Higher priority with proration
  | 'boost_expired'         // Natural expiration
  | 'boost_replaced'        // Replaced by higher priority
  | 'boost_purchase_blocked'; // Guardrail prevented purchase

interface BoostEventData {
  userId: string;
  userType: 'escort' | 'agency';
  packageId: string;
  previousPackageId?: string;
  action: 'purchase' | 'extend' | 'upgrade' | 'block';
  creditsSpent: number;
  proratedCredits?: number;
  priorityBefore?: number;
  priorityAfter: number;
}
```

---

## Testing Checklist

- [ ] User with no boost → can purchase any package
- [ ] User with Quick Boost → can extend Quick Boost
- [ ] User with Quick Boost → can upgrade to Weekly/Premium/MVP
- [ ] User with Weekly Boost → CANNOT purchase Quick Boost
- [ ] User with Weekly Boost → CANNOT purchase another Weekly Boost (must extend)
- [ ] User with Monthly VIP → CANNOT purchase any other boost
- [ ] Boost expires → 1-hour cooldown enforced
- [ ] After cooldown → can purchase any package
- [ ] Agency with 10 profiles → gets 10% discount
- [ ] Agency discount applies to both credits and Pesapal
- [ ] Boost history recorded for all actions
- [ ] Listing sort respects active boost priority

---

## Rollout Plan

1. **Phase 1:** Database migration + guardrails in `purchaseAdPackage`
2. **Phase 2:** UI updates in `AdvertisingPriceList` (status badges, extend/upgrade buttons)
3. **Phase 3:** Agency discount logic + pricing display
4. **Phase 4:** Analytics events + admin dashboard
5. **Phase 5:** A/B test cooldown duration (1hr vs 24hr)

---

## Future Considerations

- **Boost scheduling:** Purchase boost for future date (e.g., weekend)
- **Category-specific boosts:** Different priorities per category
- **Loyalty rewards:** Free boost day after X purchases
- **Referral boosts:** "Invite agency, get 3-day boost"
- **Dynamic pricing:** Adjust based on demand/category competition