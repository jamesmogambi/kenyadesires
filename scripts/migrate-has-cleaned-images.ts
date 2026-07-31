import dotenv from "dotenv";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { collection, getDocs, doc, updateDoc, query, orderBy, limit, startAfter, writeBatch } from "firebase/firestore";

dotenv.config({ path: ".env" });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

async function resetAndMigrate() {
  console.log("🚀 Resetting hasCleanedImages and re-running migration...");
  
  let processed = 0;
  let updated = 0;
  let skipped = 0;
  
  const batchSize = 500;
  let lastDoc: any = null;
  
  while (true) {
    let q = query(collection(db, "escorts"), orderBy("__name__"), limit(batchSize));
    
    if (lastDoc) {
      q = query(collection(db, "escorts"), orderBy("__name__"), startAfter(lastDoc), limit(batchSize));
    }
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      break;
    }

    const batch = writeBatch(db);
    
    snapshot.docs.forEach((docSnapshot: any) => {
      const data = docSnapshot.data();
      const imagesMetadata = data.imagesMetadata || {};
      
      const hasCleaned = Object.values(imagesMetadata).some(
        (m: any) => m.cleanedUrl
      );
      
      batch.update(docSnapshot.ref, { hasCleanedImages: hasCleaned });
      
      if (hasCleaned) {
        updated++;
      } else {
        skipped++;
      }
      processed++;
    });
    
    await batch.commit();
    console.log(`   Processed batch: ${processed} total, ${updated} with cleaned images, ${skipped} without`);
    
    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    
    if (snapshot.size < batchSize) {
      break;
    }
  }
  
  console.log("\n✅ Migration completed!");
  console.log(`   Total processed: ${processed}`);
  console.log(`   Updated with hasCleanedImages=true: ${updated}`);
  console.log(`   Set hasCleanedImages=false: ${skipped}`);
}

resetAndMigrate()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
