import crypto from "crypto";
import { executeQuery } from "@/lib/neon";

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!secret || !signature) {
    return new Response(null, { status: 401 });
  }

  const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  if (hash !== signature) {
    return new Response(null, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response(null, { status: 400 });
  }

  if (event?.event === "charge.success") {
    const data = event.data || {};
    const reference = data.reference;
    try {
      const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${secret}` },
      });
      const json = await res.json();
      const tx = json?.data;
      if (tx?.status === "success") {
        const meta = tx.metadata || {};
        await executeQuery(
          `INSERT INTO transactions (checkout_request_id, user_id, amount, currency, status, payment_method, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (checkout_request_id) DO UPDATE SET status = EXCLUDED.status, amount = EXCLUDED.amount`,
          [reference, meta.userId || null, tx.amount, tx.currency, "success", "paystack", JSON.stringify(tx)],
        );
        if (meta.userId && meta.credits) {
          await executeQuery(
            `UPDATE escorts SET credits = COALESCE(credits,0) + $1 WHERE clerk_user_id = $2`,
            [meta.credits, meta.userId],
          );
          await executeQuery(
            `UPDATE agencies SET credits = COALESCE(credits,0) + $1 WHERE owner_id = $2`,
            [meta.credits, meta.userId],
          );
        }
      }
    } catch (e) {
      console.error("Webhook fulfillment error", e);
    }
  }

  return Response.json({ received: true });
}
