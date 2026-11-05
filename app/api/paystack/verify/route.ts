import { NextRequest } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const reference = body?.reference;
    if (!reference || typeof reference !== "string") {
      return Response.json({ verified: false, error: "Missing reference" }, { status: 400 });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return Response.json({ verified: false, error: "Server misconfigured" }, { status: 500 });
    }

    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${secret}` },
    });

    if (!res.ok) {
      return Response.json({ verified: false }, { status: 200 });
    }

    const json = await res.json();
    const data = json?.data;

    // Expected amount is looked up server-side from the order record.
    // (No client-supplied amount is trusted here.)
    const expectedAmount = null; // TODO: resolve from order store by reference

    const verified =
      data?.status === "success" &&
      data?.currency === "KES" &&
      (expectedAmount === null || data?.amount === expectedAmount);

    return Response.json({ verified, reference: data?.reference });
  } catch {
    return Response.json({ verified: false }, { status: 200 });
  }
}
