import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { registerIPN, getPesapalBaseUrl } from "@/lib/pesapal";

/**
 * POST /api/pesapal/register-ipn
 *
 * Registers your IPN endpoint `${NEXT_PUBLIC_APP_URL}/api/pesapal/ipn` with
 * Pesapal and returns the `ipn_id`. Save that id into `PESAPAL_IPN_ID` (in
 * .env.local) — it is required by the initiate endpoint.
 *
 * Auth: Clerk session OR an `x-api-key` matching INTERNAL_API_KEY (lets you
 * register the IPN from curl/Postman during setup).
 */
export async function POST(req: NextRequest) {
  const authenticated = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/$/, "");
    if (!appUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_APP_URL is not configured" },
        { status: 500 },
      );
    }

    const baseUrl = getPesapalBaseUrl();
    console.log(
      `[Pesapal] Registering IPN against ${baseUrl}/URLSetup/RegisterIPN → ${appUrl}/api/pesapal/ipn`,
    );

    const response = await registerIPN(`${appUrl}/api/pesapal/ipn`, "GET");

    if (response.error || !response.ipn_id) {
      console.error(
        "[Pesapal] IPN registration failed:",
        JSON.stringify(response.error || response),
      );
      return NextResponse.json(
        {
          error: "IPN registration failed",
          detail:
            response.ipn_status_description ||
            response.error?.message ||
            "No ipn_id returned",
          pesapal_status: response.status,
          pesapal_error: response.error,
        },
        { status: 502 },
      );
    }

    // Log the ipn_id (it is a public GUID, not a secret) so you can copy it
    // into PESAPAL_IPN_ID in your environment.
    console.info(`[Pesapal] Registered IPN. ipn_id=${response.ipn_id}`);
    console.info("[Pesapal] Save this value to your env as PESAPAL_IPN_ID");

    return NextResponse.json(
      {
        success: true,
        ipn_id: response.ipn_id,
        url: response.url,
        notification_type: response.ipn_notification_type_description,
        status: response.ipn_status_description,
        base_url: baseUrl,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("[Pesapal] register-ipn error:", err?.message || err);
    const status = err?.status || 500;
    return NextResponse.json(
      {
        error: "Failed to register IPN",
        detail: err.message,
        code: err.code,
      },
      { status },
    );
  }
}

async function isAuthenticated(req: NextRequest): Promise<boolean> {
  try {
    const { userId } = await auth();
    if (userId) return true;
  } catch {
    /* fall through to API-key check */
  }

  const provided = req.headers.get("x-api-key");
  const expected = process.env.INTERNAL_API_KEY;
  if (!provided || !expected) return false;

  // constant-time comparison so a missing/wrong key behaves consistently
  let diff = 0;
  const a = provided;
  const b = expected;
  const len = Math.min(a.length, b.length);
  diff |= a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
