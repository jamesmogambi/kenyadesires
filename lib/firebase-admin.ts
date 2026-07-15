import "./polyfill";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// Decode the URL‑encoded private key
const getPrivateKey = () => {
  const encoded = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!encoded) {
    console.warn("FIREBASE_ADMIN_PRIVATE_KEY is not set");
    return undefined;
  }
  try {
    return decodeURIComponent(encoded);
  } catch (err) {
    console.error("Failed to decode FIREBASE_ADMIN_PRIVATE_KEY", err);
    return undefined;
  }
};

// Initialize Firebase Admin with environment variables
const app = !getApps().length
  ? initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: getPrivateKey(),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    })
  : getApps()[0];

// Firestore Collections
const COLLECTIONS = {
  ESCORTS: "escorts",
  IMAGES: "escort_images",
  PROCESSING_QUEUE: "processing_queue",
  PROCESSING_LOGS: "processing_logs",
} as const;

// Initialize Firestore
const adminDb = getFirestore(app);

// Initialize Storage with explicit bucket name from environment
const adminStorage = getStorage(app);
const bucket = adminStorage.bucket(process.env.FIREBASE_STORAGE_BUCKET);

console.log(`[Firebase] Initialized with bucket: ${bucket.name}`);

export { adminDb, COLLECTIONS, adminStorage, bucket };
