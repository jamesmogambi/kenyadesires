import { cn } from "@/lib/utils";
import { Post } from "@/types/sanity";
import Link from "next/link";
import React from "react";
import SanityImage from "@/components/blog/SanityImage";

interface Prop {
  blog: Post;
  className?: string;
  /**
   * Eagerly fetch the card image. Only true for the cards in the first row —
   * see `BlogList`. Passing `priority` to every card made the preloader queue
   * all of them and compete with the rest of the page.
   */
  priority?: boolean;
}

const BlogListItem = ({ blog, className, priority = false }: Prop) => {
  return (
    <Link
      href={`/blog/${blog.slug?.current}`}
      // `flex h-full flex-col` plus `mt-auto` on the title keeps every headline
      // in a grid row sitting on the same baseline. Without it, one long title
      // would push its own card taller and leave its neighbours' titles
      // floating at different heights in the same row.
      className={cn("flex h-full w-full flex-col", className)}
    >
      <div className="relative w-full h-48 bg-transparent">
        <SanityImage
          image={blog.mainImage}
          alt={blog.mainImage?.alt || blog.title || "Blog post image"}
          fill
          className="object-cover"
          sizes="(min-width: 768px) 33vw, 100vw"
          priority={priority}
          fallback="/og-default.jpg"
        />
      </div>

      {/* `line-clamp-2` caps the headline at two lines and hides whatever does not
          fit, rather than showing an ellipsis. Headlines here run long
          ("Best Escort Areas in Nairobi: Westlands, Kilimani, Kileleshwa,
          Lavington & More (2026)"), so without the cap a single card would
          grow three or four lines tall and unbalance the whole grid row.
          `mt-auto` still bottoms the title inside the stretched card, so a
          one-line and a two-line title sit on the same baseline. */}
      <h4 className="mt-auto pt-5 line-clamp-2 overflow-hidden break-words text-xl text-center text-primary font-semibold">
        {blog.title}
      </h4>
    </Link>
  );
};

export default BlogListItem;
