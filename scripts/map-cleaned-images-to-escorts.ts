// scripts/map-cleaned-images-to-escorts.ts
//
// Maps cleaned images stored in the Firebase Storage `cleaned_images/` folder
// to their respective escort documents in Firestore. Identifies lost or
// corrupted links where a storage file has no matching Firestore entry or
// vice versa.
//
// Usage:
//   npm run map-cleaned-images                           # scan and write cleanedImages to Firestore
//   npm run map-cleaned-images -- --dry-run               # report only, no writes
//   npm run map-cleaned-images -- --escort-id=abc123     # single escort
//   npm run map-cleaned-images -- --limit=100             # limit escorts to write
//   npm run map-cleaned-images -- --no-write              # scan only, no Firestore writes, still saves JSON
//
// File path format in storage:
//   cleaned_images/{sanitizedEscortId}/{timestamp}_{random}.jpg
//
// Firestore stores the cleaned URL in:
//   imagesMetadata[originalImageUrl].cleanedUrl
//
// After mapping, the script writes a `cleanedImages` string array to each
// escort document containing the GCS URLs of all cleaned images that belong
// to that escort.
//
// Escort IDs are sanitized on write: id.replace(/[^a-zA-Z0-9-]/g, "_")

import { cert, getApps, initializeApp } from "firebase-admin/app";
import {
  getFirestore,
  type CollectionReference,
} from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.development" });

const app = !getApps().length
  ? initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY
          ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n").replace(/^"|"$/g, "")
          : undefined,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    })
  : getApps()[0];

const adminDb = getFirestore(app);
const adminStorage = getStorage(app);
const bucket = adminStorage.bucket(process.env.FIREBASE_STORAGE_BUCKET);

const STORAGE_PREFIX = "cleaned_images/";

interface StorageFileInfo {
  name: string;
  sanitizedEscortId: string;
  gcsPublicUrl: string;
}

interface FirestoreMetadataInfo {
  escortId: string;
  escortName: string;
  originalUrl: string;
  cleanedUrl: string;
  status: string;
}

interface MappingReport {
  totalStorageFiles: number;
  totalFirestoreRefs: number;
  matched: Array<{
    file: string;
    escortId: string;
    escortName: string;
    originalUrl: string;
    cleanedUrl: string;
  }>;
  orphanedFiles: StorageFileInfo[];
  corruptedLinks: Array<{
    escortId: string;
    escortName: string;
    originalUrl: string;
    cleanedUrl: string;
    issue: string;
  }>;
  escortsWithCleanedImages: number;
  escortCleanedImages: Array<{
    escortId: string;
    escortName: string;
    cleanedImages: string[];
  }>;
}

function sanitizeEscortId(id: string): string {
  return id.replace(/[^a-zA-Z0-9-]/g, "_");
}

async function listStorageFiles(prefix: string): Promise<StorageFileInfo[]> {
  const files: StorageFileInfo[] = [];
  let pageToken: string | undefined;

  do {
    const [batch, nextPage] = await bucket.getFiles({
      prefix,
      pageToken,
      maxResults: 1000,
    });

    for (const file of batch) {
      const parts = file.name.slice(prefix.length).split("/");

      if (parts.length < 2) continue;

      const sanitizedEscortId = parts[0];
      const gcsPublicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

      files.push({
        name: file.name,
        sanitizedEscortId,
        gcsPublicUrl,
      });
    }

    pageToken = (nextPage as any)?.pageToken;
  } while (pageToken);

  return files;
}

async function fetchFirestoreCleanedUrls(escortIdFilter?: string): Promise<FirestoreMetadataInfo[]> {
  const refs: FirestoreMetadataInfo[] = [];
  const batchSize = 500;
  let lastDoc: any = null;

  while (true) {
    let query: CollectionReference<any> | any = adminDb
      .collection("escorts")
      .where("hasCleanedImages", "==", true)
      .select("name", "imagesMetadata");

    if (escortIdFilter) {
      const doc = await adminDb.collection("escorts").doc(escortIdFilter).get();
      if (!doc.exists) {
        console.warn(`⚠️  Escort ${escortIdFilter} not found in Firestore`);
        return [];
      }
      const data = doc.data();
      const metadata = data?.imagesMetadata || {};
      const name = data?.name || "Unknown";

      for (const [originalUrl, meta] of Object.entries(metadata)) {
        const m = meta as any;
        if (m?.cleanedUrl) {
          refs.push({
            escortId: doc.id,
            escortName: name,
            originalUrl,
            cleanedUrl: m.cleanedUrl,
            status: m.status || "unknown",
          });
        }
      }
      return refs;
    }

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.limit(batchSize).get();

    if (snapshot.empty) break;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const metadata: Record<string, any> = data.imagesMetadata || {};

      for (const [originalUrl, meta] of Object.entries(metadata)) {
        if (meta?.cleanedUrl) {
          refs.push({
            escortId: doc.id,
            escortName: data.name || "Unknown",
            originalUrl,
            cleanedUrl: meta.cleanedUrl,
            status: meta.status || "unknown",
          });
        }
      }
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1];

    if (snapshot.size < batchSize) break;
  }

  return refs;
}

