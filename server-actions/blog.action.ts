"use server";

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