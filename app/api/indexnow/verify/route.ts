import { NextResponse } from "next/server";

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "";
const INDEXNOW_HOST = process.env.INDEXNOW_HOST || "";

export async function GET() {
  if (!INDEXNOW_KEY || !INDEXNOW_HOST) {
    return NextResponse.json(
      { error: "INDEXNOW_KEY or INDEXNOW_HOST not configured" },
      { status: 500 },
    );
  }

  const baseUrl = `https://${INDEXNOW_HOST}`;
  const keyUrl = `${baseUrl}/${INDEXNOW_KEY}.txt`;
  const sitemapUrl = `${baseUrl}/sitemap.xml`;

  let keyFileOk = false;
  let sitemapOk = false;
  let urlCount = 0;

  try {
    const keyRes = await fetch(keyUrl, {
      headers: { Accept: "text/plain" },
      next: { revalidate: 0 },
    });
    if (keyRes.ok) {
      const keyText = await keyRes.text();
      keyFileOk = keyText.trim() === INDEXNOW_KEY;
    }
  } catch {}

  try {
    const smRes = await fetch(sitemapUrl, {
      headers: { Accept: "application/xml, text/xml" },
      next: { revalidate: 0 },
    });
    if (smRes.ok) {
      const xml = await smRes.text();
      const matches = xml.match(/<loc>([^<]+)<\/loc>/g);
      urlCount = matches ? matches.length : 0;
      sitemapOk = urlCount > 0;
    }
  } catch {}

  return NextResponse.json({
    keyFileOk,
    sitemapOk,
    urlCount,
    keyUrl,
    sitemapUrl,
  });
}