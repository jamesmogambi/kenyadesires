import { NextRequest, NextResponse } from "next/server";
import { submitUrlsToIndexNow } from "@/lib/indexnow";
import { getAllIndexNowUrls } from "@/lib/indexnow/get-urls";

const ADMIN_TOKEN = process.env.INDEXNOW_ADMIN_TOKEN;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!ADMIN_TOKEN || authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return unauthorized();
  }

  let body: { urls?: string[]; source?: "sitemap" } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let urls: string[] = [];

  if (body.source === "sitemap") {
    const { urls: sitemapUrls, errors } = await getAllIndexNowUrls();
    if (errors.length > 0) {
      console.error("[IndexNow] Sitemap fetch errors:", errors);
    }
    urls = sitemapUrls;
  } else if (body.urls && Array.isArray(body.urls)) {
    urls = body.urls;
  } else {
    return NextResponse.json(
      { error: "Provide either 'urls' array or 'source': 'sitemap'" },
      { status: 400 },
    );
  }

  if (urls.length === 0) {
    return NextResponse.json(
      { success: true, submitted: 0, batches: 0, statuses: [], errors: [] },
      { status: 200 },
    );
  }

  const result = await submitUrlsToIndexNow(urls);
  return NextResponse.json(result, { status: result.success ? 200 : 207 });
}