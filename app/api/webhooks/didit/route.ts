import crypto from "node:crypto";
import { adminDb } from "@/lib/firebase-admin";

function shortenFloats(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(shortenFloats);
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, x]) => [
        k,
        shortenFloats(x),
      ]),
    );
  }
  if (typeof v === "number" && !Number.isInteger(v) && v % 1 === 0) {
    return Math.trunc(v);
  }
  return v;
}

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    return Object.keys(v as object)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortKeys((v as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return v;
}

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-signature-v2") ?? "";
  const ts = Number(req.headers.get("x-timestamp"));

  if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) {
    return new Response("stale", { status: 401 });
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const canonical = JSON.stringify(sortKeys(shortenFloats(parsed)));

  const expected = crypto
    .createHmac("sha256", process.env.DIDIT_WEBHOOK_SECRET!)
    .update(canonical, "utf8")
    .digest("hex");

  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  ) {
    return new Response("bad sig", { status: 401 });
  }

  if (!parsed.event_id) {
    return new Response("missing event_id", { status: 400 });
  }

  const existing = await adminDb
    .collection("kyc_webhook_events")
    .doc(parsed.event_id)
    .get();

  if (existing.exists) {
    return new Response("ok");
  }

  await adminDb.collection("kyc_webhook_events").doc(parsed.event_id).set({
    ...parsed,
    processed_at: new Date(),
  });

  const vendorData = parsed.vendor_data;

  switch (parsed.status) {
    case "Approved": {
      await adminDb.collection("kyc_verifications").doc(vendorData).set(
        {
          vendor_data: vendorData,
          status: "approved",
          decision: parsed.decision,
          verified_at: new Date(),
          updated_at: new Date(),
        },
        { merge: true },
      );

      const escortSnap = await adminDb
        .collection("escorts")
        .where("clerkUserId", "==", vendorData)
        .limit(1)
        .get();

      if (!escortSnap.empty) {
        await escortSnap.docs[0].ref.update({
          isVerified: true,
          verificationStatus: "verified",
          verificationDocuments: {
            idProof: parsed.decision?.id_verifications?.[0]?.document_number,
          },
        });
      }

      const agencySnap = await adminDb
        .collection("agencies")
        .where("ownerId", "==", vendorData)
        .limit(1)
        .get();

      if (!agencySnap.empty) {
        await agencySnap.docs[0].ref.update({
          isVerified: true,
          verificationStatus: "verified",
        });
      }
      break;
    }

    case "Declined": {
      await adminDb.collection("kyc_verifications").doc(vendorData).set(
        {
          vendor_data: vendorData,
          status: "declined",
          decision: parsed.decision,
          updated_at: new Date(),
        },
        { merge: true },
      );

      const escortSnap = await adminDb
        .collection("escorts")
        .where("clerkUserId", "==", vendorData)
        .limit(1)
        .get();

      if (!escortSnap.empty) {
        await escortSnap.docs[0].ref.update({
          isVerified: false,
          verificationStatus: "rejected",
        });
      }
      break;
    }

    case "In Review": {
      await adminDb.collection("kyc_verifications").doc(vendorData).set(
        {
          vendor_data: vendorData,
          status: "pending_review",
          updated_at: new Date(),
        },
        { merge: true },
      );
      break;
    }

    case "Kyc Expired": {
      await adminDb.collection("kyc_verifications").doc(vendorData).set(
        {
          vendor_data: vendorData,
          status: "expired",
          updated_at: new Date(),
        },
        { merge: true },
      );
      break;
    }

    default:
      break;
  }

  return new Response("ok");
}
