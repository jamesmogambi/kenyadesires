import { initializeApp, cert } from "firebase-admin/app";
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

const SMS_API_URL = "https://sms77io.p.rapidapi.com/sms";
const SMS_API_KEY = process.env.SMS77_API_KEY;
const SMS_API_HOST = "sms77io.p.rapidapi.com";
const DELAY_MS = Number(process.env.SMS_CAMPAIGN_DELAY_MS || 30000);
const BATCH_SIZE = Number(process.env.SMS_CAMPAIGN_BATCH_SIZE || 50);
const BATCH_BREAK_MS = Number(process.env.SMS_CAMPAIGN_BATCH_BREAK_MS || 15 * 60 * 1000);

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) cleaned = "254" + cleaned.slice(1);
  if (!cleaned.startsWith("254")) cleaned = "254" + cleaned;
  return cleaned;
}

function isValidPhone(phone: string): boolean {
  if (!phone || phone.length < 10) return false;
  if (phone.startsWith("254") && phone.length === 12) return true;
  if (phone.startsWith("07") && phone.length === 10) return true;
  return false;
}

async function sendSMS(
  phone: string,
  text: string,
): Promise<{ success: boolean; msgId?: string; error?: string }> {
  if (!SMS_API_KEY) {
    return { success: false, error: "SMS77_API_KEY not configured" };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("to", phone);
    formData.append("p", phone);
    formData.append("text", text);
    formData.append("return_msg_id", "true");

    const response = await fetch(SMS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "x-rapidapi-host": SMS_API_HOST,
        "x-rapidapi-key": SMS_API_KEY,
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
      };
    }

    return { success: true, msgId: data.msg_id || data.messageId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function main() {
  const message = process.argv[2];
  if (!message) {
    console.error("Usage: npm run sms-campaign -- <message>");
    process.exit(1);
  }

  console.log("=".repeat(60));
  console.log("[SMS Campaign] Starting bulk SMS campaign");
  console.log(`[SMS Campaign] Delay: ${DELAY_MS}ms | Batch: ${BATCH_SIZE} | Break: ${BATCH_BREAK_MS}ms`);
  console.log("=".repeat(60));

  const snapshot = await db.collection("escorts").where("whatsappPhone", "!=", null).get();

  const escorts = snapshot.docs
    .map((doc) => {
      const data = doc.data() as any;
      return { id: doc.id, ...data };
    })
    .map((escort) => ({
      ...escort,
      phone: formatPhoneNumber(escort.whatsappPhone || escort.phoneNumber || ""),
    }))
    .filter((escort) => isValidPhone(escort.phone));

  const results = {
    total: escorts.length,
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [] as Array<{ id: string; phone: string; error: string }>,
  };

  console.log(`[SMS Campaign] Found ${escorts.length} valid contacts\n`);

  for (let i = 0; i < escorts.length; i++) {
    const escort = escorts[i];
    const phone = escort.phone;

    if (!phone) {
      results.skipped++;
      console.log(`[SMS Campaign] ${i + 1}/${escorts.length} SKIPPED - no phone (id: ${escort.id})`);
      continue;
    }

    const lastCampaign = (escort.smsCampaigns || []).sort((a: any, b: any) => b.sentAt - a.sentAt)[0];
    if (lastCampaign && lastCampaign.message === message) {
      const sentDate = new Date(lastCampaign.sentAt).toLocaleDateString();
      console.log(`[SMS Campaign] ${i + 1}/${escorts.length} SKIPPED - already sent on ${sentDate} (id: ${escort.id})`);
      results.skipped++;
      continue;
    }

    process.stdout.write(`[SMS Campaign] ${i + 1}/${escorts.length} SENDING to ${phone}... `);

    const result = await sendSMS(phone, message);

    if (result.success) {
      results.sent++;
      console.log(`✓ SENT (msgId: ${result.msgId})`);

      try {
        await db.collection("escorts").doc(escort.id).update({
          smsCampaigns: [...((escort.smsCampaigns || []) as any[]), {
            message,
            sentAt: new Date().toISOString(),
            msgId: result.msgId,
            status: "sent",
          }],
        });
      } catch (updateError) {
        console.error(`[SMS Campaign] Warning: failed to update campaign history for ${escort.id}:`, updateError);
      }
    } else {
      results.failed++;
      console.log(`✗ FAILED - ${result.error}`);

      try {
        await db.collection("escorts").doc(escort.id).update({
          smsCampaigns: [...((escort.smsCampaigns || []) as any[]), {
            message,
            sentAt: new Date().toISOString(),
            error: result.error,
            status: "failed",
          }],
        });
      } catch (updateError) {
        console.error(`[SMS Campaign] Warning: failed to update campaign history for ${escort.id}:`, updateError);
      }

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
      console.log(`\n[SMS Campaign] Batch ${batchNum}/${totalBatches} complete.`);
      console.log(`[SMS Campaign] Taking a ${BATCH_BREAK_MS / 1000}s break...\n`);
      await new Promise((resolve) => setTimeout(resolve, BATCH_BREAK_MS));
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("[SMS Campaign] Campaign completed!");
  console.log(`[SMS Campaign] Total: ${results.total}, Sent: ${results.sent}, Failed: ${results.failed}, Skipped: ${results.skipped}`);
  console.log("=".repeat(60));

  if (results.failed > 0) {
    console.log("\n[SMS Campaign] Sample errors (first 5):");
    results.errors.slice(0, 5).forEach((err) => {
      console.log(`  - ${err.phone}: ${err.error}`);
    });
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("[SMS Campaign] Fatal error:", error);
  process.exit(1);
});
