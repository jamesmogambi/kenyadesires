import crypto from "crypto";

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
    // Fulfill/activate orders here after full validation.
  }

  return Response.json({ received: true });
}
