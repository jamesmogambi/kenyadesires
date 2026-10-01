import SectionCard from "@/components/SectionCard";
import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";
import AuthorSection from "./AuthorSection";
import { Post } from "@/types/sanity";
import PortableText from "@/components/blog/PortableText";
import SanityImage from "@/components/blog/SanityImage";
import CommentList from "@/components/blog/CommentList";
import CommentForm from "@/components/blog/CommentForm";
import FaqSection from "@/components/blog/FaqSection";
import { getCachedCommentsByPostSlug, getCachedRelatedPosts } from "@/lib/cache";

interface Prop {
  blog: Post;
  className?: string;
  showBackButton?: boolean;
}

const BlogArticle = async ({
  blog,
  className,
  showBackButton = true,
}: Prop) => {
  const {
    _createdAt: createdAt,
    _updatedAt: updatedAt,
    title,
    mainImage,
    body,
    author,
    categories,
    faq,
  } = blog;
  const postSlug = blog.slug?.current || "";
  const comments = await getCachedCommentsByPostSlug(postSlug);

  const formatter = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });

  const formattedDate = formatter.format(new Date(createdAt));
  const formattedUpdatedDate = updatedAt
    ? formatter.format(new Date(updatedAt))
    : null;

  const relatedPosts =
    categories.length > 0
      ? await getCachedRelatedPosts(categories[0]._id, blog._id, 3)
      : [];

  return (
    <article className={cn("", className)}>
      {/* Header */}
      <div className="lg:ml-10 border-green-700 w-fit flex justify-center items-center flex-col">
        <p className="text-primary font-bold text-base uppercase">
          published : {formattedDate}
        </p>
        {formattedUpdatedDate && formattedUpdatedDate !== formattedDate && (
          <p className="text-white/60 font-bold text-sm uppercase mt-1">
            last updated : {formattedUpdatedDate}
          </p>
        )}
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
        {/* Featured Image */}
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

        {/* Blog Content */}
        <PortableText content={blog.body} />

        {/* FAQ Section */}
        <FaqSection faq={faq || []} />

        {/* Author Section */}
        {blog.author && <AuthorSection author={blog.author} />}

        {/* Divider */}
        <div className="border-b border-gray-1"></div>
        <div className="border-b border-gray-1 mt-14"></div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-primary mb-6">
              Related Articles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((post: any) => (
                <Link
                  key={post._id}
                  href={`/blog/${post.slug?.current}`}
                  className="group"
                >
                  <div className="relative w-full h-48 bg-transparent mb-3">
                    <SanityImage
                      image={post.mainImage}
                      alt={post.mainImage?.alt || post.title || "Blog post image"}
                      fill
                      className="object-cover group-hover:opacity-80 transition-opacity"
                      sizes="100vw"
                      fallback="/og-default.jpg"
                    />
                  </div>
                  <h4 className="text-lg text-center text-primary font-semibold group-hover:underline line-clamp-2">
                    {post.title}
                  </h4>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back Button */}
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

        {/* Comments Section */}
        <div className=" border-gray-1 pt-10 mt-5">
          <h3 className="text-2xl font-bold text-white/20 mb-6">
            Comments ({comments.length})
          </h3>

          <CommentList comments={comments} className="mb-10" />

          <div className=" border-gray-1 pt-8">
            <h4 className="text-xl font-bold text-primary mb-4">
              Leave a comment
            </h4>
            <CommentForm postSlug={postSlug} />
          </div>
        </div>
      </SectionCard>
    </article>
  );
};

export default BlogArticle;