interface EscortIdentifier {
  escortId: string;
  name: string;
  slug?: string;
  username?: string;
}

async function buildSanitizedIdToEscortMap(): Promise<Map<string, EscortIdentifier[]>> {
  const map = new Map<string, EscortIdentifier[]>();
  const batchSize = 1000;
  let lastDoc: any = null;

  while (true) {
    let query = adminDb
      .collection("escorts")
      .select("name", "slug", "username")
      .limit(batchSize);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();

    if (snapshot.empty) break;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const identifiers: EscortIdentifier[] = [
        { escortId: doc.id, name: data.name || "", slug: data.slug, username: data.username },
      ];

      const sanitizedDocId = sanitizeEscortId(doc.id);
      addOrUpdate(map, sanitizedDocId, identifiers[0]);

      if (data.slug) {
        addOrUpdate(map, sanitizeEscortId(data.slug), identifiers[0]);
      }

      if (data.username) {
        addOrUpdate(map, sanitizeEscortId(data.username), identifiers[0]);
      }
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1];

    if (snapshot.size < batchSize) break;
  }

  return map;
}

function addOrUpdate(
  map: Map<string, EscortIdentifier[]>,
  key: string,
  info: EscortIdentifier,
): void {
  if (!map.has(key)) {
    map.set(key, []);
  }
  const arr = map.get(key)!;
  if (!arr.some((e) => e.escortId === info.escortId)) {
    arr.push(info);
  }
}

