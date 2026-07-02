import "./polyfill";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin with environment variables
const app = !getApps().length
  ? initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY
          ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(
              /\\n/g,
              "\n",
            ).replace(/^"|"$/g, "")
          : undefined,
      }),
    })
  : getApps()[0];

// Firestore Collections
const COLLECTIONS = {
  ESCORTS: "escorts",
  IMAGES: "escort_images",
  PROCESSING_QUEUE: "processing_queue",
  PROCESSING_LOGS: "processing_logs",
} as const;
const adminDb = getFirestore(app);

export { adminDb, COLLECTIONS };
