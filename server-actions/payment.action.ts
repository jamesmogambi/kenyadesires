"use server";

import { getAdPackageById, getCreditPackageById } from "@/lib/constants/packages";
import { auth } from "@clerk/nextjs/server";
import { sendPaymentConfirmationEmail } from "./email";
import { encodeJsonColumn, executeQuery, executeTransaction } from "@/lib/neon";
import { applyBoostPurchase, asQueryRunner, getBoostHistory, getBoostOverview } from "@/lib/boost";

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

export async function getUserActivePackages() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const transactions: any[] = await executeQuery(
      `SELECT * FROM transactions WHERE user_id = $1 AND JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.type')) = 'ad_purchase' ORDER BY created_at DESC`,
      [userId],
    );

    const packages = transactions.map((t: any) => {
      const pkgId = t.metadata?.package_id || t.metadata?.packageId;
      const adPkg = pkgId ? getAdPackageById(pkgId) : null;
      return {
        id: t.id,
        packageId: pkgId,
        name: adPkg?.name || pkgId || "Ad Package",
        description: adPkg?.description || "",
        status: t.status,
        purchasedAt: t.created_at,
      };
    });

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

    const result = await executeTransaction(async (client) => {
      const boost = await applyBoostPurchase(asQueryRunner(client), {
        userId,
        packageId,
      });
      if (!boost.success) {
        throw new BoostPurchaseError(boost.error || "Failed to apply boost", boost.code);
      }

      const transactionId = crypto.randomUUID();
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
        receiptNumber: `CREDIT-${Date.now()}`,
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