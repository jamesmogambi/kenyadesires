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
      className={cn("w-full", className)}
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

      <h4 className="mt-5 text-xl overflow-hidden text-center text-primary font-semibold line-clamp-2">
        {blog.title}
      </h4>
    </Link>
  );
};

export default BlogListItem;
