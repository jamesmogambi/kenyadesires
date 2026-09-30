import { connection, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { executeQuery } from "@/lib/neon";

export async function GET(req: Request) {
  // Request-time only: stops static generation from invoking this handler.
  // Without it the build prerenders this route, auth()'s headers() rejects
  // after the prerender finishes, and every invoice request 500s.
  await connection();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Get user's profile IDs (escort and/or agency)
    const [escortResult, agencyResult] = await Promise.all([
      executeQuery(`SELECT id FROM escorts WHERE clerk_user_id = $1`, [userId]),
      executeQuery(`SELECT id FROM agencies WHERE owner_id = $1`, [userId]),
    ]);

    const escortIds = escortResult.map((r: any) => r.id);
    const agencyIds = agencyResult.map((r: any) => r.id);
    const allProfileIds = [...escortIds, ...agencyIds];

    if (allProfileIds.length === 0) {
      return NextResponse.json({ transactions: [] });
    }

    // Build query with placeholders for profile IDs
    const placeholders = allProfileIds.map((_, i) => `$${i + 1}`).join(", ");
    
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
      WHERE (escort_id IN (${placeholders}) OR agency_id IN (${placeholders}))
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const params = [...allProfileIds, ...allProfileIds];
    const transactions = await executeQuery(query, params);

    // Format for frontend
    const formatted = transactions.map((t: any) => ({
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
    }));

    return NextResponse.json({ transactions: formatted });
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "internal_error", detail: error.message },
      { status: 500 },
    );
  }
}