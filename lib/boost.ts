/**
 * Boost listing packages — guardrails, proration, and lifecycle.
 *
 * Rules implemented here follow BOOST_PACKAGE_PLAN.md / LISTING_BOOST_WORKFLOW.md:
 *   - one active boost per profile (no stacking)
 *   - same package re-purchase extends the current boost
 *   - higher priority replaces the current boost with a prorated credit
 *   - lower/equal priority is blocked while a boost is active
 *   - 1 hour cooldown after a boost expires
 *
 * Expiration is lazy: `boost_until` is compared against NOW() on read, and
 * `scripts/cleanup-expired-boosts.ts` resets the columns for data hygiene.
 */

import { executeQuery, encodeJsonColumn } from "@/lib/neon";
import { AD_PACKAGES, CREDIT_VALUE_KSH, getAdPackageById } from "@/lib/constants/packages";

export const BOOST_COOLDOWN_HOURS = 1;

/**
 * Shown when a signed-in account has neither an escort nor an agency row yet.
 * A boost ranks a profile, so there is nothing to boost until one exists — say
 * what to do about it instead of "User profile not found".
 */
export const NO_PROFILE_REASON =
  "You don't have a profile on this site yet. Create an escort or agency profile first, then come back to buy a boost.";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type BoostUserType = "escort" | "agency";

export type PackageStatus = "available" | "extend" | "upgrade" | "blocked";

export type BoostAction = "purchase" | "extend" | "upgrade";

export interface ActiveBoost {
  profileId: string;
  userId: string;
  userType: BoostUserType;
  packageId: string;
  packageName: string;
  priority: number;
  boostUntil: Date;
  boostActivatedAt: Date;
  creditsSpent: number;
  durationDays: number;
  daysRemaining: number;
}

export interface BoostProfile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  credits: number;
  userType: BoostUserType;
  isActive: boolean;
  isVerified: boolean;
  boostUntil: Date | null;
  boostPriority: number;
  activeBoostPackageId: string | null;
  boostCreditsSpent: number;
  boostActivatedAt: Date | null;
  lastBoostEndedAt: Date | null;
}

export interface AgencyDiscountTier {
  minProfiles: number;
  discount: number;
}

export const AGENCY_DISCOUNT_TIERS: AgencyDiscountTier[] = [
  { minProfiles: 31, discount: 0.2 },
  { minProfiles: 16, discount: 0.15 },
  { minProfiles: 6, discount: 0.1 },
  { minProfiles: 0, discount: 0 },
];

type QueryRunner = (text: string, params?: any[]) => Promise<any[]>;

const run: QueryRunner = (text, params = []) => executeQuery(text, params);

/**
 * Adapts a `TransactionConnection` from lib/neon to a QueryRunner, dropping the
 * mysql2 `[rows, fields]` tuple so callers inside a transaction can hand the
 * same client to the boost helpers.
 */
export function asQueryRunner(client: {
  query: (text: string, params?: any[]) => Promise<[any[], any]>;
}): QueryRunner {
  return async (text, params = []) => {
    const [rows] = await client.query(text, params);
    return (rows || []) as any[];
  };
}

