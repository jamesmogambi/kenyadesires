"use server";

import { getAdPackageById, getCreditPackageById } from "@/lib/constants/packages";
import { auth } from "@clerk/nextjs/server";
import { sendPaymentConfirmationEmail } from "./email";
import { encodeJsonColumn, executeQuery, executeTransaction } from "@/lib/neon";
import { applyBoostPurchase, asQueryRunner, getBoostHistory, getBoostOverview } from "@/lib/boost";
import { receiptNumberFor } from "@/lib/invoice/receipt";

export async function getUserCredits() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const escortResult: any[] = await executeQuery(
      `SELECT credits FROM escorts WHERE clerk_user_id = $1 LIMIT 1`,
      [userId],
    );
    if (escortResult.length > 0) {
      return { success: true, credits: Number(escortResult[0].credits) || 0 };
    }

    const agencyResult: any[] = await executeQuery(
      `SELECT credits FROM agencies WHERE owner_id = $1 LIMIT 1`,
      [userId],
    );
    if (agencyResult.length > 0) {
      return { success: true, credits: Number(agencyResult[0].credits) || 0 };
    }

    return { success: true, credits: 0 };
  } catch (error: any) {
    console.error("Error fetching credits:", error);
    return { success: false, error: error.message };
  }
}

export interface ActiveAdPackage {
  id: string;
  packageId: string;
  name: string;
  description: string;
  profileType: "escort" | "agency";
  profileName: string | null;
  durationDays: number;
  purchasedAt: Date | null;
  expiresAt: Date;
  daysRemaining: number;
  creditsSpent: number;
}

/**
 * The boosts that are actually running right now.
 *
 * This used to read the `transactions` ledger, which records *payments* and
 * carries no expiry at all, so every row rendered `Expires: Invalid Date` — the
 * page asked for a field the query never selected. It also listed every historic
 * purchase under a heading that says "Active", so five already-superseded
 * purchases were shown alongside the one live boost.
 *
 * `escorts.boost_until` / `agencies.boost_until` are the authoritative record:
 * `lib/boost.ts` writes them on purchase, extends them on re-purchase of the
 * same package, and replaces them on upgrade, so `boost_until` is always the
 * real expiry of the running boost. Filtering on `boost_until > NOW()` makes the
 * list match its own heading.
 */
export async function getUserActivePackages() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Both profile types: an agency owner can also hold an escort profile, and
    // each carries its own boost. `boost_until > NOW()` is the same lazy
    // expiry check the listing query uses, so this needs no cleanup job.
    //
    // The owner column needs its own placeholder ($2, not a repeated $1):
    // `convertParams` in lib/neon.ts rewrites *every* $n to a literal `?` and
    // passes the params array straight through, so reusing $1 here left the
    // second `?` unbound. MySQL rejected the statement with ER_PARSE_ERROR, the
    // action returned `{success:false}`, and the whole panel silently
    // disappeared instead of rendering.
    const rows: any[] = await executeQuery(
      `SELECT 'escort' AS profile_type, id, name, boost_until, boost_activated_at,
              boost_credits_spent, active_boost_package_id
         FROM escorts
        WHERE clerk_user_id = $1 AND boost_until > NOW()
        UNION ALL
       SELECT 'agency' AS profile_type, id, name, boost_until, boost_activated_at,
              boost_credits_spent, active_boost_package_id
         FROM agencies
        WHERE owner_id = $2 AND boost_until > NOW()`,
      [userId, userId],
    );

    const now = Date.now();
    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    const packages: ActiveAdPackage[] = (rows || []).map((row: any) => {
      const packageId = row.active_boost_package_id;
      const adPkg = packageId ? getAdPackageById(packageId) : null;

      const expiresAt = new Date(row.boost_until);
      const activatedAt = row.boost_activated_at ? new Date(row.boost_activated_at) : null;

      // Prefer the package definition's duration. Fall back to the measured
      // span for a package id that is no longer in AD_PACKAGES, so the UI still
      // shows a real number instead of 0.
      const measuredDays = activatedAt
        ? Math.max(1, Math.round((expiresAt.getTime() - activatedAt.getTime()) / MS_PER_DAY))
        : 0;

      return {
        id: `${row.profile_type}:${row.id}`,
        packageId: packageId || "unknown",
        name: adPkg?.name || packageId || "Ad Package",
        description: adPkg?.description || "",
        profileType: row.profile_type,
        profileName: row.name || null,
        durationDays: adPkg?.durationDays || measuredDays,
        purchasedAt: activatedAt,
        expiresAt,
        daysRemaining: Math.max(0, Math.ceil((expiresAt.getTime() - now) / MS_PER_DAY)),
        creditsSpent: Number(row.boost_credits_spent) || 0,
      };
    });

    packages.sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());

    return { success: true, packages };
  } catch (error: any) {
    console.error("Error fetching active packages:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Thrown inside the purchase transaction so a guardrail rejection rolls the
 * credit deduction back instead of charging for a boost that was never applied.
 */
class BoostPurchaseError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "BoostPurchaseError";
    this.code = code;
  }
}

