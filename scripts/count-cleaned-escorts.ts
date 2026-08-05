import dotenv from "dotenv";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

dotenv.config({ path: ".env" });

const app = !getApps().length
  ? initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n").replace(/^"|"$/g, ""),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    })
  : getApps()[0];

const adminDb = getFirestore(app);

async function countCleanedEscorts() {
  try {
    let lastDoc: any = null;
    let totalCount = 0;
    let batch = 0;

    while (true) {
      let query = adminDb
        .collection("escorts")
        .where("isActive", "==", true)
        .where("hasCleanedImages", "==", true)
        .select("__name__");

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.limit(500).get();

      if (snapshot.empty) {
        break;
      }

      totalCount += snapshot.size;
      batch++;

      console.log(`Batch ${batch}: ${snapshot.size} docs (total so far: ${totalCount})`);

      lastDoc = snapshot.docs[snapshot.docs.length - 1];

      if (snapshot.size < 500) {
        break;
      }
    }

    console.log(`\n✅ Total cleaned escorts: ${totalCount}`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

countCleanedEscorts();
