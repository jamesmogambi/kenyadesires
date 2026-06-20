import { cn } from "@/lib/utils";
import React from "react";
import BlogLIstItem from "./BlogLIstItem";
import { Post } from "@/types/sanity";

interface Prop {
  className?: string;
  blogList: Post[];
}
const BlogList = ({ blogList, className }: Prop) => {
  return (
    <section className={cn("gap-3", className)}>
      <h3 className="text-center text-2xl mb-4 font-semibold">BLOG</h3>

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
