"use server";

import { getAdPackageById, getCreditPackageById } from "@/lib/constants/packages";
import { auth } from "@clerk/nextjs/server";
import { sendPaymentConfirmationEmail } from "./email";
import { executeQuery, executeTransaction } from "@/lib/neon";

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

    const currentCredits = Number(user.credits) || 0;
    if (currentCredits < adPackage.credits) {
      return {
        success: false,
        error: `Insufficient credits. You need ${adPackage.credits} credits but have ${currentCredits}`,
      };
    }

    const checkoutRequestId = `AD-${Date.now()}`;

    await executeTransaction(async (client) => {
      await client.query(
        `UPDATE ${userTable} SET credits = credits - $1, updated_at = NOW() WHERE id = $2`,
        [adPackage.credits, user.id],
      );

      const transactionId = crypto.randomUUID();
      await client.query(
        `INSERT INTO transactions (id, checkout_request_id, user_id, ${userIdCol}, amount, currency, status, payment_method, phone_number, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [
          transactionId,
          checkoutRequestId,
          userId,
          user.id,
          adPackage.credits * 10,
          "KES",
          "completed",
          "credits",
          user.whatsapp_phone || "",
          JSON.stringify({
            type: "ad_purchase",
            packageId: packageId,
            packageName: adPackage.name,
            creditsUsed: adPackage.credits,
            accountReference: `Ad-${adPackage.name}-${Date.now()}`,
            transactionDesc: `Buy ${adPackage.name} ad package`,
          }),
        ],
      );
    });

    if (user.email) {
      sendPaymentConfirmationEmail({
        to: user.email,
        name: user.name || "Valued Customer",
        amount: adPackage.credits * 10,
        receiptNumber: `CREDIT-${Date.now()}`,
        packageName: adPackage.name,
        transactionId: checkoutRequestId,
        date: new Date().toLocaleString(),
        phoneNumber: user.whatsapp_phone || "",
        credits: adPackage.credits,
      }).catch((err) => console.error("Background email send failed:", err));
    }

    return { success: true, transactionId: checkoutRequestId };
  } catch (error: any) {
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