async function mapCleanedImages(escortIdFilter?: string): Promise<MappingReport> {
  console.log("=".repeat(70));
  console.log("[Map Cleaned Images] Starting scan...");

  if (escortIdFilter) {
    console.log(`🎯 Escort ID filter: ${escortIdFilter}`);
  }

  console.log(`📦 Listing files from Firebase Storage prefix: ${STORAGE_PREFIX}`);

  const storageFiles = await listStorageFiles(STORAGE_PREFIX);
  console.log(`📁 Found ${storageFiles.length} files in storage`);

  if (storageFiles.length === 0) {
    console.log("ℹ️  No cleaned images found in storage.");
    return {
      totalStorageFiles: 0,
      totalFirestoreRefs: 0,
      matched: [],
      orphanedFiles: [],
      corruptedLinks: [],
      escortsWithCleanedImages: 0,
      escortCleanedImages: [],
    };
  }

  console.log(`📚 Fetching Firestore metadata (hasCleanedImages == true)`);

  const firestoreRefs = await fetchFirestoreCleanedUrls(escortIdFilter);
  console.log(`📄 Found ${firestoreRefs.length} cleanedUrl references in Firestore`);

  const sanitizedIdToEscorts = await buildSanitizedIdToEscortMap();
  console.log(`🗺️  Built identifier map for ${sanitizedIdToEscorts.size} sanitized IDs`);

  const report: MappingReport = {
    totalStorageFiles: storageFiles.length,
    totalFirestoreRefs: firestoreRefs.length,
    matched: [],
    orphanedFiles: [],
    corruptedLinks: [],
    escortsWithCleanedImages: new Set(firestoreRefs.map((r) => r.escortId)).size,
    escortCleanedImages: [],
  };

  const matchedFileNames = new Set<string>();
  const matchedFirestoreUrls = new Set<string>();

  for (const file of storageFiles) {
    const gcsUrl = file.gcsPublicUrl;

    const exactMatch = firestoreRefs.find((r) => r.cleanedUrl === gcsUrl);

    if (exactMatch) {
      report.matched.push({
        file: file.name,
        escortId: exactMatch.escortId,
        escortName: exactMatch.escortName,
        originalUrl: exactMatch.originalUrl,
        cleanedUrl: exactMatch.cleanedUrl,
      });
      matchedFileNames.add(file.name);
      matchedFirestoreUrls.add(exactMatch.cleanedUrl);
      continue;
    }

    if (escortIdFilter) {
      if (sanitizeEscortId(escortIdFilter) === file.sanitizedEscortId) {
        const existingRef = firestoreRefs[0];
        report.matched.push({
          file: file.name,
          escortId: existingRef.escortId,
          escortName: existingRef.escortName,
          originalUrl: existingRef.originalUrl,
          cleanedUrl: existingRef.cleanedUrl,
        });
        matchedFileNames.add(file.name);
        matchedFirestoreUrls.add(existingRef.cleanedUrl);
        continue;
      }
    }

    const matchingEscorts = sanitizedIdToEscorts.get(file.sanitizedEscortId);

    if (matchingEscorts && matchingEscorts.length > 0) {
      const matchingRefs = firestoreRefs.filter((r) =>
        matchingEscorts.some((e) => e.escortId === r.escortId),
      );

      if (matchingRefs.length > 0) {
        report.matched.push({
          file: file.name,
          escortId: matchingRefs[0].escortId,
          escortName: matchingRefs[0].escortName,
          originalUrl: matchingRefs[0].originalUrl,
          cleanedUrl: matchingRefs[0].cleanedUrl,
        });
        matchedFileNames.add(file.name);
        matchedFirestoreUrls.add(matchingRefs[0].cleanedUrl);
        continue;
      }

      const bestMatch = matchingEscorts[0];
      report.matched.push({
        file: file.name,
        escortId: bestMatch.escortId,
        escortName: bestMatch.name,
        originalUrl: bestMatch.slug || bestMatch.username || "",
        cleanedUrl: file.gcsPublicUrl,
      });
      matchedFileNames.add(file.name);
      continue;
    }

    report.orphanedFiles.push(file);
  }

  for (const ref of firestoreRefs) {
    if (!matchedFirestoreUrls.has(ref.cleanedUrl)) {
      report.corruptedLinks.push({
        escortId: ref.escortId,
        escortName: ref.escortName,
        originalUrl: ref.originalUrl,
        cleanedUrl: ref.cleanedUrl,
        issue: `Firestore cleanedUrl does not correspond to any file in storage`,
      });
    }
  }

  // Build per-escort cleanedImages array from matched entries
  const escortImagesMap = new Map<string, Set<string>>();
  for (const m of report.matched) {
    if (!escortImagesMap.has(m.escortId)) {
      escortImagesMap.set(m.escortId, new Set());
    }
    escortImagesMap.get(m.escortId)!.add(m.cleanedUrl);
  }

  report.escortCleanedImages = [];
  escortImagesMap.forEach((urls, escortId) => {
    const match = report.matched.find((m) => m.escortId === escortId);
    report.escortCleanedImages.push({
      escortId,
      escortName: match?.escortName || "",
      cleanedImages: Array.from(urls),
    });
  });

  return report;
}

