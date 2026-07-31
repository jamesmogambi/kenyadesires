import dotenv from "dotenv";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { collection, getDocs, query, orderBy, limit, startAfter } from "firebase/firestore";

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

async function diagnoseAll() {
  console.log("🔍 Deep scan of ALL escorts for any cleaned images...");
  
  let processed = 0;
  let withMetadata = 0;
  let withAnyCleanedUrl = 0;
  let withStatusCompleted = 0;
  let withCleanedUrlNoCompleted = 0;
  let withCleanedBy = 0;
  const examples: any[] = [];
  
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

    snapshot.docs.forEach((docSnapshot: any) => {
      const data = docSnapshot.data();
      const imagesMetadata = data.imagesMetadata || {};
      const keys = Object.keys(imagesMetadata);
      
      if (keys.length > 0) {
        withMetadata++;
        
        let hasAnyCleanedUrl = false;
        let hasCompleted = false;
        let hasCleanedUrlNoCompleted = false;
        let hasCleanedBy = false;
        
        for (const [url, m] of Object.entries(imagesMetadata)) {
          const meta = m as any;
          if (meta.cleanedUrl) {
            hasAnyCleanedUrl = true;
            if (meta.status !== "completed") {
              hasCleanedUrlNoCompleted = true;
              if (examples.length < 5) {
                examples.push({ id: docSnapshot.id, url: url.substring(0, 60), status: meta.status, cleanedBy: meta.cleanedBy });
              }
            }
          }
          if (meta.status === "completed") hasCompleted = true;
          if (meta.cleanedBy) hasCleanedBy = true;
        }
        
        if (hasAnyCleanedUrl) withAnyCleanedUrl++;
        if (hasCompleted) withStatusCompleted++;
        if (hasCleanedUrlNoCompleted) withCleanedUrlNoCompleted++;
        if (hasCleanedBy) withCleanedBy++;
      }
      processed++;
    });
    
    console.log(`   Scanned: ${processed}`);
    
    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    
    if (snapshot.size < batchSize) {
      break;
    }
  }
  
  console.log("\n📊 Full dataset stats:");
  console.log(`   Total escorts: ${processed}`);
  console.log(`   With imagesMetadata: ${withMetadata}`);
  console.log(`   With any cleanedUrl: ${withAnyCleanedUrl}`);
  console.log(`   With status=completed: ${withStatusCompleted}`);
  console.log(`   With cleanedUrl but status!==completed: ${withCleanedUrlNoCompleted}`);
  console.log(`   With cleanedBy field: ${withCleanedBy}`);
  
  if (examples.length > 0) {
    console.log(`\n⚠️ Examples of cleanedUrl without completed status:`);
    examples.forEach(e => console.log(`   - ${e.id}: status=${e.status}, cleanedBy=${e.cleanedBy}`));
  } else {
    console.log("\n✅ No examples found!");
  }
}

diagnoseAll()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Diagnosis failed:", err);
    process.exit(1);
  });
