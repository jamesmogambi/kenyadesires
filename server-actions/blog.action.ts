"use server";

import {db} from "@/lib/firebase";
import {collection, getDocs, limit as firestoreLimit, orderBy, query, where,} from "firebase/firestore";
import {serializeDoc, serializeDocs} from "@/lib/firebase-serializer";

interface GetBlogPostsOptions {
    page?: number;
    limit?: number;
    categorySlug?: string;
    tag?: string;
    authorId?: string;
    featuredOnly?: boolean;
    searchQuery?: string;
    sortBy?: "newest" | "popular" | "featured";
}

export async function getBlogPosts(options: GetBlogPostsOptions = {}) {
    try {
        const {
            page = 1,
            limit = 12,
            categorySlug,
            tag,
            authorId,
            featuredOnly = false,
            searchQuery,
            sortBy = "newest",
        } = options;

        const postsRef = collection(db, "blogPosts");
        let q = query(postsRef, where("isPublished", "==", true));

        // Apply filters
        if (categorySlug) {
            q = query(q, where("categorySlug", "==", categorySlug));
        }

        if (tag) {
            q = query(q, where("tags", "array-contains", tag));
        }

        if (authorId) {
            q = query(q, where("authorId", "==", authorId));
        }

        if (featuredOnly) {
            q = query(q, where("isFeatured", "==", true));
        }

        // Build sort
        if (sortBy === "popular") {
            q = query(q, orderBy("views", "desc"), orderBy("publishedAt", "desc"));
        } else if (sortBy === "featured") {
            q = query(q, orderBy("isFeatured", "desc"), orderBy("publishedAt", "desc"));
        } else {
            q = query(q, orderBy("publishedAt", "desc"));
        }

        // Since Firestore doesn't support offset easily with skip,
        // for a simple implementation we fetch all up to page * limit or use startAfter for better performance.
        // For this migration, we'll do a simple limit-based fetch for now or use the full snapshot if small.
        // Ideally we use startAfter, but for sitemap and simple listing, we can fetch what we need.

        const snapshot = await getDocs(q);
        const allPosts = serializeDocs(snapshot.docs);

        // Manual pagination for now as Firestore skip is not available
        const total = allPosts.length;
        const totalPages = Math.ceil(total / limit);
        const skip = (page - 1) * limit;
        const paginatedPosts = allPosts.slice(skip, skip + limit);

        // Get categories
        const categoriesSnapshot = await getDocs(collection(db, "blogCategories"));
        const categories = serializeDocs(categoriesSnapshot.docs);

        return {
            success: true,
            data: {
                posts: paginatedPosts,
                categories: categories,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1,
                },
            },
        };
    } catch (error) {
        console.error("Error fetching blog posts:", error);
        return {
            success: false,
            error: "Failed to fetch blog posts",
        };
    }
}

export async function getBlogPostBySlug(slug: string) {
    try {
        const postsRef = collection(db, "blogPosts");
        const q = query(postsRef, where("slug", "==", slug), firestoreLimit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return {
                success: false,
                error: "Post not found",
            };
        }

        const postData = serializeDoc(snapshot.docs[0]);

        return {
            success: true,
            data: {
                post: postData,
            },
        };
    } catch (error) {
        console.error("Error fetching blog post:", error);
        return {
            success: false,
            error: "Failed to fetch blog post",
        };
    }
}

export async function getBlogCategories() {
    try {
        const categoriesSnapshot = await getDocs(collection(db, "blogCategories"));
        const categories = serializeDocs(categoriesSnapshot.docs);

        return {
            success: true,
            data: categories,
        };
    } catch (error) {
        console.error("Error fetching blog categories:", error);
        return {
            success: false,
            error: "Failed to fetch blog categories",
        };
    }
}

export async function getFeaturedPosts(limitCount = 20) {
    return getBlogPosts({featuredOnly: true, limit: limitCount});
}

export async function getPopularPosts(limitCount = 5) {
    return getBlogPosts({sortBy: "popular", limit: limitCount});
}
