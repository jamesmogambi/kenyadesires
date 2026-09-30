import { NextRequest, NextResponse } from "next/server";
import {
  getTransactionStatus,
  normalizePesapalStatus,
  PesapalError,
} from "@/lib/pesapal";
import { getOrder, safeEqual, updateOrderStatus } from "@/lib/pesapal-orders";
import { sendPaymentConfirmationEmail } from "@/server-actions/email";
import { encodeJsonColumn, executeQuery, executeTransaction } from "@/lib/neon";
import { getAdPackageById, getCreditPackageById } from "@/lib/constants/packages";
import { applyBoostPurchase, asQueryRunner } from "@/lib/boost";

/**
 * GET|POST /api/pesapal/ipn
 *
 * Pesapal's Instant Payment Notification webhook. Pesapal calls this when a
 * payment status changes.
 *
 * Per Pesapal docs, the IPN (and the browser callback) do NOT carry the payment
 * status for security reasons. We therefore:
 *   1. Read the OrderTrackingId (from query on GET, from JSON body on POST).
 *   2. Call getTransactionStatus() to VERIFY the real status server-to-server.
 *   3. Update the local order idempotently.
 *   4. Award credits to the user on successful payment.
 *   5. Respond with the exact shape Pesapal requires:
 *      { orderNotificationType, orderTrackingId, orderMerchantReference, status: 200 }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  return handleIPN(
    searchParams.get("OrderTrackingId"),
    searchParams.get("OrderMerchantReference"),
    searchParams.get("OrderNotificationType"),
  );
}

export async function POST(req: NextRequest) {
  let body: {
    OrderTrackingId?: string;
    OrderMerchantReference?: string;
    OrderNotificationType?: string;
  } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  return handleIPN(
    body.OrderTrackingId ?? null,
    body.OrderMerchantReference ?? null,
    body.OrderNotificationType ?? null,
  );
}

async function handleIPN(
  orderTrackingId: string | null,
  orderMerchantReference: string | null,
  orderNotificationType: string | null,
) {
  if (!orderTrackingId) {
    return NextResponse.json(
      { error: "Missing OrderTrackingId" },
      { status: 400 },
    );
  }

  try {
    // 1. Verify with Pesapal — never trust the IPN payload alone.
    const tx = await getTransactionStatus(orderTrackingId);
    const status = normalizePesapalStatus(tx.payment_status_description);

    // 2. Cross-check merchant_reference (constant-time) when we have a stored order.
    const existing = await getOrder(orderTrackingId);
    if (existing && !safeEqual(existing.merchant_reference, orderMerchantReference)) {
      console.warn(
        `[Pesapal/IPN] merchant_reference mismatch for ${orderTrackingId}: ` +
          `ipn="${orderMerchantReference}" db="${existing.merchant_reference}" — skipping update`,
      );
      // We still ack so Pesapal stops retrying, but we did not trust the payload.
    }

    // 3. Persist (idempotent — safe to call on every IPN).
    const result = await updateOrderStatus(
      orderTrackingId,
      status,
      orderMerchantReference || null,
      tx,
    );
    console.log(`[Pesapal/IPN] order ${orderTrackingId} → ${status} (prev=${result.previous})`);

    // 4. Handle completion: activate the boost + record the transaction
    if (status === "completed" && result.updated && result.previous !== "completed") {
      const packageId = existing?.package_id || null;
      const adPackage = packageId ? getAdPackageById(packageId) : undefined;
      const creditPackage = packageId ? getCreditPackageById(packageId) : undefined;

      if (existing?.user_id && packageId) {
        try {
          if (adPackage && adPackage.type === "boost") {
            // Guardrails live in applyBoostPurchase; `paid` skips the credit
            // deduction because Pesapal already collected the cash.
            const applied = await executeTransaction(async (client) => {
              const result = await applyBoostPurchase(asQueryRunner(client), {
                userId: existing.user_id as string,
                packageId,
                paid: true,
                orderTrackingId,
              });
              if (!result.success) return result;

              // The boost target resolved to a profile; point the invoice row
              // at that same profile so /extend lists it.
              const [escortRows, agencyRows] = await Promise.all([
                client.query(
                  `SELECT id FROM escorts WHERE clerk_user_id = $1 LIMIT 1`,
                  [existing.user_id],
                ),
                client.query(
                  `SELECT id FROM agencies WHERE owner_id = $1 LIMIT 1`,
                  [existing.user_id],
                ),
              ]);
              const escortId = escortRows[0]?.[0]?.id || null;
              const agencyId = escortId ? null : agencyRows[0]?.[0]?.id || null;

              await client.query(
                `INSERT INTO transactions
                   (id, checkout_request_id, user_id, escort_id, agency_id, amount, currency,
                    status, payment_method, phone_number, metadata, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, 'KES', 'completed', $7, $8, $9, NOW(), NOW())`,
                [
                  crypto.randomUUID(),
                  orderTrackingId,
                  existing.user_id,
                  escortId,
                  agencyId,
                  Number(existing.amount) || Number(tx.amount) || 0,
                  tx.payment_method || "pesapal",
                  existing.phone_number || "",
                  encodeJsonColumn(
                    "metadata",
                    JSON.stringify({
                      type: "ad_purchase",
                      packageId,
                      packageName: adPackage.name,
                      creditsUsed: result.creditsSpent,
                      proratedCredits: result.proratedCredits,
                      boostAction: result.action,
                      orderTrackingId,
                      receiptNumber: tx.merchant_reference || "",
                    }),
                  ),
                ],
              );

              return result;
            });

            if (applied.success) {
              console.log(
                `[Pesapal/IPN] Boost ${applied.action} applied for user ${existing.user_id} ` +
                  `package ${packageId} until ${applied.boostUntil?.toISOString()}`,
              );
            } else {
              console.error(
                `[Pesapal/IPN] Boost NOT applied for user ${existing.user_id} ` +
                  `package ${packageId}: ${applied.error} (${applied.code})`,
              );
            }
          } else if (creditPackage) {
            // Credit top-up: works for both escorts and agencies.
            await executeQuery(
              `UPDATE escorts SET credits = COALESCE(credits, 0) + $1, updated_at = NOW() WHERE clerk_user_id = $2`,
              [creditPackage.credits, existing.user_id],
            );
            const escortResult = await executeQuery(
              `SELECT id FROM escorts WHERE clerk_user_id = $1 LIMIT 1`,
              [existing.user_id],
            );
            if (escortResult.length === 0) {
              await executeQuery(
                `UPDATE agencies SET credits = COALESCE(credits, 0) + $1, updated_at = NOW() WHERE owner_id = $2`,
                [creditPackage.credits, existing.user_id],
              );
            }
            console.log(
              `[Pesapal/IPN] Awarded ${creditPackage.credits} credits to user ${existing.user_id} for package ${packageId}`,
            );
          }
        } catch (boostErr) {
          console.error("[Pesapal/IPN] Failed to apply purchase:", boostErr);
        }
      }

      // 4b. Send payment confirmation email
      try {
        await sendPaymentConfirmationEmail({
          to: existing?.email || "",
          name: `${existing?.email?.split("@")[0] || "Customer"}`,
          amount: Number(tx.amount) || 0,
          receiptNumber: tx.merchant_reference || "",
          packageName: tx.description || "Boost Package",
          transactionId: orderTrackingId,
          date: new Date().toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" }),
          phoneNumber: existing?.phone_number || "N/A",
          paymentMethod: tx.payment_method || "Pesapal (M-Pesa / Airtel Money / Card)",
        });
      } catch (emailErr) {
        console.error("[Pesapal/IPN] Failed to send confirmation email:", emailErr);
      }
    }

    // 5. Exact acknowledgement shape required by Pesapal.
    return NextResponse.json(
      {
        orderNotificationType: orderNotificationType || "IPNCHANGE",
        orderTrackingId,
        orderMerchantReference: orderMerchantReference || "",
        status: 200,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("[Pesapal/IPN] error:", err?.message || err);
    // A non-2xx response makes Pesapal retry the IPN.
    const status =
      err instanceof PesapalError ? err.status || 502 : 500;
    return NextResponse.json(
      { error: "IPN processing failed", detail: err.message },
      { status },
    );
  }
}