export async function getBoostStatus() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }
    return { success: true, overview: await getBoostOverview(userId) };
  } catch (error: any) {
    console.error("Error fetching boost status:", error);
    return { success: false, error: error.message };
  }
}

export async function getBoostPurchaseHistory() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }
    return { success: true, history: await getBoostHistory(userId) };
  } catch (error: any) {
    console.error("Error fetching boost history:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Buys an AD_PACKAGES entry with credits.
 *
 * All boost guardrails live in `applyBoostPurchase` (lib/boost.ts): one active
 * boost per profile, same package extends, higher priority upgrades with a
 * prorated credit, lower/equal priority is blocked, and a 1h cooldown applies
 * after a boost expires. Credits and the boost row are written in one
 * transaction so a failure cannot charge without boosting.
 */
export async function purchaseAdPackage(packageId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const adPackage = getAdPackageById(packageId);
    if (!adPackage) {
      return { success: false, error: "Invalid package" };
    }

    const escortResult: any[] = await executeQuery(
      `SELECT id, credits, name, email, whatsapp_phone FROM escorts WHERE clerk_user_id = $1 LIMIT 1`,
      [userId],
    );

    let user: any = null;
    let userTable = "escorts";
    let userIdCol = "escort_id";

    if (escortResult.length > 0) {
      user = escortResult[0];
    } else {
      const agencyResult: any[] = await executeQuery(
        `SELECT id, credits, name, contact_email as email, whatsapp_phone FROM agencies WHERE owner_id = $1 LIMIT 1`,
        [userId],
      );
      if (agencyResult.length > 0) {
        user = agencyResult[0];
        userTable = "agencies";
        userIdCol = "agency_id";
      }
    }

    if (!user) {
      return { success: false, error: "User profile not found" };
    }

    const checkoutRequestId = `AD-${Date.now()}`;
    // Declared out here, not inside the transaction callback, so the
    // confirmation email below can print the same number the invoice will.
    let receiptNumber = "";

    const result = await executeTransaction(async (client) => {
      const boost = await applyBoostPurchase(asQueryRunner(client), {
        userId,
        packageId,
      });
      if (!boost.success) {
        throw new BoostPurchaseError(boost.error || "Failed to apply boost", boost.code);
      }

      const transactionId = crypto.randomUUID();
      receiptNumber = receiptNumberFor(transactionId);
      await client.query(
        `INSERT INTO transactions (id, checkout_request_id, user_id, ${userIdCol}, amount, currency, status, payment_method, phone_number, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [
          transactionId,
          checkoutRequestId,
          userId,
          user.id,
          (boost.creditsSpent || 0) * 10,
          "KES",
          "completed",
          "credits",
          user.whatsapp_phone || "",
          encodeJsonColumn(
            "metadata",
            JSON.stringify({
              type: "ad_purchase",
              packageId: packageId,
              packageName: adPackage.name,
              creditsUsed: boost.creditsSpent,
              proratedCredits: boost.proratedCredits,
              boostAction: boost.action,
              accountReference: `Ad-${adPackage.name}-${Date.now()}`,
              transactionDesc: `Buy ${adPackage.name} ad package`,
              // Same generator as the Pesapal path, so both invoice types carry
              // the same receipt format.
              receiptNumber,
              // Captured on the invoice so a downloaded PDF identifies who paid,
              // not just what was bought.
              email: user.email || "",
              phone: user.whatsapp_phone || "",
            }),
          ),
        ],
      );

      return boost;
    });

    if (user.email) {
      sendPaymentConfirmationEmail({
        to: user.email,
        name: user.name || "Valued Customer",
        amount: (result.creditsSpent || 0) * 10,
        receiptNumber,
        packageName: adPackage.name,
        transactionId: checkoutRequestId,
        date: new Date().toLocaleString(),
        phoneNumber: user.whatsapp_phone || "",
        credits: result.creditsSpent || 0,
      }).catch((err) => console.error("Background email send failed:", err));
    }

    return { success: true, transactionId: checkoutRequestId };
  } catch (error: any) {
    if (error instanceof BoostPurchaseError) {
      return { success: false, error: error.message, code: error.code };
    }
    console.error("Error purchasing ad package:", error);
    return { success: false, error: error.message };
  }
}

export async function incrementUserCredits(userId: string, credits: number) {
  try {
    await executeQuery(
      `UPDATE escorts SET credits = credits + $2, updated_at = NOW() WHERE clerk_user_id = $1`,
      [userId, credits],
    );
    const escortResult: any[] = await executeQuery(
      `SELECT credits FROM escorts WHERE clerk_user_id = $1 LIMIT 1`,
      [userId],
    );
    if (escortResult.length > 0) {
      return { success: true, credits: Number(escortResult[0].credits) };
    }

    await executeQuery(
      `UPDATE agencies SET credits = credits + $2, updated_at = NOW() WHERE owner_id = $1`,
      [userId, credits],
    );
    const agencyResult: any[] = await executeQuery(
      `SELECT credits FROM agencies WHERE owner_id = $1 LIMIT 1`,
      [userId],
    );
    if (agencyResult.length > 0) {
      return { success: true, credits: Number(agencyResult[0].credits) };
    }

    return { success: false, error: "User not found" };
  } catch (error: any) {
    console.error("Error incrementing credits:", error);
    return { success: false, error: error.message };
  }
}

export interface UserProfile {
  name: string | null;
  email: string | null;
  phone: string | null;
  idType: "escort" | "agency" | null;
}

/**
 * Returns the billing contact (name, email, phone, role) for the current
 * Clerk user, looking at both the `escorts` and `agencies` tables.
 * Used to pre-fill the Pesapal billing_address so the customer doesn't have to
 * re-enter their details on the /extend checkout.
 */
export async function getUserProfile(): Promise<{
  success: boolean;
  profile?: UserProfile;
  error?: string;
}> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const escortResult: any[] = await executeQuery(
      `SELECT name, email, whatsapp_phone FROM escorts WHERE clerk_user_id = $1 LIMIT 1`,
      [userId],
    );
    if (escortResult.length > 0) {
      return {
        success: true,
        profile: {
          name: escortResult[0].name || null,
          email: escortResult[0].email || null,
          phone: escortResult[0].whatsapp_phone || null,
          idType: "escort",
        },
      };
    }

    const agencyResult: any[] = await executeQuery(
      `SELECT name, contact_email AS email, whatsapp_phone AS phone FROM agencies WHERE owner_id = $1 LIMIT 1`,
      [userId],
    );
    if (agencyResult.length > 0) {
      return {
        success: true,
        profile: {
          name: agencyResult[0].name || null,
          email: agencyResult[0].email || null,
          idType: "agency",
          phone: agencyResult[0].phone || null,
        },
      };
    }

    return { success: true, profile: { name: null, email: null, phone: null, idType: null } };
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return { success: false, error: error.message };
  }
}