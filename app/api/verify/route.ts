import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getEscortByClerkUserId } from "@/server-actions/girl.action";

const WORKFLOW_ID = "f97e57f7-0890-41e1-b38a-53871b5192a4";
const DIDIT_TIMEOUT_MS = 10000;

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const escort = await getEscortByClerkUserId(userId);
    if (!escort) {
      return NextResponse.json({ no_profile: true }, { status: 403 });
    }

    const { callback } = await req.json().catch(() => ({}));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DIDIT_TIMEOUT_MS);

    const res = await fetch("https://verification.didit.me/v3/session/", {
      method: "POST",
      headers: {
        "x-api-key": process.env.DIDIT_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workflow_id: WORKFLOW_ID,
        vendor_data: userId,
        callback: callback || `${process.env.NEXT_PUBLIC_SITE_URL}/verify/done`,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: "session_create_failed", detail },
        { status: 502 },
      );
    }

    const session = await res.json();

    return NextResponse.json({
      url: session.url,
      session_id: session.session_id,
    });
  } catch (error: any) {
    console.error("Error creating Didit session:", error);
    return NextResponse.json(
      { error: "internal_error", detail: error.message },
      { status: 500 },
    );
  }
}
