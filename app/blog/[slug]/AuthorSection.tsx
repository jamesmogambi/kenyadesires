import { urlFor } from "@/lib/sanity/client";
import { cn } from "@/lib/utils";
import { Author } from "@/types/sanity";
import Image from "next/image";
import React from "react";

interface Prop {
  className?: string;
  author: Author ;
}
const AuthorSection = ({ author, className }: Prop) => {
  console.log("author==>", author);

  const {  name, bio, _id,image } = author;
  return (
    <div
      className={cn(
        "flex bg-black/50 p-6 my-8 flex-col md:flex-row gap-6",
        className,
      )}
    >
      {/* <section 1 */}
      <div className="basis-full md:basis-3/4">
        <h3 className="text-2xl font-semibold text-primary">{name}</h3>

        <p className="text-base text-white/50 mt-2   font-medium">{bio}</p>
      </div>
      {/* avatar */}
      <div className="relative basis-full h-42   md:basis-1/5  ">
        <Image
          src={image ? urlFor(image) : "/og-default.png"}
          alt={name}
          fill // This makes the image fill the parent container
          className="object-cover" // This ensures the image covers the area
          sizes="100vw" // Tell Next.js this image is full width
          priority // Optional: if it's above the fold
          quality={90}
        />
      </div>
    </div>
  );
};

export default AuthorSection;
