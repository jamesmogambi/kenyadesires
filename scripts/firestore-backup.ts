// scripts/firestore-backup.ts
//
// Backs up all Firestore collections (and their subcollections) from the
// source project to a backup destination.
//
// Usage:
//   npx tsx scripts/firestore-backup.ts                             # live copy to destination
//   npx tsx scripts/firestore-backup.ts --dry-run                   # preview only (no writes)
//   npx tsx scripts/firestore-backup.ts --export                    # export to local JSON files
//   npx tsx scripts/firestore-backup.ts --collections escorts,agencies   # target specific collections
//   npx tsx scripts/firestore-backup.ts --env=production            # use .env.production for source
//
// Modes:
//   --dry-run   Lists all collections and doc counts. Does not initialize the destination.
//   --export    Writes each collection to backup-exports/<collection>.json in the project root.
//   (default)   Copies data live from source → destination Firestore (requires backup credentials).
//
// Env vars:
//   Source:   the existing FIREBASE_ADMIN_* vars (from .env.development or .env.production)
//   Destination: BACKUP_FIREBASE_PROJECT_ID, BACKUP_FIREBASE_CLIENT_EMAIL, BACKUP_FIREBASE_PRIVATE_KEY
//   Web config:  BACKUP_FIREBASE_API_KEY, BACKUP_FIREBASE_PROJECT_ID, etc. (in .env.backup)

import { initializeApp, cert, getApps } from "firebase-admin/app";
import {
  getFirestore,
  Timestamp,
  GeoPoint,
  DocumentReference,
  type DocumentData,
  type CollectionReference,
  type Firestore,
} from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// ── Load environment ───────────────────────────────────────────────
const args = process.argv.slice(2);
const envFlag = args.find((a) => a.startsWith("--env="));
const envName = envFlag ? envFlag.split("=")[1] : "development";
const envFile = `.env.${envName}`;
dotenv.config({ path: envFile });
// Also load .env.local if present (overrides)
dotenv.config({ path: ".env.local" });
// Also load backup-specific credentials (if .env.backup exists)
const backupEnvPath = path.join(process.cwd(), ".env.backup");
if (fs.existsSync(backupEnvPath)) {
  dotenv.config({ path: backupEnvPath });
}

// ── Initialize SOURCE Firestore (existing project) ─────────────────
const sourceApp = !getApps().length
  ? initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY
          ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n")
          : undefined,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    })
  : getApps()[0];

const sourceDb: Firestore = getFirestore(sourceApp);

// ── Initialize DESTINATION Firestore (backup project) ───────────────
// Only initialized when doing a live copy (not dry-run, not export)
let destDb: Firestore | null = null;

function initDestination(): Firestore {
  if (destDb) return destDb;

  const backupProjectId = process.env.BACKUP_FIREBASE_PROJECT_ID;
  if (!backupProjectId) {
    throw new Error(
      "Missing BACKUP_FIREBASE_PROJECT_ID. Add it to .env.backup.",
    );
  }

  const clientEmail = process.env.BACKUP_FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.BACKUP_FIREBASE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Missing BACKUP_FIREBASE_CLIENT_EMAIL or BACKUP_FIREBASE_PRIVATE_KEY.\n" +
        "  1. Go to Firebase Console > whatsapp-campaign-xxx > Project Settings > Service Accounts\n" +
        "  2. Click 'Generate new private key' and download the JSON.\n" +
        "  3. Paste the client_email and private_key into .env.backup",
    );
  }

  const destAppName = "backup-dest";
  try {
    const destApp =
      getApps().find((a) => a.name === destAppName) ??
      initializeApp(
        {
          credential: cert({
            projectId: backupProjectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, "\n"),
          }),
        },
        destAppName,
      );

    destDb = getFirestore(destApp);
    return destDb;
  } catch (err: any) {
    throw new Error(
      `Failed to initialize destination Firebase Admin (${backupProjectId}).\n` +
        `  Error: ${err.message || err}`,
    );
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

const BATCH_LIMIT = 450; // Firestore batch max is 500; leave headroom

interface CopyStats {
  collections: number;
  documents: number;
  subcollections: number;
  errors: string[];
  skipped: string[];
}

function serializeValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;

  if (value instanceof Timestamp) return value.toDate();

  if (value instanceof GeoPoint) {
    return { _geo: true, lat: value.latitude, lng: value.longitude };
  }

  if (value instanceof DocumentReference) {
    return { _ref: true, path: value.path };
  }

  if (value instanceof Date) return value;

  if (Array.isArray(value)) return value.map(serializeValue);

  if (typeof value === "object" && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = serializeValue(val);
    }
    return result;
  }

  return value;
}

