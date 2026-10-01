import React from "react";
import { connection } from "next/server";
import CategorySection from "../CategorySection";
import BreadCrumbHeader from "./BreadCrumbHeader";
import {
  getCachedBlogCategories,
  getCachedFeaturedPosts,
  getCachedBlogPost,
} from "@/lib/cache";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

interface Prop {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

const layout = async ({ children, params }: Prop) => {
  // Request-time opt-in, see app/blog/category/layout.tsx. The cache helpers
  // read `Date.now()` for their TTL, which Cache Components refuses to evaluate
  // during prerender.
  await connection();

  const { slug } = await params;

  // The sidebar reads came straight from `lib/sanity/queries`, so every blog post
  // render paid two uncached Sanity round trips on top of the article fetch. All
  // three now share the cached entries, so repeat views cost one map lookup
  // each.
  const [categories, featuredPosts, post] = await Promise.all([
    getCachedBlogCategories(),
    getCachedFeaturedPosts(),
    getCachedBlogPost(slug),
  ]);

  const { featured, nonFeatured } = categories;

  return (
    <>
      <BreadCrumbHeader
        title={post?.title || featuredPosts[0]?.title || "Blog"}
        category={post?.categories?.[0]?.name}
      />
      <div className="flex w-full mx-auto flex-col-reverse  lg:max-w-[80%] min-h-screen lg;flex-col lg:flex-row gap-2 ">
        {/* categories section*/}
        <aside className=" basis-full space-y-7 lg:basis-1/3 p-6  border-green-600">
          <CategorySection title="Kenya Categories" categories={featured} />
          <CategorySection title="Magazine" categories={nonFeatured} />
        </aside>

        {/* render blog */}
        <article className="basis-full p-8  border-amber-300 lg:flex-1">
          {/* Posts Grid */}
          {children}
        </article>
      </div>
    </>
  );
};

export default layout;
