import { NextRequest, NextResponse } from "next/server";
import { getZohoAccessToken } from "@/lib/zoho/auth";
import { zohoFetch } from "@/lib/zoho/client";

export async function GET(request: NextRequest) {
  try {
    const tokenData = await getZohoAccessToken();

    const response = await zohoFetch("/crm/v2/Leads", {
      method: "GET",
    });

    if (!response.ok) {
      const status = response.status;
      console.error(`[Zoho Test] API request failed with status ${status}`);
      return NextResponse.json(
        {
          success: false,
          connected: false,
          error: `Zoho API returned status ${status}. The connection may need re-authorization.`,
        },
        { status: 500 },
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      connected: true,
      message: "Zoho CRM connection successful",
      data: {
        leads: data?.data || [],
        lead_count: data?.data ? data.data.length : 0,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Connection test failed";

    console.error(`[Zoho Test] ${message}`);

    return NextResponse.json(
      {
        success: false,
        connected: false,
        error:
          message.includes("not connected")
            ? "Zoho CRM is not connected. Please authorize the connection first."
            : "Zoho CRM connection test failed. Please try again.",
      },
      { status: 500 },
    );
  }
}
