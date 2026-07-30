import { NextRequest, NextResponse } from "next/server";
import { addBlogComment } from "@/server-actions/blog-comments.action";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { postSlug, name, email, content, clerkUserId } = body;

    if (!postSlug || !name || !email || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await addBlogComment({
      postSlug,
      name,
      email,
      content,
      clerkUserId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: true, id: result.id, message: "Comment submitted for review" },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("Blog comment API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
