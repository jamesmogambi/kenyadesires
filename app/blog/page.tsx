import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import CategorySection from "./CategorySection";
import { ShowMoreButton } from "./ShowMOreButton";
import BlogList from "./BlogList";
import {
  getCachedBlogCategories,
  getCachedFeaturedPosts,
  getCachedBlogPosts,
} from "@/lib/cache";
import { REVALIDATE_TIME } from "@/lib/cache-config";

// ✅ ISR - 7 days
export const revalidate = REVALIDATE_TIME;

export const metadata: Metadata = {
  title: "Blog | Latest Articles & Insights | Kenyan Dating Blog",
  description:
    "Discover our latest blog posts about dating, relationships, and social connections in Kenya. Stay updated with expert advice and trending topics.",
  openGraph: {
    title: "Latest Blog Posts & Articles",
    description:
      "Explore our collection of blog posts and articles about dating in Kenya",
    type: "website",
    url: "https://yourdomain.com/blog",
    siteName: "Kenyan Dating Blog",
    images: [
      {
        url: "https://yourdomain.com/images/blog-og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Blog Posts Overview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Latest Blog Posts & Articles",
    description: "Explore our collection of blog posts and articles",
    images: ["https://yourdomain.com/images/blog-twitter-image.jpg"],
    creator: "@yourtwitterhandle",
  },
  keywords: [
    "dating blog Kenya",
    "relationships Kenya",
    "online dating Kenya",
    "dating advice",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://yourdomain.com/blog",
  },
};

interface PageProps {
  searchParams: { page?: string };
}

const page = async ({ searchParams }: PageProps) => {
  const currentPage = parseInt(searchParams.page || "1");
  const POSTS_PER_PAGE = 20;

  // ✅ Fetch ALL data in parallel with caching
  const [categories, featuredPosts, postsData] = await Promise.all([
    getCachedBlogCategories(),
    getCachedFeaturedPosts(20), // Get up to 20 featured posts
    getCachedBlogPosts(currentPage, POSTS_PER_PAGE),
  ]);

  const { posts, total, totalPages, currentPage: page } = postsData;
  const nextPage = currentPage + 1;
  const hasMore = currentPage < totalPages;

  return (
    <>
      <div className="flex w-full mx-auto flex-col-reverse lg:max-w-[80%] min-h-screen lg:flex-row gap-2">
        {/* Categories Section */}
        <aside className="basis-full space-y-7 lg:basis-1/3 p-6 border-green-600">
          <CategorySection title="Kenyan Categories" categories={categories} />
        </aside>

        {/* Blog List */}
        <div className="basis-full p-8 border-amber-300 lg:flex-1">
          {/* Show featured posts section if there are any */}
          {featuredPosts.length > 0 && (
            <div className="mb-8">
              {/* <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="text-yellow-500">⭐</span> Featured Articles
              </h2> */}
              <BlogList blogList={featuredPosts} />
            </div>
          )}

          {/* Regular posts */}
          {posts.length > 0 && (
            <div>
              {featuredPosts.length > 0 && (
                <h2 className="text-2xl font-bold mb-4">All Posts</h2>
              )}
              <BlogList blogList={posts} />
            </div>
          )}

          {/* Show More Button */}
          {hasMore && (
            <ShowMoreButton
              nextPage={nextPage}
              totalPosts={total}
              currentCount={posts.length}
            />
          )}

          {/* No more posts */}
          {!hasMore && posts.length > 0 && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full">
                <span className="text-xl">✅</span>
                <p className="font-medium">
                  All <span className="text-primary text-xl">{total} </span>
                  posts loaded
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default page;
