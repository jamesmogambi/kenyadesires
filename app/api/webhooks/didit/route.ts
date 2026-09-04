import crypto from "node:crypto";
import { adminDb } from "@/lib/firebase-admin";
import { sendVerificationNotificationEmail } from "@/server-actions/email";
import { awardVerificationCredits } from "@/server-actions/credit-rewards.action";

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

async function processEvent(parsed: any, eventId: string): Promise<void> {
  const {
    session_id,
    webhook_type,
    status,
    vendor_data,
    decision,
    resubmit_info,
    business_session_id,
    session_kind,
  } = parsed;

  if (!vendor_data) return;

  const clerkUserId = vendor_data;

  const verificationRecord = {
    vendor_data: clerkUserId,
    session_id: session_id ?? null,
    business_session_id: business_session_id ?? null,
    webhook_type,
    status,
    decision: decision ?? null,
    processed_at: new Date(),
  };

  await adminDb.collection("kyc_verifications").doc(eventId).set(verificationRecord, { merge: true });

  const isBusiness = session_kind === "business";

  const escortsSnap = await adminDb
    .collection("escorts")
    .where("clerkUserId", "==", clerkUserId)
    .limit(1)
    .get();

  let escortRef: FirebaseFirestore.DocumentReference | null = null;
  let escortData: any = null;
  let escortDocId: string | null = null;
  if (!escortsSnap.empty) {
    const escortDoc = escortsSnap.docs[0];
    escortRef = adminDb.collection("escorts").doc(escortDoc.id);
    escortData = escortDoc.data();
    escortDocId = escortDoc.id;
  }

  let agencyRef: FirebaseFirestore.DocumentReference | null = null;
  let agencyData: any = null;
  let agencyDocId: string | null = null;
  if (isBusiness) {
    const agenciesSnap = await adminDb
      .collection("agencies")
      .where("ownerId", "==", clerkUserId)
      .limit(1)
      .get();

    if (!agenciesSnap.empty) {
      const agencyDoc = agenciesSnap.docs[0];
      agencyRef = adminDb.collection("agencies").doc(agencyDoc.id);
      agencyData = agencyDoc.data();
      agencyDocId = agencyDoc.id;
    }
  }

  switch (status) {
    case "Approved": {
      if (escortRef) {
        await escortRef.update({
          isVerified: true,
          verificationStatus: "verified",
          verifiedAt: new Date(),
        });

        if (decision) {
          await escortRef.update({
            diditDecision: decision,
            idVerificationDocument: decision.id_verifications?.[0]?.document_number ?? null,
          });
        }

        await adminDb.collection("kyc_webhook_events").doc(eventId).set({
          ...parsed,
          processed_at: new Date(),
        });

        await awardVerificationCredits(
          clerkUserId,
          escortData?.email || "",
          escortData?.telephone || escortData?.whatsappPhone || "",
          "escort",
          escortDocId || "",
        );

        if (escortData?.email) {
          await sendVerificationNotificationEmail(
            escortData.email,
            escortData.name || "there",
            "Approved",
            decision ? JSON.stringify(decision) : null,
            50,
            "escort",
          );
        }
      }

      if (agencyRef) {
        await agencyRef.update({
          isVerified: true,
          verificationStatus: "verified",
          verifiedAt: new Date(),
        });

        if (decision) {
          await agencyRef.update({
            diditDecision: decision,
            idVerificationDocument: decision.id_verifications?.[0]?.document_number ?? null,
          });
        }

        await awardVerificationCredits(
          clerkUserId,
          agencyData?.contactEmail || "",
          agencyData?.contactPhone || agencyData?.whatsappPhone || "",
          "agency",
          agencyDocId || "",
        );

        if (agencyData?.contactEmail) {
          await sendVerificationNotificationEmail(
            agencyData.contactEmail,
            agencyData.name || "there",
            "Approved",
            decision ? JSON.stringify(decision) : null,
            50,
            "agency",
          );
        }
      }
      break;
    }

    case "Declined": {
      if (escortRef) {
        await escortRef.update({
          isVerified: false,
          verificationStatus: "rejected",
          rejectedAt: new Date(),
        });

        if (decision?.warnings) {
          await escortRef.update({
            verificationWarnings: decision.warnings,
          });
        }

        if (escortData?.email) {
          await sendVerificationNotificationEmail(
            escortData.email,
            escortData.name || "there",
            "Declined",
            decision?.warnings ? JSON.stringify(decision.warnings) : null,
            0,
            "escort",
          );
        }
      }

      if (isBusiness && agencyRef) {
        await agencyRef.update({
          isVerified: false,
          verificationStatus: "rejected",
          rejectedAt: new Date(),
        });

        if (agencyData?.contactEmail) {
          await sendVerificationNotificationEmail(
            agencyData.contactEmail,
            agencyData.name || "there",
            "Declined",
            decision?.warnings ? JSON.stringify(decision.warnings) : null,
            0,
            "agency",
          );
        }
      }
      break;
    }

    case "In Review": {
      if (escortRef) {
        await escortRef.update({
          verificationStatus: "pending_review",
        });
      }
      if (isBusiness && agencyRef) {
        await agencyRef.update({
          verificationStatus: "pending_review",
        });
      }
      break;
    }

    case "In Progress": {
      if (escortRef) {
        await escortRef.update({
          verificationStatus: "in_progress",
        });
      }
      if (isBusiness && agencyRef) {
        await agencyRef.update({
          verificationStatus: "in_progress",
        });
      }
      break;
    }

    case "Resubmitted": {
      if (escortRef) {
        await escortRef.update({
          verificationStatus: "resubmitted",
          resubmittedAt: new Date(),
        });
      }

      if (resubmit_info) {
        await adminDb.collection("kyc_resubmissions").doc(eventId).set({
          event_id: eventId,
          clerkUserId,
          resubmit_info,
          created_at: new Date(),
        });
      }
      break;
    }

    case "Abandoned": {
      if (escortRef) {
        await escortRef.update({
          verificationStatus: "abandoned",
          abandonedAt: new Date(),
        });
      }
      if (isBusiness && agencyRef) {
        await agencyRef.update({
          verificationStatus: "abandoned",
          abandonedAt: new Date(),
        });
      }
      break;
    }

    case "Expired":
    case "KYC Expired": {
      if (escortRef) {
        await escortRef.update({
          verificationStatus: "expired",
          expiredAt: new Date(),
        });
      }
      if (isBusiness && agencyRef) {
        await agencyRef.update({
          verificationStatus: "expired",
          expiredAt: new Date(),
        });
      }
      break;
    }

    case "Not Started": {
      if (escortRef) {
        await escortRef.update({
          verificationStatus: "not_started",
        });
      }
      if (isBusiness && agencyRef) {
        await agencyRef.update({
          verificationStatus: "not_started",
        });
      }
      break;
    }

    default:
      break;
  }
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

  const existing = await adminDb
    .collection("kyc_webhook_events")
    .doc(eventId)
    .get();

  if (existing.exists) {
    return new Response("ok");
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

  await adminDb.collection("kyc_webhook_events").doc(eventId).set({
    ...parsed,
    processed_at: new Date(),
  });

  processEvent(parsed, eventId).catch((err) => {
    console.error("Didit webhook processing error", {
      event_id: eventId,
      error: err.message,
    });
  });

  console.log("Didit webhook processed successfully", {
    event_id: eventId,
    webhook_type: parsed.webhook_type,
    status: parsed.status,
  });

  return new Response("ok");
}