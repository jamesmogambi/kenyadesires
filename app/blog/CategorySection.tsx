import { cn, slugify } from "@/lib/utils";
import { Category } from "@/types/sanity";
import Link from "next/link";
import React from "react";

export interface BlogCategory {
  name: string;
  slug: string;
}
interface Prop {
  className?: string;
  title: string;
  categories: Category[];
}
const CategorySection = ({ categories, title, className }: Prop) => {
  return (
    <ul
      className={cn(
        "w-full bg-stone-900 flex flex-col border border-black ",
        className,
      )}
    >
      {/* header */}
      <li className="bg-black px-2 text-primary text-xl font-semibold p-5">
        {title}
      </li>

      {/* loop through the categories */}

      {categories?.map((category, _) => (
        <Link
          className="p-5 text-base font-medium py-2.5"
          href={`/blog/category/${slugify(category.name)}`}
          key={category._id}
        >
          {category.name}
        </Link>
      ))}
    </ul>
  );
};

export default CategorySection;
