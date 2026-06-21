import { cn } from "@/lib/utils";
import { Post } from "@/types/sanity";
import Link from "next/link";
import React from "react";
import SanityImage from "@/components/blog/SanityImage";

interface Prop {
  blog: Post;
  className?: string;
}

const BlogListItem = ({ blog, className }: Prop) => {
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
          sizes="100vw"
          priority
          fallback="/og-default.jpg"
        />
      </div>

      <h4 className="mt-5 text-xl text-center text-primary font-semibold">
        {blog.title}
      </h4>
    </Link>
  );
};

export default BlogListItem;
