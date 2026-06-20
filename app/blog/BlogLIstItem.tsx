import { cn } from "@/lib/utils";
import { Post } from "@/types/sanity";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { urlFor } from "@/lib/sanity/client";

interface Prop {
  blog: Post;
  className?: string;
}

const BlogListItem = ({ blog, className }: Prop) => {
  // Use urlFor helper to get image URL
  const imageUrl = blog.mainImage ? urlFor(blog.mainImage) : null;

  return (
    <Link href={`/blog/${blog.slug?.current}`} className={cn("w-full", className)}>
      <div className="relative w-full h-48 bg-gray-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={blog.mainImage?.alt || blog.title || "Blog post image"}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
            <span className="text-sm">No image</span>
          </div>
        )}
      </div>

      <h4 className="mt-5 text-xl text-center text-primary font-semibold">
        {blog.title}
      </h4>
    </Link>
  );
};

export default BlogListItem;