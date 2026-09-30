#!/usr/bin/env tsx

import { getAllIndexNowUrls } from "../lib/indexnow/get-urls";
import { submitUrlsToIndexNow } from "../lib/indexnow";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.xyz";
// Allow override for local testing: INDEXNOW_TEST_URL=http://localhost:3000
const TEST_URL = process.env.INDEXNOW_TEST_URL;

async function main() {
  const targetUrl = TEST_URL || BASE_URL;
  console.log(`[IndexNow] Starting manual submission for ${targetUrl}`);
  console.log(`[IndexNow] NODE_ENV: ${process.env.NODE_ENV}`);

  if (process.env.NODE_ENV !== "production" && !TEST_URL) {
    console.log("[IndexNow] Skipping: not in production environment");
    console.log("[IndexNow] Set NODE_ENV=production to run actual submission");
    console.log("[IndexNow] Or set INDEXNOW_TEST_URL=http://localhost:3000 for local testing");
    process.exit(0);
  }

  console.log("[IndexNow] Fetching URLs from sitemap...");
  const { urls, errors } = await getAllIndexNowUrls(TEST_URL);

  if (errors.length > 0) {
    console.warn("[IndexNow] Sitemap fetch errors:", errors);
  }

  console.log(`[IndexNow] Found ${urls.length} URLs in sitemap`);

  if (urls.length === 0) {
    console.log("[IndexNow] No URLs to submit");
    process.exit(0);
  }

  console.log("[IndexNow] Submitting to IndexNow...");
  const result = await submitUrlsToIndexNow(urls);

  console.log("\n[IndexNow] === SUBMISSION RESULT ===");
  console.log(`  Success: ${result.success}`);
  console.log(`  Submitted: ${result.submitted}`);
  console.log(`  Batches: ${result.batches}`);
  console.log(`  Statuses: ${result.statuses.join(", ")}`);
  if (result.errors.length > 0) {
    console.log(`  Errors: ${result.errors.join("; ")}`);
  }

  if (result.success) {
    console.log("\n[IndexNow] ✅ All batches submitted successfully!");
    process.exit(0);
  } else if (result.submitted > 0) {
    console.log("\n[IndexNow] ⚠️ Partial success - some batches failed");
    process.exit(1);
  } else {
    console.log("\n[IndexNow] ❌ Submission failed completely");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[IndexNow] Fatal error:", err);
  process.exit(1);
});