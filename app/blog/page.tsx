import React from "react";
import { Metadata } from "next";
import CategorySection from "./CategorySection";
import { ShowMoreButton } from "./ShowMOreButton";
import BlogList from "./BlogList";
import {
  getCachedBlogCategories,
  getCachedFeaturedPosts,
  getCachedBlogPosts,
} from "@/lib/cache";
import {
  generateBlogListMetadata,
  generateBlogListJsonLd,
} from "@/lib/blog-seo";

import { connection } from "next/server";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  return generateBlogListMetadata(page);
}

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

const POSTS_PER_PAGE = 20;

const page = async ({ searchParams }: PageProps) => {
  await connection();
  const params = await searchParams;
  // `?page=abc` or `?page=-3` both reach `parseInt` as NaN or a negative slice
  // index; clamp so the GROQ range stays valid and the page still renders.
  const parsedPage = parseInt(params.page || "1", 10);
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  // Three independent reads, issued together. They were awaited one after
  // another, so a render cost the sum of every Sanity round trip; in parallel it
  // costs the slowest one. All three sit behind the stale-while-revalidate cache
  // in `lib/cache.ts`, so repeat traffic never reaches Sanity at all.
  const [categories, featuredPosts, feed] = await Promise.all([
    getCachedBlogCategories(),
    getCachedFeaturedPosts(),
    getCachedBlogPosts(currentPage, POSTS_PER_PAGE),
  ]);

  const { posts, total, totalPages } = feed;

  const jsonLdScript = generateBlogListJsonLd();

  return (
    <>
      {/* JSON-LD Structured Data for SEO & GEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript }}
      />

      <div className="flex w-full mx-auto flex-col-reverse lg:max-w-[80%] min-h-screen lg:flex-row gap-2">
        <aside className="basis-full space-y-7 lg:basis-1/3 p-6 border-green-600">
          <CategorySection title="Kenyan Categories" categories={categories.featured} />
          <CategorySection title="Magazine" categories={categories.nonFeatured} />
        </aside>

        <div className="basis-full p-8 border-amber-300 lg:flex-1">
          {featuredPosts.length > 0 && (
            <div className="mb-8">
              <BlogList blogList={featuredPosts} blogTitle="Featured" />
            </div>
          )}

          {/* The non-featured feed. This was imported as `getCachedBlogPosts`
              but never rendered, so every post without `featured == true` was
              unreachable from the blog index regardless of pagination. */}
          <BlogList
            blogList={posts}
            blogTitle={currentPage > 1 ? `Latest Posts - Page ${currentPage}` : "Latest Posts"}
          />

          {currentPage < totalPages && (
            <div className="mt-10">
              <ShowMoreButton
                nextPage={currentPage + 1}
                totalPosts={total}
                currentCount={posts.length}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default page;
