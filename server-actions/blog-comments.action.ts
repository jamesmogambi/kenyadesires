"use server";

import { client } from "@/lib/sanity/client";

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

export async function addBlogComment(data: {
  postSlug: string;
  name: string;
  email: string;
  content: string;
  clerkUserId?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const commentDoc = {
      _type: "blogComment",
      postSlug: data.postSlug,
      name: data.name,
      email: data.email,
      content: data.content,
      clerkUserId: data.clerkUserId,
      createdAt: new Date().toISOString(),
      approved: false,
    };

    const result = await client.create(commentDoc);

    return {
      success: true,
      id: result._id,
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
    const query = `*[_type == "blogComment" && postSlug == $postSlug && approved == true] | order(createdAt desc) {
      _id,
      postSlug,
      name,
      email,
      content,
      createdAt,
      approved,
      clerkUserId
    }`;

    const comments = await client.fetch(query, { postSlug });
    return (comments || []) as BlogComment[];
  } catch (error) {
    console.error("Error fetching comments by post slug:", error);
    return [];
  }
}