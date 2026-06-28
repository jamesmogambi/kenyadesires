import SectionCard from "@/components/SectionCard";
import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";
import AuthorSection from "./AuthorSection";
import { Post } from "@/types/sanity";
import PortableText from "@/components/blog/PortableText";
import SanityImage from "@/components/blog/SanityImage";

interface Prop {
  blog: Post;
  className?: string;
  showBackButton?: boolean;
}

const BlogArticle = ({ blog, className, showBackButton = true }: Prop) => {
  const { _createdAt: createdAt, title, mainImage, body, author } = blog;

  const formatter = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });

  const formattedDate = formatter.format(new Date(createdAt));

  return (
    <article className={cn("", className)}>
      {/* Header */}
      <div className="lg:ml-10 border-green-700 w-fit flex justify-center items-center flex-col">
        <p className="text-primary font-bold text-base uppercase">
          published : {formattedDate}
        </p>
        <h4 className="lg:text-2xl text-xl text-center mb-6 font-bold">
          {title}
        </h4>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 8 8"
          className="size-10 text-stone-500"
        >
          <path
            fill="currentColor"
            d="M4 0C2.9 0 2 .9 2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2M3 4.81V8l1-1l1 1V4.81c-.31.11-.65.19-1 .19s-.69-.08-1-.19"
          />
        </svg>
      </div>

      {/* Main Content Section */}
      <SectionCard className="md:p-12 p-6 my-8">
        {/* ✅ Featured Image - Using SanityImage */}
        <div className="relative w-full mb-5 h-48 md:h-[350px]">
          <SanityImage
            image={mainImage}
            alt={mainImage?.alt || title || "Blog post image"}
            fill
            className="object-cover rounded-none"
            priority
            sizes="100vw"
            fallback="/og-default.jpg"
            quality={75}
          />
        </div>

        {/* ✅ Blog Content - Using PortableText */}
        <PortableText content={blog.body} />

        {/* ✅ Author Section */}
        {blog.author && <AuthorSection author={blog.author} />}

        {/* Divider */}
        <div className="border-b border-gray-1"></div>
        <div className="border-b border-gray-1 mt-14"></div>

        {/* ✅ Back Button */}
        {showBackButton && (
          <div className="flex my-8 justify-center items-center p-4">
            <Link
              href="/blog"
              className="text-white uppercase font-bold rounded-md px-6 text-base p-4 bg-primary hover:bg-primary/80 transition"
            >
              back to the blog
            </Link>
          </div>
        )}
      </SectionCard>
    </article>
  );
};

export default BlogArticle;
