import { NextRequest, NextResponse } from "next/server";

const SMS_API_URL = "https://sms77io.p.rapidapi.com/sms";
const SMS_API_KEY = process.env.SMS77_API_KEY;
const SMS_API_HOST = "sms77io.p.rapidapi.com";

async function sendSMS(to: string, text: string): Promise<{ success: boolean; msgId?: string; error?: string }> {
  if (!SMS_API_KEY) {
    return { success: false, error: "SMS77_API_KEY not configured" };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("to", to);
    formData.append("p", to);
    formData.append("text", text);
    formData.append("return_msg_id", "true");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(SMS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-rapidapi-host": SMS_API_HOST,
          "x-rapidapi-key": SMS_API_KEY,
        },
        body: formData.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const data = await response.json();

      if (!response.ok || data.error) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return { success: true, msgId: data.msg_id || data.messageId };
    } catch (fetchError: any) {
      clearTimeout(timeout);
      if (fetchError.name === "AbortError") {
        return { success: false, error: "SMS API request timed out after 15s" };
      }
      return { success: false, error: `Network error: ${fetchError.message}` };
    }
  } catch (error: any) {
    return { success: false, error: `SMS send failed: ${error.message}` };
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { error: "Missing required fields: phone, message" },
        { status: 400 },
      );
    }

    const result = await sendSMS(phone, message);

    if (!result.success) {
      console.error("[SMS] Send failed:", result.error);
      return NextResponse.json(
        { error: "Failed to send SMS", detail: result.error },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      msgId: result.msgId,
      phone,
    });
  } catch (error: any) {
    console.error("[SMS] Route error:", error);
    return NextResponse.json(
      { error: "Internal server error", detail: error.message },
      { status: 500 },
    );
  }
}
