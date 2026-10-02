import { connection, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { executeQuery } from "@/lib/neon";
import { receiptNumberFor } from "@/lib/invoice/receipt";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ checkoutRequestId: string }> },
) {
  // Request-time only: stops static generation from invoking this handler.
  await connection();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { checkoutRequestId } = await params;

    // Get user's profile IDs to verify ownership
    const [escortResult, agencyResult] = await Promise.all([
      executeQuery(`SELECT id FROM escorts WHERE clerk_user_id = $1`, [userId]),
      executeQuery(`SELECT id FROM agencies WHERE owner_id = $1`, [userId]),
    ]);

    const escortIds = escortResult.map((r: any) => r.id);
    const agencyIds = agencyResult.map((r: any) => r.id);
    const allProfileIds = [...escortIds, ...agencyIds];

    if (allProfileIds.length === 0) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const placeholders = allProfileIds.map((_, i) => `$${i + 2}`).join(", ");

    // The path param is matched against BOTH keys on purpose.
    //
    // /invoices links with the transaction's own `id` (a UUID), while older
    // rows and the Pesapal flows use the identical id and
    // checkout_request_id. Credit purchases in purchaseAdPackage generate
    // checkout_request_id = `AD-<timestamp>`, so a lookup on
    // checkout_request_id alone returns 404 for every one of them and
    // /payment-status polls forever on "Processing Payment".
    // Ownership is still enforced by the profile id check below.
    //
    // The key is bound twice ($1 and $2) rather than reused as $1: convertParams
    // in lib/neon.ts rewrites every $N to `?` positionally without
    // deduplicating, so a repeated $1 shifts every later parameter by one.
    const query = `
      SELECT
        id,
        checkout_request_id,
        user_id,
        escort_id,
        agency_id,
        amount,
        currency,
        status,
        payment_method,
        phone_number,
        metadata,
        created_at,
        updated_at
      FROM transactions
      WHERE (id = $1 OR checkout_request_id = $2)
        AND (escort_id IN (${placeholders}) OR agency_id IN (${placeholders}))
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const transactions = await executeQuery(query, [
      checkoutRequestId,
      checkoutRequestId,
      ...allProfileIds,
      ...allProfileIds,
    ]);

    if (transactions.length === 0) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const t = transactions[0];
    const formatted = {
      id: t.id,
      checkoutRequestId: t.checkout_request_id,
      userId: t.user_id,
      escortId: t.escort_id,
      agencyId: t.agency_id,
      amount: t.amount ? Number(t.amount) : 0,
      currency: t.currency,
      status: t.status,
      paymentMethod: t.payment_method,
      phoneNumber: t.phone_number,
      metadata: t.metadata,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      type: t.metadata?.type,
      packageId: t.metadata?.packageId || t.metadata?.package_id,
      packageName: t.metadata?.packageName || t.metadata?.package_name,
      accountReference: t.metadata?.accountReference,
      transactionDesc: t.metadata?.transactionDesc,
      receiptNumber:
        t.metadata?.receiptNumber || receiptNumberFor(t.id, new Date(t.created_at)),
      // Captured at checkout, not read back from the profile — see the note in
      // app/api/transactions/route.ts.
      email: t.metadata?.email || null,
      phone: t.metadata?.phone || t.phone_number || null,
      transactionDate: t.metadata?.transactionDate,
      resultCode: t.metadata?.resultCode,
      resultDesc: t.metadata?.resultDesc,
      credits: t.metadata?.creditsUsed || t.metadata?.credits,
    };

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: "internal_error", detail: error.message },
      { status: 500 },
    );
  }
}