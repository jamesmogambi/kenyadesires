import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

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

    // Parse the signature header: "t=timestamp,v1=signature"
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

    // Get the raw body for signature verification
    const rawBody = await req.text();

    // Compute the expected signature
    const payload = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac("sha256", muxSigningSecret)
      .update(payload)
      .digest("hex");

    // Use timing-safe comparison
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

    // Parse the event
    const event = JSON.parse(rawBody);
    const asset = event.data;

    // Only handle asset-ready events
    if (event.type !== "video.asset.ready") {
      return NextResponse.json({ message: "Event ignored" });
    }

    // Extract escort ID from passthrough
    const escortId = asset.passthrough;
    if (!escortId) {
      return NextResponse.json(
        { error: "No passthrough (escort ID) in asset" },
        { status: 400 },
      );
    }

    // Get the playback ID
    const playbackId = asset.playback_ids?.[0]?.id;
    if (!playbackId) {
      return NextResponse.json(
        { error: "No playback ID found" },
        { status: 400 },
      );
    }

    // Update the escort in Firestore
    const escortDoc = await adminDb.collection("escorts").doc(escortId).get();

    if (!escortDoc.exists) {
      return NextResponse.json(
        { error: "Escort not found" },
        { status: 404 },
      );
    }

    const escortData = escortDoc.data();
    const existingVideos = Array.isArray(escortData?.videos)
      ? escortData.videos
      : [];

    // Avoid duplicates
    if (existingVideos.includes(playbackId)) {
      return NextResponse.json({
        message: "Playback ID already exists for this escort",
      });
    }

    await adminDb.collection("escorts").doc(escortId).update({
      videos: [...existingVideos, playbackId],
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: "Video added to escort successfully",
      escortId,
      playbackId,
    });
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
