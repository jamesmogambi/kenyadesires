import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

const WASENDER_API_URL = "https://www.wasenderapi.com/api/send-message";
const WASENDER_KEY = process.env.WASENDER_KEY;
const DEFAULT_DELAY_MS = Number(process.env.WASENDER_CAMPAIGN_DELAY_MS || 30000);
const BATCH_SIZE = Number(process.env.WASENDER_CAMPAIGN_BATCH_SIZE || 50);
const BATCH_BREAK_MS = Number(process.env.WASENDER_CAMPAIGN_BATCH_BREAK_MS || 15 * 60 * 1000);

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.slice(1);
  }
  if (!cleaned.startsWith("254")) {
    cleaned = "254" + cleaned;
  }
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

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Missing required field: message" },
        { status: 400 },
      );
    }

    const snapshot = await adminDb
      .collection("escorts")
      .where("whatsappPhone", "!=", null)
      .get();

    const escorts = snapshot.docs
      .map((doc) => {
        const data = doc.data() as { whatsappPhone?: string | null; phoneNumber?: string | null; [key: string]: any };
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

    console.log(`[WhatsApp Campaign] Starting campaign for ${escorts.length} contacts`);
    console.log(`[WhatsApp Campaign] Delay: ${DEFAULT_DELAY_MS}ms | Batch size: ${BATCH_SIZE} | Batch break: ${BATCH_BREAK_MS}ms`);

    for (let i = 0; i < escorts.length; i++) {
      const escort = escorts[i];
      const phone = escort.phone;
      if (!phone) {
        results.skipped++;
        console.log(`[WhatsApp Campaign] ${i + 1}/${escorts.length} SKIPPED - no phone (id: ${escort.id})`);
        continue;
      }

      console.log(`[WhatsApp Campaign] ${i + 1}/${escorts.length} SENDING to ${phone} (id: ${escort.id || "unknown"})...`);

      const result = await sendWhatsAppMessage(phone, message);

      if (result.success) {
        results.sent++;
        console.log(`[WhatsApp Campaign] ${i + 1}/${escorts.length} SENT to ${phone} msgId: ${result.msgId}`);
      } else {
        results.failed++;
        console.log(`[WhatsApp Campaign] ${i + 1}/${escorts.length} FAILED to ${phone} - ${result.error}`);
        results.errors.push({
          id: escort.id,
          phone,
          error: result.error || "Unknown error",
        });
      }

      if (DEFAULT_DELAY_MS > 0 && i < escorts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, DEFAULT_DELAY_MS));
      }

      if ((i + 1) % BATCH_SIZE === 0 && i < escorts.length - 1) {
        const batchNum = Math.floor((i + 1) / BATCH_SIZE);
        const totalBatches = Math.ceil(escorts.length / BATCH_SIZE);
        console.log(`[WhatsApp Campaign] Batch ${batchNum}/${totalBatches} complete. Taking a ${BATCH_BREAK_MS / 1000}s break...`);
        await new Promise((resolve) => setTimeout(resolve, BATCH_BREAK_MS));
      }
    }

    console.log(`[WhatsApp Campaign] Completed. Total: ${results.total}, Sent: ${results.sent}, Failed: ${results.failed}, Skipped: ${results.skipped}`);
    if (results.failed > 0) {
      console.log(`[WhatsApp Campaign] Sample errors:`, results.errors.slice(0, 5));
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error("WhatsApp campaign error:", error);
    return NextResponse.json(
      { error: "Internal server error", detail: error.message },
      { status: 500 },
    );
  }
}
