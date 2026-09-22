import { NextRequest, NextResponse } from "next/server";

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

    return NextResponse.json({
      success: true,
      results: { total: 0, sent: 0, failed: 0, skipped: 0, errors: [] },
    });
  } catch (error: any) {
    console.error("WhatsApp campaign error:", error);
    return NextResponse.json(
      { error: "Internal server error", detail: error.message },
      { status: 500 },
    );
  }
}