function deserializeValue(value: unknown, dest: Firestore): unknown {
  if (value === null || value === undefined) return null;

  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;

    if (obj._geo === true) {
      return new GeoPoint(Number(obj.lat), Number(obj.lng));
    }

    if (obj._ref === true) {
      return dest.doc(String(obj.path || ""));
    }

    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = deserializeValue(val, dest);
    }
    return result;
  }

  if (Array.isArray(value)) {
    return value.map((v) => deserializeValue(v, dest));
  }

  return value;
}

// Serialize a doc's data to plain JSON (for export)
function docToJSON(data: DocumentData): Record<string, unknown> {
  return serializeValue(data) as Record<string, unknown>;
}

// ── Core copy logic ────────────────────────────────────────────────

interface CollectionInfo {
  id: string;
  docCount: number;
  subcollections: CollectionInfo[];
}

async function scanCollection(
  col: CollectionReference,
  depth = 0,
): Promise<CollectionInfo> {
  const snapshot = await col.get();
  const info: CollectionInfo = {
    id: col.id,
    docCount: snapshot.size,
    subcollections: [],
  };

  if (snapshot.empty) return info;

  // Only scan subcollections of the first few docs to avoid excessive reads
  const sampleDocs = snapshot.docs.slice(0, Math.min(snapshot.size, 5));
  for (const docSnap of sampleDocs) {
    const docRef = col.doc(docSnap.id);
    const subcols = await docRef.listCollections();
    for (const subcol of subcols) {
      info.subcollections.push(await scanCollection(subcol, depth + 1));
    }
  }

  return info;
}

async function scanAndPrint(
  srcCol: CollectionReference,
  stats: CopyStats,
  depth = 0,
): Promise<void> {
  const indent = "  ".repeat(depth);
  const snapshot = await srcCol.get();

  if (snapshot.empty) {
    console.log(`${indent}📁 ${srcCol.id} — (empty, skipped)`);
    return;
  }

  console.log(`${indent}📁 ${srcCol.id} — ${snapshot.size} documents`);
  stats.collections++;
  stats.documents += snapshot.size;

  // Recurse into subcollections
  for (const docSnap of snapshot.docs) {
    const srcDocRef = srcCol.doc(docSnap.id);
    const subcollections = await srcDocRef.listCollections();
    for (const subcol of subcollections) {
      stats.subcollections++;
      await scanAndPrint(subcol, stats, depth + 1);
    }
  }
}

async function copyCollection(
  srcCol: CollectionReference,
  destCol: CollectionReference,
  stats: CopyStats,
  dryRun = false,
  depth = 0,
): Promise<void> {
  const indent = "  ".repeat(depth);
  console.log(`${indent}📁 ${srcCol.id} (${dryRun ? "DRY RUN" : "COPYING"}...)`);

  const snapshot = await srcCol.get();
  if (snapshot.empty) {
    console.log(`${indent}   (empty – skipped)`);
    return;
  }

  stats.collections++;
  let batch = dryRun ? null : destDb!.batch();
  let batchCount = 0;

  for (const docSnap of snapshot.docs) {
    stats.documents++;

    if (dryRun) continue;

    const docData = docToJSON(docSnap.data());
    const destDocRef = destCol.doc(docSnap.id);

    batch!.set(
      destDocRef,
      deserializeValue(docData, destDb!) as DocumentData,
    );

    batchCount++;
    if (batchCount >= BATCH_LIMIT) {
      await batch!.commit();
      batch = destDb!.batch();
      batchCount = 0;
    }
  }

  if (!dryRun && batchCount > 0) {
    await batch!.commit();
  }

  console.log(`${indent}   📄 ${snapshot.size} documents`);

  // Recurse into subcollections
  for (const docSnap of snapshot.docs) {
    const srcDocRef = srcCol.doc(docSnap.id);
    const subcollections = await srcDocRef.listCollections();
    for (const subcol of subcollections) {
      stats.subcollections++;
      const destDocRef = destCol.doc(docSnap.id);
      await copyCollection(
        subcol,
        destDocRef.collection(subcol.id),
        stats,
        dryRun,
        depth + 1,
      );
    }
  }
}

