import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    let snapshot = await adminDb
      .collection("transactions")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(50)
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
          const phoneSnap = await adminDb
            .collection("transactions")
            .where("phoneNumber", "==", phone.replace(/\D/g, ""))
            .orderBy("createdAt", "desc")
            .limit(50)
            .get();
          snapshot = phoneSnap;
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
            const phoneSnap = await adminDb
              .collection("transactions")
              .where("phoneNumber", "==", phone.replace(/\D/g, ""))
              .orderBy("createdAt", "desc")
              .limit(50)
              .get();
            snapshot = phoneSnap;
          }
        }
      }
    }

    const transactions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

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
