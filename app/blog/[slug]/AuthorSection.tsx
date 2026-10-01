import { cn } from "@/lib/utils";
import { Author } from "@/types/sanity";
import SanityImage from "@/components/blog/SanityImage";
import React from "react";

interface Prop {
  className?: string;
  author: Author;
}
const AuthorSection = ({ author, className }: Prop) => {
  const { name, bio, _id, image } = author;
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
        {/* Was `next/image` with a raw `urlFor()` src. That sent the avatar
            through the optimizer, which re-fetches it from cdn.sanity.io
            server-side — the same hop that timed out and left author photos
            blank. `SanityImage` now serves CMS assets straight from the CDN. */}
        <SanityImage
          image={image}
          fallback="/og-default.png"
          alt={name}
          fill
          // The avatar is `basis-full` on mobile but only `md:basis-1/5` from
          // md up, so 100vw made Next fetch a ~5x oversized image.
          sizes="(min-width: 768px) 20vw, 100vw"
          priority
        />
      </div>
    </div>
  );
};

export default AuthorSection;