// Export a collection (and subcollections) to JSON
async function exportCollection(
  srcCol: CollectionReference,
  exportDir: string,
  stats: CopyStats,
  depth = 0,
): Promise<void> {
  const indent = "  ".repeat(depth);
  console.log(`${indent}📁 Exporting ${srcCol.id}...`);

  const snapshot = await srcCol.get();
  if (snapshot.empty) {
    console.log(`${indent}   (empty – skipped)`);
    return;
  }

  stats.collections++;
  stats.documents += snapshot.size;

  const docs: Array<{ id: string; data: unknown }> = [];
  for (const docSnap of snapshot.docs) {
    docs.push({ id: docSnap.id, data: docToJSON(docSnap.data()) });
  }

  // Write to JSON file
  const colDir = path.join(exportDir, srcCol.id);
  fs.mkdirSync(colDir, { recursive: true });
  const filePath = path.join(colDir, "docs.json");
  fs.writeFileSync(filePath, JSON.stringify(docs, null, 2));
  console.log(`${indent}   📄 ${snapshot.size} documents → ${filePath}`);

  // Recurse into subcollections
  for (const docSnap of snapshot.docs) {
    const docRef = srcCol.doc(docSnap.id);
    const subcollections = await docRef.listCollections();
    for (const subcol of subcollections) {
      stats.subcollections++;
      const subExportDir = path.join(colDir, docSnap.id);
      await exportCollection(subcol, subExportDir, stats, depth + 1);
    }
  }
}

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  const dryRun = args.includes("--dry-run");
  const exportMode = args.includes("--export");
  const collectionsArg = args.find((a) => a.startsWith("--collections="));
  const onlyCollections = collectionsArg
    ? collectionsArg.split("=")[1].split(",")
    : null;

  const mode = dryRun ? "DRY RUN" : exportMode ? "EXPORT TO JSON" : "LIVE COPY";

  console.log("=".repeat(70));
  console.log(`[Firestore Backup] ${mode}`);
  console.log("=".repeat(70));

  const sourceProjectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID || "kenyadivas-ffc51";
  const backupProjectId =
    process.env.BACKUP_FIREBASE_PROJECT_ID || "(not configured)";

  console.log(`Source:      ${sourceProjectId}`);
  console.log(`Destination: ${backupProjectId}`);
  console.log(
    `Collections: ${onlyCollections ? onlyCollections.join(", ") : "ALL"}`,
  );
  console.log("=".repeat(70));

  // Verify source connection
  const collections = await sourceDb.listCollections();
  console.log(`\n🔍 Found ${collections.length} top-level collections:`);
  for (const c of collections) {
    console.log(`  • ${c.id}`);
  }
  console.log();

  // Filter if --collections specified
  const toProcess = onlyCollections
    ? collections.filter((c) => onlyCollections.includes(c.id))
    : collections;

  if (toProcess.length === 0) {
    console.log("No collections found to process.");
    return;
  }

  const stats: CopyStats = {
    collections: 0,
    documents: 0,
    subcollections: 0,
    errors: [],
    skipped: [],
  };

  // ── Live copy mode: init destination ──
  if (!dryRun && !exportMode) {
    try {
      initDestination();
      console.log("✅ Destination connected.\n");
    } catch (err: any) {
      console.error(`❌ ${err.message}\n`);
      console.error(
        "💡 Tip: Use --dry-run or --export to proceed without destination credentials.",
      );
      process.exit(1);
    }
  }

  // ── Export mode: init output directory ──
  const exportDir = path.join(process.cwd(), "backup-exports");
  if (exportMode) {
    fs.mkdirSync(exportDir, { recursive: true });
    console.log(`📁 Export directory: ${exportDir}\n`);
  }

  // ── Process collections ──
  for (const srcCol of toProcess) {
    try {
      if (exportMode) {
        await exportCollection(srcCol, exportDir, stats);
      } else if (dryRun) {
        await scanAndPrint(srcCol, stats);
      } else {
        const destCol = destDb!.collection(srcCol.id);
        await copyCollection(srcCol, destCol, stats, dryRun);
      }
    } catch (err: any) {
      const msg = `Failed ${srcCol.id}: ${err.message || err}`;
      console.error(`  ❌ ${msg}`);
      stats.errors.push(msg);
    }
  }

  // ── Summary ──
  console.log("\n" + "=".repeat(70));
  console.log("[Firestore Backup] Summary");
  console.log("=".repeat(70));
  console.log(`  Collections:     ${stats.collections}`);
  console.log(`  Documents:       ${stats.documents}`);
  console.log(`  Subcollections:  ${stats.subcollections}`);
  console.log(`  Errors:          ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log("\n  Error details:");
    stats.errors.forEach((e) => console.log(`    - ${e}`));
  }

  if (exportMode) {
    console.log(`\n📁 Files saved in: ${exportDir}/`);
    console.log(
      "   These can be imported to the destination using the --import flag (coming soon,",
    );
    console.log(
      "   or use firebase firestore:import with the exported JSON).",
    );
  }

  console.log("=".repeat(70));

  if (stats.errors.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("[Firestore Backup] Fatal:", err);
  process.exit(1);
});
