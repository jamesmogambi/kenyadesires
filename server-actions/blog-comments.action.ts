// server-actions/blog-comments.action.ts
"use server";

/**
 * Blog comments live in MySQL, not Sanity.
 *
 * These functions used to call `client.create()` on the Sanity client in
 * lib/sanity/client.ts, which is constructed without a `token`. Every write was
 * therefore unauthenticated and Sanity rejected it with HTTP 403 "Insufficient
 * permissions; permission 'create' required". No Sanity write token exists in any
 * env file, so the comment form could never succeed.
 *
 * Reads and writes now both go through `blog_comments` (see migration 006), which
 * matches how the rest of the site stores its data. The exported `BlogComment`
 * shape is unchanged, so CommentForm, CommentList, lib/cache.ts and
 * app/api/blog-comments/route.ts are unaffected.
 *
 * Comments post straight to the page: `is_approved` is written as TRUE and there is
 * no moderation step. The column is kept so the read query stays selective and a
 * moderation screen can be added later without a schema change.
 */
import { executeQuery } from "@/lib/neon";

export interface BlogComment {
  id: string;
  postSlug: string;
  name: string;
  email: string;
  content: string;
  createdAt: string;
  approved: boolean;
  clerkUserId?: string;
}

const mapRow = (row: any): BlogComment => ({
  id: row.id,
  postSlug: row.post_slug,
  name: row.author_name || "",
  email: row.email || "",
  content: row.content || "",
  createdAt: row.created_at,
  approved: Boolean(row.is_approved),
  clerkUserId: row.clerk_user_id || undefined,
});

export async function addBlogComment(data: {
  postSlug: string;
  name: string;
  email: string;
  content: string;
  clerkUserId?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    if (!data.postSlug || !data.name || !data.email || !data.content) {
      return { success: false, error: "Missing required fields" };
    }

    // The primary key defaults to uuid(), but mysql2 reports insertId = 0 for a
    // non-numeric key, so the id is generated here to be returned to the caller.
    // `created_at` still defaults to CURRENT_TIMESTAMP.
    const id = crypto.randomUUID();

    // is_approved is written explicitly rather than left to the column default of
    // 0: comments appear on the post immediately, with no moderation step.
    await executeQuery(
      `INSERT INTO blog_comments (id, post_slug, author_name, email, clerk_user_id, content, is_approved)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
      [
        id,
        data.postSlug,
        data.name,
        data.email,
        data.clerkUserId || null,
        data.content,
      ],
    );

    return {
      success: true,
      id,
    };
  } catch (error) {
    console.error("Error adding blog comment:", error);
    return {
      success: false,
      error: "Failed to submit comment",
    };
  }
}

export async function getCommentsByPostSlug(
  postSlug: string,
): Promise<BlogComment[]> {
  try {
    if (!postSlug) return [];

    const rows: any[] = await executeQuery(
      `SELECT id, post_slug, author_name, email, clerk_user_id, content, is_approved, created_at
       FROM blog_comments
       WHERE post_slug = $1 AND is_approved = TRUE
       ORDER BY created_at DESC`,
      [postSlug],
    );

    return (rows || []).map(mapRow);
  } catch (error) {
    console.error("Error fetching comments by post slug:", error);
    return [];
  }
}
