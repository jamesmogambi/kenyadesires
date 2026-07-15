import "./polyfill";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// Get the full config from the single JSON environment variable
const getFirebaseConfig = () => {
  const raw = process.env.FIREBASE_ADMIN_CONFIG;
  if (!raw) {
    throw new Error("FIREBASE_ADMIN_CONFIG environment variable is not set");
  }
  try {
    const config = JSON.parse(raw);
    // Replace literal \n sequences with actual newlines for the private key
    if (config.privateKey) {
      config.privateKey = config.privateKey.replace(/\\n/g, "\n");
    }
    return config;
  } catch (err) {
    console.error("Failed to parse FIREBASE_ADMIN_CONFIG", err);
    throw err;
  }
};

const config = getFirebaseConfig();

// Initialize Firebase Admin
const app = !getApps().length
  ? initializeApp({
      credential: cert({
        projectId: config.projectId,
        clientEmail: config.clientEmail,
        privateKey: config.privateKey,
      }),
      storageBucket: config.storageBucket,
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

// Initialize Storage
const adminStorage = getStorage(app);
const bucket = adminStorage.bucket(config.storageBucket);

console.log(`[Firebase] Initialized with bucket: ${bucket.name}`);

export { adminDb, COLLECTIONS, adminStorage, bucket };
