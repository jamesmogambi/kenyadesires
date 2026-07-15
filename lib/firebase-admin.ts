import "./polyfill";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import * as fs from "fs";
import * as path from "path";

// ------------------------------------------------------------------
// 1. Read the service account JSON from disk
// ------------------------------------------------------------------
function getFirebaseConfig() {
  const configPath = path.join(process.cwd(), "config", "firebase-admin.json");

  if (!fs.existsSync(configPath)) {
    // In development, show a clear error
    if (process.env.NODE_ENV === "development") {
      throw new Error(
        `Firebase config file not found at ${configPath}.\n` +
          `Please create it manually (copy from your service account JSON).`,
      );
    }
    // In production, it should have been created by the build script
    throw new Error(`Firebase config file not found at ${configPath}`);
  }

  const content = fs.readFileSync(configPath, "utf8");
  const config = JSON.parse(content);

  // The private_key already has \n escapes – replace with actual newlines
  if (config.private_key) {
    config.private_key = config.private_key.replace(/\\n/g, "\n");
  }

  return {
    projectId: config.project_id,
    clientEmail: config.client_email,
    privateKey: config.private_key,
    storageBucket: config.project_id + ".appspot.com", // or use explicit
  };
}

const config = getFirebaseConfig();

// ------------------------------------------------------------------
// 2. Initialize Firebase Admin
// ------------------------------------------------------------------
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

// Collections
const COLLECTIONS = {
  ESCORTS: "escorts",
  IMAGES: "escort_images",
  PROCESSING_QUEUE: "processing_queue",
  PROCESSING_LOGS: "processing_logs",
} as const;

const adminDb = getFirestore(app);
const adminStorage = getStorage(app);
const bucket = adminStorage.bucket(config.storageBucket);

console.log(`[Firebase] Initialized with bucket: ${bucket.name}`);

export { adminDb, COLLECTIONS, adminStorage, bucket };
