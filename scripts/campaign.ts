import { initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.development" });

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore(app);

const WASENDER_API_URL = "https://www.wasenderapi.com/api/send-message";
const WASENDER_KEY = process.env.WASENDER_KEY;
const DELAY_MS = Number(process.env.CAMPAIGN_DELAY_MS || 30000);
const BATCH_SIZE = Number(process.env.CAMPAIGN_BATCH_SIZE || 50);
const BATCH_BREAK_MS = Number(process.env.CAMPAIGN_BATCH_BREAK_MS || 15 * 60 * 1000);

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) cleaned = "254" + cleaned.slice(1);
  if (!cleaned.startsWith("254")) cleaned = "254" + cleaned;
  return cleaned;
}

function isValidKenyanPhone(phone: string): boolean {
  if (!phone || phone.length < 10) return false;
  if (phone.startsWith("254") && phone.length === 12) return true;
  if (phone.startsWith("07") && phone.length === 10) return true;
  return false;
}

async function sendWhatsAppMessage(
  phone: string,
  text: string,
): Promise<{ success: boolean; msgId?: number; error?: string }> {
  if (!WASENDER_KEY) {
    return { success: false, error: "WASENDER_KEY not configured" };
  }

  const formattedPhone = formatPhoneNumber(phone);

  try {
    const response = await fetch(WASENDER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WASENDER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: formattedPhone,
        text,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
      };
    }

    return { success: true, msgId: data.data?.msgId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function main() {
  const message = process.argv[2];
  if (!message) {
    console.error("Usage: npm run campaign -- <message>");
    process.exit(1);
  }

  console.log("=".repeat(60));
  console.log("[WhatsApp Campaign] Starting bulk campaign");
  console.log(`[WhatsApp Campaign] Delay: ${DELAY_MS}ms | Batch: ${BATCH_SIZE} | Break: ${BATCH_BREAK_MS}ms`);
  console.log("=".repeat(60));

  const snapshot = await db.collection("escorts").where("whatsappPhone", "!=", null).get();

  const escorts = snapshot.docs
    .map((doc) => {
      const data = doc.data() as any;
      return { id: doc.id, ...data };
    })
    .map((escort) => ({
      ...escort,
      phone: (escort.whatsappPhone || escort.phoneNumber || "").replace(/\D/g, ""),
    }))
    .filter((escort) => isValidKenyanPhone(escort.phone));

  const results = {
    total: escorts.length,
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [] as Array<{ id: string; phone: string; error: string }>,
  };

  console.log(`[WhatsApp Campaign] Found ${escorts.length} valid contacts\n`);

  for (let i = 0; i < escorts.length; i++) {
    const escort = escorts[i];
    const phone = escort.phone;

    if (!phone) {
      results.skipped++;
      console.log(`[WhatsApp Campaign] ${i + 1}/${escorts.length} SKIPPED - no phone (id: ${escort.id})`);
      continue;
    }

    process.stdout.write(`[WhatsApp Campaign] ${i + 1}/${escorts.length} SENDING to ${phone}... `);

    const result = await sendWhatsAppMessage(phone, message);

    if (result.success) {
      results.sent++;
      console.log(`✓ SENT (msgId: ${result.msgId})`);
    } else {
      results.failed++;
      console.log(`✗ FAILED - ${result.error}`);
      results.errors.push({
        id: escort.id,
        phone,
        error: result.error || "Unknown error",
      });
    }

    if (DELAY_MS > 0 && i < escorts.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }

    if ((i + 1) % BATCH_SIZE === 0 && i < escorts.length - 1) {
      const batchNum = Math.floor((i + 1) / BATCH_SIZE);
      const totalBatches = Math.ceil(escorts.length / BATCH_SIZE);
      console.log(`\n[WhatsApp Campaign] Batch ${batchNum}/${totalBatches} complete.`);
      console.log(`[WhatsApp Campaign] Taking a ${BATCH_BREAK_MS / 1000}s break...\n`);
      await new Promise((resolve) => setTimeout(resolve, BATCH_BREAK_MS));
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("[WhatsApp Campaign] Campaign completed!");
  console.log(`[WhatsApp Campaign] Total: ${results.total}, Sent: ${results.sent}, Failed: ${results.failed}, Skipped: ${results.skipped}`);
  console.log("=".repeat(60));

  if (results.failed > 0) {
    console.log("\n[WhatsApp Campaign] Sample errors (first 5):");
    results.errors.slice(0, 5).forEach((err) => {
      console.log(`  - ${err.phone}: ${err.error}`);
    });
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("[WhatsApp Campaign] Fatal error:", error);
  process.exit(1);
});