function printReport(report: MappingReport): void {
  console.log("\n" + "=".repeat(70));
  console.log("[Map Cleaned Images] Report");
  console.log("=".repeat(70));

  console.log(`\n📊 Overview:`);
  console.log(`  Files in Storage:      ${report.totalStorageFiles}`);
  console.log(`  Firestore References:  ${report.totalFirestoreRefs}`);
  console.log(`  Escorts with cleaned:  ${report.escortsWithCleanedImages}`);
  console.log(`  Matched:                ${report.matched.length}`);
  console.log(`  Orphaned (storage only): ${report.orphanedFiles.length}`);
  console.log(`  Corrupted links:        ${report.corruptedLinks.length}`);

  if (report.escortCleanedImages.length > 0) {
    console.log(`\n📝 Per-Escort cleanedImages Summary (${report.escortCleanedImages.length} escorts):`);
    report.escortCleanedImages.slice(0, 20).forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.escortId} (${e.escortName}): ${e.cleanedImages.length} images`);
    });
    if (report.escortCleanedImages.length > 20) {
      console.log(`  ... and ${report.escortCleanedImages.length - 20} more`);
    }
  }

  if (report.matched.length > 0) {
    console.log(`\n✅ Matched (${report.matched.length}):`);
    report.matched.slice(0, 20).forEach((m, i) => {
      console.log(
        `  ${i + 1}. ${m.escortId} (${m.escortName}) → ${m.file}`,
      );
    });
    if (report.matched.length > 20) {
      console.log(`  ... and ${report.matched.length - 20} more`);
    }
  }

  if (report.orphanedFiles.length > 0) {
    console.log(`\n⚠️  Orphaned files in storage (${report.orphanedFiles.length}):`);
    report.orphanedFiles.slice(0, 30).forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.name}`);
      console.log(`     Sanitized escort ID: ${f.sanitizedEscortId}`);
      console.log(`     GCS URL: ${f.gcsPublicUrl}`);
    });
    if (report.orphanedFiles.length > 30) {
      console.log(`  ... and ${report.orphanedFiles.length - 30} more`);
    }
  }

  if (report.corruptedLinks.length > 0) {
    console.log(`\n❌ Corrupted links in Firestore (${report.corruptedLinks.length}):`);
    report.corruptedLinks.slice(0, 30).forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.escortId} (${c.escortName})`);
      console.log(`     cleanedUrl: ${c.cleanedUrl.substring(0, 80)}`);
      console.log(`     Issue: ${c.issue}`);
    });
    if (report.corruptedLinks.length > 30) {
      console.log(`  ... and ${report.corruptedLinks.length - 30} more`);
    }
  }

  console.log("\n" + "=".repeat(70));
}

async function main(): Promise<void> {
  const rawArgs = process.argv.slice(2);
  const dryRun = rawArgs.includes("--dry-run");
  const noWrite = rawArgs.includes("--no-write");
  const escortIdArg = rawArgs.find((a) => a.startsWith("--escort-id="));
  const escortId = escortIdArg ? escortIdArg.split("=")[1] : undefined;

  console.log("=".repeat(70));
  console.log(`[Map Cleaned Images] ${dryRun ? "DRY RUN" : "LIVE SCAN"}`);
  console.log(`Bucket: ${bucket.name}`);
  console.log(`Prefix: ${STORAGE_PREFIX}`);
  if (noWrite) console.log(`📝 Write mode: SKIP (Firestore will not be updated)`);
  console.log("=".repeat(70));

  let report: MappingReport;

  try {
    report = await mapCleanedImages(escortId);
  } catch (error: any) {
    console.error("❌ Fatal error during scan:", error.message);
    process.exit(1);
  }

  printReport(report);

  if (!dryRun) {
    const fs = await import("fs");
    const path = await import("path");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputPath = path.join(
      process.cwd(),
      `cleaned-images-mapping-${timestamp}.json`,
    );

    const output = {
      generatedAt: new Date().toISOString(),
      escortIdFilter: escortId || null,
      summary: {
        totalStorageFiles: report.totalStorageFiles,
        totalFirestoreRefs: report.totalFirestoreRefs,
        matched: report.matched.length,
        orphanedFiles: report.orphanedFiles.length,
        corruptedLinks: report.corruptedLinks.length,
        escortsWithCleanedImages: report.escortsWithCleanedImages,
        escortsUpdated: report.escortCleanedImages.length,
      },
      matched: report.matched,
      orphanedFiles: report.orphanedFiles,
      corruptedLinks: report.corruptedLinks,
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`\n💾 Full report saved to: ${outputPath}`);
  }

  if (!dryRun && !noWrite && report.escortCleanedImages.length > 0) {
    console.log(`\n📝 Writing cleanedImages to Firestore for ${report.escortCleanedImages.length} escorts...`);
    let written = 0;
    let failed = 0;

    for (const entry of report.escortCleanedImages) {
      try {
        await adminDb.collection("escorts").doc(entry.escortId).update({
          cleanedImages: entry.cleanedImages,
          hasCleanedImages: true,
        });
        written++;
      } catch (error: any) {
        console.error(`  ❌ Failed to update escort ${entry.escortId}:`, error.message);
        failed++;
      }
    }

    console.log(`\n📊 Firestore write summary:`);
    console.log(`  ✅ Updated: ${written} escorts`);
    console.log(`  ❌ Failed:  ${failed} escorts`);
  }

  if (report.orphanedFiles.length > 0 || report.corruptedLinks.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("[Map Cleaned Images] Fatal:", err);
  process.exit(1);
});