function toDate(value: any): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") return new Date(value);
  const str = String(value);
  const mysqlDateTime = str.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/);
  if (mysqlDateTime) {
    const parsed = new Date(`${mysqlDateTime[1]}T${mysqlDateTime[2]}`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toBool(value: any): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function daysBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / MS_PER_DAY;
}

/**
 * The single query helper used by every read in this module, so the column list
 * stays in one place. `boost_*` columns come from migration 008.
 */
const PROFILE_COLUMNS = `
  id, name, credits, is_active, is_verified,
  boost_until, boost_priority, active_boost_package_id,
  boost_credits_spent, boost_activated_at, last_boost_ended_at
`;

export async function getBoostProfile(
  userId: string,
  userType: BoostUserType,
  query: QueryRunner = run,
): Promise<BoostProfile | null> {
  const table = userType === "escort" ? "escorts" : "agencies";
  const ownerColumn = userType === "escort" ? "clerk_user_id" : "owner_id";
  const emailColumn = userType === "escort" ? "email" : "contact_email";
  const phoneColumn = userType === "escort" ? "whatsapp_phone" : "whatsapp_phone";

  const rows = await query(
    `SELECT ${PROFILE_COLUMNS}, ${emailColumn} AS profile_email, ${phoneColumn} AS profile_phone
     FROM ${table}
     WHERE ${ownerColumn} = $1
     LIMIT 1`,
    [userId],
  );

  const row = rows?.[0];
  if (!row) return null;

  return {
    id: String(row.id),
    name: row.name || null,
    email: row.profile_email || null,
    phone: row.profile_phone || null,
    credits: Number(row.credits) || 0,
    userType,
    isActive: toBool(row.is_active),
    isVerified: toBool(row.is_verified),
    boostUntil: toDate(row.boost_until),
    boostPriority: Number(row.boost_priority) || 0,
    activeBoostPackageId: row.active_boost_package_id || null,
    boostCreditsSpent: Number(row.boost_credits_spent) || 0,
    boostActivatedAt: toDate(row.boost_activated_at),
    lastBoostEndedAt: toDate(row.last_boost_ended_at),
  };
}

function toActiveBoost(
  profile: BoostProfile,
  userId: string,
  now: Date = new Date(),
): ActiveBoost | null {
  const boostUntil = profile.boostUntil;
  if (!boostUntil || boostUntil.getTime() <= now.getTime()) return null;
  if (!profile.activeBoostPackageId) return null;

  const pkg = getAdPackageById(profile.activeBoostPackageId);
  const activatedAt = profile.boostActivatedAt || boostUntil;

  return {
    profileId: profile.id,
    userId,
    userType: profile.userType,
    packageId: profile.activeBoostPackageId,
    packageName: pkg?.name || profile.activeBoostPackageId,
    priority: pkg?.priority ?? profile.boostPriority,
    boostUntil,
    boostActivatedAt: activatedAt,
    creditsSpent: profile.boostCreditsSpent,
    durationDays: pkg?.durationDays || Math.max(1, Math.ceil(daysBetween(activatedAt, boostUntil))),
    daysRemaining: Math.max(0, Math.ceil(daysBetween(now, boostUntil))),
  };
}

/**
 * Resolves the profile a purchase applies to. An agency owner may also have an
 * escort profile; the escort profile wins because that is the listing a boost
 * actually ranks.
 */
export async function getBoostTarget(
  userId: string,
  query: QueryRunner = run,
): Promise<{ profile: BoostProfile; userType: BoostUserType } | null> {
  const escort = await getBoostProfile(userId, "escort", query);
  if (escort) return { profile: escort, userType: "escort" };
  const agency = await getBoostProfile(userId, "agency", query);
  if (agency) return { profile: agency, userType: "agency" };
  return null;
}

export async function getActiveBoost(
  userId: string,
  userType: BoostUserType,
  query: QueryRunner = run,
): Promise<ActiveBoost | null> {
  const profile = await getBoostProfile(userId, userType, query);
  if (!profile) return null;
  return toActiveBoost(profile, userId);
}

export interface CooldownState {
  inCooldown: boolean;
  endsAt: Date | null;
  minutesRemaining: number;
}

export function getCooldownState(
  profile: Pick<BoostProfile, "lastBoostEndedAt">,
  now: Date = new Date(),
): CooldownState {
  const endedAt = profile.lastBoostEndedAt;
  if (!endedAt) {
    return { inCooldown: false, endsAt: null, minutesRemaining: 0 };
  }

  const endsAt = new Date(endedAt.getTime() + BOOST_COOLDOWN_HOURS * 60 * 60 * 1000);
  const remainingMs = endsAt.getTime() - now.getTime();
  if (remainingMs <= 0) {
    return { inCooldown: false, endsAt: null, minutesRemaining: 0 };
  }

  return {
    inCooldown: true,
    endsAt,
    minutesRemaining: Math.ceil(remainingMs / 60000),
  };
}

export function isBoostActive(boostUntil: Date | null, now: Date = new Date()): boolean {
  return !!boostUntil && boostUntil.getTime() > now.getTime();
}

/**
 * ORDER BY fragment that puts a live boost first, then the rest of the caller's
 * sort. Expired boosts resolve to priority 0 in the CASE, so no cleanup job is
 * needed for correct ranking (the cleanup script is only for data hygiene).
 *
 * Boost applies within the filtered result set (county, category, region), so a
 * boost never leaks a profile across counties or categories.
 */
export function boostOrderBy(
  alias: string,
  secondarySort: string,
  secondaryOrder: "ASC" | "DESC" = "DESC",
): string {
  return `
    CASE WHEN ${alias}.boost_until > NOW() THEN ${alias}.boost_priority ELSE 0 END DESC,
    CASE WHEN ${alias}.boost_until > NOW() THEN ${alias}.boost_until ELSE NULL END ASC,
    ${secondarySort} ${secondaryOrder}
  `;
}

export function getPackageStatus(
  pkg: { id: string; priority: number },
  activeBoost: ActiveBoost | null,
): PackageStatus {
  if (!activeBoost) return "available";
  if (activeBoost.packageId === pkg.id) return "extend";
  if (pkg.priority > activeBoost.priority) return "upgrade";
  return "blocked";
}

export interface Proration {
  proratedCredits: number;
  netCredits: number;
  daysRemaining: number;
  remainingRatio: number;
}

/**
 * Credit value left in the running boost, applied against an upgrade.
 * Uses elapsed time against the original duration so extending a boost
 * repeatedly cannot inflate the refund.
 */
export function calculateProration(
  current: ActiveBoost,
  newPkg: { credits: number; durationDays: number },
  now: Date = new Date(),
): Proration {
  const totalMs = Math.max(
    1,
    daysBetween(current.boostActivatedAt, current.boostUntil) * MS_PER_DAY,
  );
  const remainingMs = Math.max(0, current.boostUntil.getTime() - now.getTime());
  const remainingRatio = Math.min(1, remainingMs / totalMs);
  const proratedCredits = Math.min(
    current.creditsSpent,
    Math.floor(current.creditsSpent * remainingRatio),
  );

  return {
    proratedCredits,
    netCredits: Math.max(0, newPkg.credits - proratedCredits),
    daysRemaining: Math.max(0, Math.ceil(daysBetween(now, current.boostUntil))),
    remainingRatio,
  };
}

export function getAgencyDiscountForProfileCount(profileCount: number): number {
  const tier = AGENCY_DISCOUNT_TIERS.find((t) => profileCount >= t.minProfiles);
  return tier?.discount ?? 0;
}

export async function getActiveEscortCount(
  agencyId: string,
  query: QueryRunner = run,
): Promise<number> {
  const rows = await query(
    `SELECT COUNT(*) AS total FROM escorts WHERE agency_id = $1 AND is_active = TRUE`,
    [agencyId],
  );
  return Number(rows?.[0]?.total) || 0;
}

export async function getAgencyDiscount(
  agencyId: string,
  query: QueryRunner = run,
): Promise<number> {
  const profileCount = await getActiveEscortCount(agencyId, query);
  return getAgencyDiscountForProfileCount(profileCount);
}

/**
 * KSH price for a package after the agency volume discount. Escorts always pay
 * the list price (CREDIT_VALUE_KSH per credit).
 */
export async function getPackagePrice(
  packageId: string,
  userType: BoostUserType,
  agencyId?: string | null,
  query: QueryRunner = run,
): Promise<number> {
  const pkg = getAdPackageById(packageId);
  if (!pkg) return 0;

  const basePrice = pkg.credits * CREDIT_VALUE_KSH;
  if (userType !== "agency" || !agencyId) return basePrice;

  const discount = await getAgencyDiscount(agencyId, query);
  return Math.round(basePrice * (1 - discount));
}

export interface EligibilityResult {
  eligible: boolean;
  status: PackageStatus;
  reason?: string;
  cooldown?: CooldownState;
  proratedCredits?: number;
  netCredits?: number;
  price?: number;
}

/**
 * Decides what happens if this user buys `packageId` right now, without
 * mutating anything. Drives both the UI labels and the server-side check so the
 * two can never disagree.
 */
export async function checkBoostEligibility(
  userId: string,
  packageId: string,
  query: QueryRunner = run,
): Promise<EligibilityResult> {
  const pkg = getAdPackageById(packageId);
  if (!pkg || pkg.type !== "boost") {
    return { eligible: false, status: "blocked", reason: "Invalid boost package" };
  }

  const target = await getBoostTarget(userId, query);
  if (!target) {
    return {
      eligible: false,
      status: "blocked",
      reason: NO_PROFILE_REASON,
    };
  }

  if (!target.profile.isActive) {
    return {
      eligible: false,
      status: "blocked",
      reason: "Your profile must be active before purchasing a boost.",
    };
  }

  const price = await getPackagePrice(
    packageId,
    target.userType,
    target.userType === "agency" ? target.profile.id : null,
    query,
  );

  const activeBoost = toActiveBoost(target.profile, userId);
  const status = getPackageStatus(pkg, activeBoost);

  if (status === "blocked") {
    return {
      eligible: false,
      status,
      reason: `You already have ${activeBoost?.packageName} active. Complete it first or upgrade to a higher tier.`,
      price,
    };
  }

  if (status === "upgrade" && activeBoost) {
    const proration = calculateProration(activeBoost, pkg);
    return {
      eligible: true,
      status,
      proratedCredits: proration.proratedCredits,
      netCredits: proration.netCredits,
      price,
    };
  }

  const cooldown = getCooldownState(target.profile);
  if (cooldown.inCooldown) {
    return {
      eligible: false,
      status,
      reason: `Please wait ${BOOST_COOLDOWN_HOURS} hour after your boost expires before purchasing a new one.`,
      cooldown,
      price,
    };
  }

  return { eligible: true, status, netCredits: pkg.credits, price };
}

async function writeBoostHistory(
  client: QueryRunner,
  entry: {
    userId: string;
    userType: BoostUserType;
    profileId: string;
    packageId: string;
    packageName: string;
    priority: number;
    durationDays: number;
    creditsSpent: number;
    proratedCredits: number;
    actionType: string;
    startedAt: Date;
    endedAt?: Date | null;
    endReason?: string | null;
    metadata?: Record<string, any>;
  },
): Promise<void> {
  const metadata = encodeJsonColumn("metadata", JSON.stringify(entry.metadata || {}));
  await client(
    `INSERT INTO boost_history
       (id, user_id, user_type, profile_id, package_id, package_name, priority,
        duration_days, credits_spent, prorated_credits, action_type, started_at,
        ended_at, end_reason, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())`,
    [
      crypto.randomUUID(),
      entry.userId,
      entry.userType,
      entry.profileId,
      entry.packageId,
      entry.packageName,
      entry.priority,
      entry.durationDays,
      entry.creditsSpent,
      entry.proratedCredits,
      entry.actionType,
      entry.startedAt,
      entry.endedAt ?? null,
      entry.endReason ?? null,
      metadata,
    ],
  );
}

function boostTable(userType: BoostUserType): { table: string; idColumn: string } {
  return userType === "escort"
    ? { table: "escorts", idColumn: "id" }
    : { table: "agencies", idColumn: "id" };
}

export interface ApplyBoostResult {
  success: boolean;
  action?: BoostAction;
  creditsSpent?: number;
  proratedCredits?: number;
  boostUntil?: Date;
  packageId?: string;
  error?: string;
  code?: string;
}

/**
 * Applies a paid-for boost to a profile, enforcing every guardrail.
 *
 * `client` must run inside the caller's transaction so the credit deduction and
 * the boost write commit together. `paid` marks credits that were already taken
 * (IPN path) so the same guardrails run without a second deduction.
 */
export async function applyBoostPurchase(
  client: QueryRunner,
  args: {
    userId: string;
    packageId: string;
    paid?: boolean;
    orderTrackingId?: string | null;
  },
): Promise<ApplyBoostResult> {
  const { userId, packageId, paid = false, orderTrackingId = null } = args;
  const now = new Date();

  const pkg = getAdPackageById(packageId);
  if (!pkg || pkg.type !== "boost") {
    return { success: false, error: "Invalid boost package", code: "BOOST_INVALID" };
  }

  const target = await getBoostTarget(userId, client);
  if (!target) {
    return { success: false, error: "User profile not found", code: "BOOST_NO_PROFILE" };
  }

  const { profile, userType } = target;
  if (!profile.isActive) {
    return {
      success: false,
      error: "Your profile must be active before purchasing a boost.",
      code: "BOOST_PROFILE_INACTIVE",
    };
  }

  const activeBoost = toActiveBoost(profile, userId, now);
  const status = getPackageStatus(pkg, activeBoost);
  const { table, idColumn } = boostTable(userType);

  if (status === "blocked") {
    return {
      success: false,
      error: `You already have ${activeBoost?.packageName} active. Complete it first or upgrade to a higher tier.`,
      code: "BOOST_ACTIVE_HIGHER",
    };
  }

  if (status === "available") {
    const cooldown = getCooldownState(profile, now);
    if (cooldown.inCooldown) {
      return {
        success: false,
        error: `Please wait ${BOOST_COOLDOWN_HOURS} hour after your boost expires before purchasing a new one.`,
        code: "BOOST_COOLDOWN",
      };
    }
  }

  let action: BoostAction = "purchase";
  let creditsSpent: number = pkg.credits;
  let proratedCredits = 0;
  let boostUntil: Date;

  if (status === "upgrade" && activeBoost) {
    action = "upgrade";
    const proration = calculateProration(activeBoost, pkg, now);
    proratedCredits = proration.proratedCredits;
    creditsSpent = proration.netCredits;
  }

  if (!paid && profile.credits < creditsSpent) {
    return {
      success: false,
      error: `Insufficient credits. You need ${creditsSpent} credits but have ${profile.credits}`,
      code: "BOOST_INSUFFICIENT_CREDITS",
    };
  }

  if (status === "extend" && activeBoost) {
    action = "extend";
    boostUntil = new Date(activeBoost.boostUntil.getTime() + pkg.durationDays * MS_PER_DAY);

    await client(
      `UPDATE ${table}
         SET boost_until = $1,
             boost_credits_spent = boost_credits_spent + $2,
             boost_priority = $3,
             active_boost_package_id = $4,
             last_boost_ended_at = NULL,
             updated_at = NOW()
       WHERE ${idColumn} = $5`,
      [boostUntil, pkg.credits, pkg.priority, pkg.id, profile.id],
    );

    // The open history row (ended_at IS NULL) is the running boost; extend it in
    // place instead of closing it and opening a second one.
    await client(
      `UPDATE boost_history
          SET duration_days = duration_days + $1,
              credits_spent = credits_spent + $2
        WHERE user_id = $3 AND user_type = $4 AND ended_at IS NULL`,
      [pkg.durationDays, pkg.credits, userId, userType],
    );
  } else {
    boostUntil = new Date(now.getTime() + pkg.durationDays * MS_PER_DAY);

    // Retire the running boost row before replacing it so history stays honest.
    if (activeBoost) {
      await client(
        `UPDATE boost_history
            SET ended_at = $1, end_reason = 'replaced'
          WHERE user_id = $2 AND user_type = $3 AND ended_at IS NULL`,
        [now, userId, userType],
      );
    }

    await client(
      `UPDATE ${table}
         SET boost_until = $1,
             boost_priority = $2,
             active_boost_package_id = $3,
             boost_credits_spent = $4,
             boost_activated_at = $5,
             last_boost_ended_at = NULL,
             updated_at = NOW()
       WHERE ${idColumn} = $6`,
      [boostUntil, pkg.priority, pkg.id, creditsSpent, now, profile.id],
    );
  }

  if (!paid && creditsSpent > 0) {
    await client(`UPDATE ${table} SET credits = credits - $1 WHERE ${idColumn} = $2`, [
      creditsSpent,
      profile.id,
    ]);
  }

  // `ended_at IS NULL` is what marks the running boost, so a fresh row is left
  // open. It is closed with an end_reason when replaced (above), when the
  // cleanup script sees it expired, or on a later purchase.
  await writeBoostHistory(client, {
    userId,
    userType,
    profileId: profile.id,
    packageId: pkg.id,
    packageName: pkg.name,
    priority: pkg.priority,
    durationDays: pkg.durationDays,
    creditsSpent,
    proratedCredits,
    actionType: action,
    startedAt: now,
    endedAt: null,
    metadata: {
      orderTrackingId,
      previousPackageId: activeBoost?.packageId ?? null,
      paidWithCredits: paid,
    },
  });

  return {
    success: true,
    action,
    creditsSpent,
    proratedCredits,
    boostUntil,
    packageId: pkg.id,
  };
}

export interface BoostHistoryEntry {
  id: string;
  packageId: string;
  packageName: string;
  priority: number;
  durationDays: number;
  creditsSpent: number;
  proratedCredits: number;
  actionType: string;
  startedAt: Date;
  endedAt: Date | null;
  endReason: string | null;
}

export async function getBoostHistory(
  userId: string,
  userType?: BoostUserType,
  limit = 50,
): Promise<BoostHistoryEntry[]> {
  const clauses = ["user_id = $1"];
  const params: any[] = [userId];

  if (userType) {
    params.push(userType);
    clauses.push(`user_type = $${params.length}`);
  }

  params.push(limit);

  const rows = await executeQuery(
    `SELECT id, package_id, package_name, priority, duration_days, credits_spent,
            prorated_credits, action_type, started_at, ended_at, end_reason
       FROM boost_history
      WHERE ${clauses.join(" AND ")}
      ORDER BY started_at DESC
      LIMIT $${params.length}`,
    params,
  );

  return (rows || []).map((row: any) => ({
    id: String(row.id),
    packageId: row.package_id,
    packageName: row.package_name,
    priority: Number(row.priority) || 0,
    durationDays: Number(row.duration_days) || 0,
    creditsSpent: Number(row.credits_spent) || 0,
    proratedCredits: Number(row.prorated_credits) || 0,
    actionType: row.action_type,
    startedAt: toDate(row.started_at) as Date,
    endedAt: toDate(row.ended_at),
    endReason: row.end_reason || null,
  }));
}

export interface PackageStatusView {
  packageId: string;
  status: PackageStatus;
  credits: number;
  netCredits: number;
  proratedCredits: number;
  price: number;
  reason?: string;
}

export interface BoostOverview {
  userType: BoostUserType | null;
  activeBoost: ActiveBoost | null;
  cooldown: CooldownState | null;
  credits: number;
  packages: PackageStatusView[];
}

/** Everything the boost UI needs in one round trip. */
export async function getBoostOverview(userId: string): Promise<BoostOverview> {
  const target = await getBoostTarget(userId);
  if (!target) {
    return {
      userType: null,
      activeBoost: null,
      cooldown: null,
      credits: 0,
      packages: AD_PACKAGES.map((pkg) => ({
        packageId: pkg.id,
        status: "blocked" as PackageStatus,
        credits: pkg.credits,
        netCredits: pkg.credits,
        proratedCredits: 0,
        price: pkg.credits * CREDIT_VALUE_KSH,
        reason: NO_PROFILE_REASON,
      })),
    };
  }

  const { profile, userType } = target;
  const now = new Date();
  const activeBoost = toActiveBoost(profile, userId, now);
  const cooldown = getCooldownState(profile, now);
  const agencyId = userType === "agency" ? profile.id : null;
  const discount = agencyId ? await getAgencyDiscount(agencyId) : 0;

  const packages: PackageStatusView[] = [];
  for (const pkg of AD_PACKAGES) {
    const status = getPackageStatus(pkg, activeBoost);
    const prorated =
      status === "upgrade" && activeBoost
        ? calculateProration(activeBoost, pkg, now)
        : { proratedCredits: 0, netCredits: pkg.credits };

    const basePrice = pkg.credits * CREDIT_VALUE_KSH;
    const price = Math.round(basePrice * (1 - discount));

    let reason: string | undefined;
    if (status === "blocked") {
      reason = `You already have ${activeBoost?.packageName} active. Complete it first or upgrade to a higher tier.`;
    } else if (cooldown.inCooldown) {
      reason = `Please wait ${BOOST_COOLDOWN_HOURS} hour after your boost expires before purchasing a new one.`;
    } else if (!profile.isActive) {
      reason = "Your profile must be active before purchasing a boost.";
    }

    packages.push({
      packageId: pkg.id,
      status,
      credits: pkg.credits,
      netCredits: prorated.netCredits,
      proratedCredits: prorated.proratedCredits,
      price,
      reason,
    });
  }

  return {
    userType,
    activeBoost,
    cooldown: cooldown.inCooldown ? cooldown : null,
    credits: profile.credits,
    packages,
  };
}
