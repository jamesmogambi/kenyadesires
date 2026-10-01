import React from "react";
import { connection } from "next/server";
import CategorySection from "../CategorySection";
import {
  getCachedBlogCategories,
  getCachedFeaturedPosts,
} from "@/lib/cache";
import BreadCrumbHeader from "../[slug]/BreadCrumbHeader";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

interface Prop {
  children: React.ReactNode;
}

const layout = async ({ children }: Prop) => {
  // Opts this route into request-time rendering before anything else runs.
  // The cache helpers in lib/cache.ts compare `Date.now()` against a TTL on
  // every read, and Cache Components rejects an unstable `Date.now()` during
  // prerender — which aborted the production build with:
  //   Route "/blog/category/[slug]": Next.js encountered the unstable value
  //   `Date.now()` while prerendering.
  // This route already opts out above and reads the CMS on every request, so
  // rendering it at request time is what it was already doing.
  await connection();

  // These two reads used to call `lib/sanity/queries` directly, bypassing the
  // cache entirely, so every category page render paid two more uncached Sanity
  // round trips on top of the page's own fetches. They now share the same cached
  // entries as the blog index, which makes the sidebar free on repeat traffic.
  const [categories, featuredPosts] = await Promise.all([
    getCachedBlogCategories(),
    getCachedFeaturedPosts(),
  ]);

  const { featured, nonFeatured } = categories;

  return (
    <>
      <BreadCrumbHeader title={featuredPosts[0]?.title} />
      <div className="flex w-full mx-auto flex-col-reverse lg:max-w-[80%] min-h-screen lg:flex-col lg:flex-row gap-2 ">
        {/* categories section*/}
        <aside className=" basis-full space-y-7 lg:basis-1/3 p-6  border-green-600">
          {/* // featured categories */}
          <CategorySection title="Kenya Categories" categories={featured} />
          {/* // non-featured categories */}
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
