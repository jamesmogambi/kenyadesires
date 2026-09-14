import React from "react";
import CategorySection from "../CategorySection";
import BreadCrumbHeader from "./BreadCrumbHeader";
import {
  getAllCategories,
  getFeaturedPostsWithLimit,
} from "@/lib/sanity/queries";
import Head from "next/head";
import { getCachedBlogPost } from "@/lib/cache";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

interface Prop {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

const layout = async ({ children, params }: Prop) => {
  const { slug } = await params;

  const [categories, featuredPosts, post] = await Promise.all([
    getAllCategories(),
    getFeaturedPostsWithLimit(20),
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
