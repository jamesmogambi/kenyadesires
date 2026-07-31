import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

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

export async function getCommentsByPostSlug(
  postSlug: string,
): Promise<BlogComment[]> {
  try {
    const snapshot = await adminDb
      .collection("blogComments")
      .where("postSlug", "==", postSlug)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt;
      return {
        id: doc.id,
        postSlug: data.postSlug,
        name: data.name,
        email: data.email,
        content: data.content,
        createdAt:
          createdAt && typeof createdAt.toDate === "function"
            ? createdAt.toDate().toISOString()
            : createdAt,
        approved: data.approved,
        clerkUserId: data.clerkUserId,
      };
    });
  } catch (error) {
    console.error("Error fetching blog comments:", error);
    return [];
  }
}

export async function getCachedCommentsByPostSlug(postSlug: string): Promise<BlogComment[]> {
  return await getCommentsByPostSlug(postSlug);
}

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

    if (data.content.trim().length < 3) {
      return { success: false, error: "Comment must be at least 3 characters" };
    }

    const docRef = await adminDb.collection("blogComments").add({
      postSlug: data.postSlug,
      name: data.name,
      email: data.email,
      content: data.content.trim(),
      clerkUserId: data.clerkUserId || null,
      approved: true,
      createdAt: FieldValue.serverTimestamp(),
    });

    revalidatePath(`/blog/${data.postSlug}`);
    revalidatePath("/api/blog-comments");

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding blog comment:", error);
    return { success: false, error: "Failed to add comment" };
  }
}
