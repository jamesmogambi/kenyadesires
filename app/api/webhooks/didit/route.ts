import crypto from "node:crypto";
import { NextResponse } from "next/server";

const DIDIT_WEBHOOK_SECRET = process.env.DIDIT_WEBHOOK_SECRET!;
const TIMESTAMP_TOLERANCE = 300;

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function POST(req: Request) {
  const raw = await req.text();

  const sigV2 = req.headers.get("x-signature-v2") ?? "";
  const sigSimple = req.headers.get("x-signature-simple") ?? "";
  const tsHeader = req.headers.get("x-timestamp") ?? "";

  console.log("Didit webhook received", {
    hasSigV2: !!sigV2,
    hasSigSimple: !!sigSimple,
    hasTimestamp: !!tsHeader,
    timestamp: tsHeader,
    rawBodyLength: raw.length,
    rawBody: raw.slice(0, 500),
  });

  const ts = Number(tsHeader);
  if (!ts) {
    console.error("Didit webhook rejected: missing timestamp");
    return new Response("missing timestamp", { status: 400 });
  }
  if (Math.abs(Date.now() / 1000 - ts) > TIMESTAMP_TOLERANCE) {
    console.error("Didit webhook rejected: stale timestamp", {
      serverTime: Date.now() / 1000,
      webhookTime: ts,
      diff: Math.abs(Date.now() / 1000 - ts),
    });
    return new Response("stale", { status: 401 });
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error("Didit webhook rejected: bad json", { raw: raw.slice(0, 500) });
    return new Response("bad json", { status: 400 });
  }

  const eventId = parsed.event_id ?? `${parsed.session_id}:${parsed.webhook_type}:${parsed.timestamp}`;

  if (!parsed.session_id && !parsed.vendor_data) {
    console.error("Didit webhook rejected: missing session_id and vendor_data", { parsed });
    return new Response("missing session_id and vendor_data", { status: 400 });
  }

  let signatureValid = false;

  if (sigV2) {
    const expected = crypto
      .createHmac("sha256", DIDIT_WEBHOOK_SECRET)
      .update(raw, "utf8")
      .digest("hex");
    console.log("Expected Sig:", expected);
    console.log("Received Sig:", sigV2);
    console.log("Timestamp Diff:", Math.abs(Date.now() / 1000 - ts));
    signatureValid = constantTimeCompare(expected, sigV2);
  }

  if (!signatureValid && sigSimple) {
    const payload = `${ts}:${parsed.session_id}:${parsed.status}:${parsed.webhook_type}`;
    const expected = crypto
      .createHmac("sha256", DIDIT_WEBHOOK_SECRET)
      .update(payload, "utf8")
      .digest("hex");
    console.log("Expected Sig (Simple):", expected);
    console.log("Received Sig (Simple):", sigSimple);
    console.log("Simple payload:", payload);
    console.log("Timestamp Diff:", Math.abs(Date.now() / 1000 - ts));
    signatureValid = constantTimeCompare(expected, sigSimple);
  }

  if (!signatureValid) {
    console.error("Didit webhook signature verification failed", {
      event_id: eventId,
      hasSigV2: !!sigV2,
      hasSigSimple: !!sigSimple,
    });
    return new Response("bad signature", { status: 401 });
  }

  return NextResponse.json({ error: "Not available" }, { status: 503 });
}
