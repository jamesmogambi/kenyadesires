import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const muxSigningSecret = process.env.MUX_SIGNING_SECRET!;

export async function POST(req: NextRequest) {
  try {
    if (!muxSigningSecret) {
      console.error("MUX_SIGNING_SECRET is not set");
      return NextResponse.json(
        { error: "MUX_SIGNING_SECRET not configured" },
        { status: 500 },
      );
    }

    const signatureHeader = req.headers.get("mux-signature");
    if (!signatureHeader) {
      return NextResponse.json(
        { error: "Missing Mux-Signature header" },
        { status: 400 },
      );
    }

    const parts = signatureHeader.split(",");
    let timestamp = "";
    let receivedSignature = "";

    for (const part of parts) {
      const [key, value] = part.split("=");
      if (key === "t") timestamp = value;
      if (key === "v1") receivedSignature = value;
    }

    if (!timestamp || !receivedSignature) {
      return NextResponse.json(
        { error: "Malformed signature header" },
        { status: 400 },
      );
    }

    const rawBody = await req.text();
    const payload = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac("sha256", muxSigningSecret)
      .update(payload)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
    const receivedBuffer = Buffer.from(receivedSignature, "utf-8");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      console.warn("Mux webhook signature mismatch");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 },
      );
    }

    const event = JSON.parse(rawBody);
    const asset = event.data;

    if (event.type !== "video.asset.ready") {
      return NextResponse.json({ message: "Event ignored" });
    }

    const escortId = asset.passthrough;
    if (!escortId) {
      return NextResponse.json(
        { error: "No passthrough (escort ID) in asset" },
        { status: 400 },
      );
    }

    const playbackId = asset.playback_ids?.[0]?.id;
    if (!playbackId) {
      return NextResponse.json(
        { error: "No playback ID found" },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Not available" }, { status: 503 });
  } catch (error: any) {
    console.error("Mux webhook error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Internal server error",
      },
      { status: 500 },
    );
  }
}
