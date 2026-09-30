import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { executeQuery } from "@/lib/neon";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ checkoutRequestId: string }> },
) {
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
      WHERE checkout_request_id = $1
        AND (escort_id IN (${placeholders}) OR agency_id IN (${placeholders}))
      LIMIT 1
    `;

    const transactions = await executeQuery(query, [checkoutRequestId, ...allProfileIds]);

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
      receiptNumber: t.metadata?.receiptNumber,
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