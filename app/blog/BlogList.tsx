import { cn } from "@/lib/utils";
import React from "react";
import BlogLIstItem from "./BlogLIstItem";
import { Post } from "@/types/sanity";

interface Prop {
  className?: string;
  blogList: Post[];
  blogTitle?: string;
}
const BlogList = ({ blogList, className, blogTitle = "BLOG" }: Prop) => {
  if (blogList.length === 0) {
    return (
      <div className="w-full flex items-center justify-center py-8">
        <p className="text-lg text-white/50 font-medium">No posts found.</p>
      </div>
    );
  }
  return (
    <section className={cn("gap-3", className)}>
      <h3 className="text-center text-2xl mb-4 font-semibold">{blogTitle}</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ">
        {/* render posts */}

        {blogList.map((post: any, _: any) => (
          <BlogLIstItem key={_} blog={post} />
        ))}
      </div>
    </section>
  );
};

export default BlogList;
