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
  getAllCategories,
  getFeaturedPostsWithLimit,
} from "@/lib/sanity/queries";
import {
  generateBlogListMetadata,
  generateBlogListJsonLd,
} from "@/lib/blog-seo";

// ✅ ISR - 7 days
export const revalidate = 604800;

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

const page = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const currentPage = parseInt(params.page || "1");
  const POSTS_PER_PAGE = 20;

  const featuredPosts = await getCachedFeaturedPosts();
  const { featured, nonFeatured } = await getAllCategories();

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
          <CategorySection title="Kenyan Categories" categories={featured} />
          <CategorySection title="Magazine" categories={nonFeatured} />
        </aside>

        <div className="basis-full p-8 border-amber-300 lg:flex-1">
          {featuredPosts.length > 0 && (
            <div className="mb-8">
              <BlogList blogList={featuredPosts} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default page;
