import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

function sortTransactions(docs: any[]) {
  return docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || a.createdAt?._seconds * 1000 || 0;
      const bTime = b.createdAt?.toMillis?.() || b.createdAt?._seconds * 1000 || 0;
      return bTime - aTime;
    })
    .slice(0, 50);
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    let snapshot = await adminDb
      .collection("transactions")
      .where("userId", "==", userId)
      .get();

    if (snapshot.empty) {
      const escortSnap = await adminDb
        .collection("escorts")
        .where("clerkUserId", "==", userId)
        .limit(1)
        .get();

      if (!escortSnap.empty) {
        const data = escortSnap.docs[0].data();
        const phone = data?.contact?.phone || data?.contact?.telephone || data?.whatsappPhone;
        if (phone) {
          snapshot = await adminDb
            .collection("transactions")
            .where("phoneNumber", "==", phone.replace(/\D/g, ""))
            .get();
        }
      } else {
        const agencySnap = await adminDb
          .collection("agencies")
          .where("ownerId", "==", userId)
          .limit(1)
          .get();

        if (!agencySnap.empty) {
          const data = agencySnap.docs[0].data();
          const phone = data?.contactPhone;
          if (phone) {
            snapshot = await adminDb
              .collection("transactions")
              .where("phoneNumber", "==", phone.replace(/\D/g, ""))
              .get();
          }
        }
      }
    }

    const transactions = sortTransactions(snapshot.docs);

    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    const message = error.message || "Failed to fetch transactions";
    const needsIndex = message.includes("index") || message.includes("Index");
    return NextResponse.json(
      {
        error: "internal_error",
        detail: needsIndex ? "Firestore index missing. Deploy firestore.indexes.json" : message,
      },
      { status: 500 },
    );
  }
}
