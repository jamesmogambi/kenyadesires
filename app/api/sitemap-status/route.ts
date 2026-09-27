import { connection, NextResponse } from "next/server";
import { getBlogPostsCountForSitemap } from "@/lib/sanity/queries";

export async function GET() {
  // Request-time only: stops static generation from invoking this handler.
  await connection();

  try {
    // Check blog posts
    const blogCount = await getBlogPostsCountForSitemap();

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      counts: {
        blog: blogCount,
        total: blogCount,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { status: "unhealthy", error: String(error) },
      { status: 500 },
    );
  }
}
