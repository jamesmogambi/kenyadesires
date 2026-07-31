// components/GirlItem.tsx
import { cn, formatSlugToTitle } from "@/lib/utils";
import Link from "next/link";
import React from "react";
import GirlImageSwiper from "./GirlImageSwiper";
import { Images } from "lucide-react";
import { formatPhoneNumber } from "@/lib/phone";
import { Escort } from "@/server-actions/escort.action";

interface GirlItemProps {
  girl: Escort;
  className?: string;
  handlePress?: () => void;
  path?: string;
  priority?: boolean;
}

const GirlItem = ({
  girl,
  className,
  handlePress,
  path,
  priority = false,
}: GirlItemProps) => {
  const {
    images,
    name,
    slug,
    primaryRegion,
    age,
    telephone,
    whatsappPhone,
    videos,
    county,
    imagesMetadata,
    id, // ← Get the ID from the escort object
  } = girl;

  // ✅ Ensure we have a valid ID - use slug or username as fallback
  const getEscortIdentifier = (): string => {
    // Try multiple sources for a valid identifier
    if (id) return id;
    if (slug) return slug;
    if (girl.username) return girl.username;
    // Last resort: use a fallback
    console.warn("⚠️ Escort missing ID, slug, and username:", girl);
    return `escort-${Date.now()}`;
  };

  const escortIdentifier = getEscortIdentifier();

  // ✅ Fix the path - use the identifier
  const profilePath = path || `/girl/${encodeURIComponent(escortIdentifier)}`;

  // ✅ Also provide a fallback link using the ID if available
  const fallbackPath = id ? `/girl/${id}` : null;

  const escortName = name || "Escort";

  // Helper function to get cleaned images or fallback to original images
  const getDisplayImages = () => {
    if (imagesMetadata) {
      const cleanedUrls: string[] = [];
      for (const [originalUrl, info] of Object.entries(imagesMetadata)) {
        const imageInfo = info as any;
        if (imageInfo.status === "completed" && imageInfo.cleanedUrl) {
          cleanedUrls.push(imageInfo.cleanedUrl);
        }
      }
      if (cleanedUrls.length > 0) {
        return cleanedUrls;
      }
    }
    return images || [];
  };

  const displayImages = getDisplayImages();

  return (
    <div
      className={cn(
        "text-4xl font-bold hover:shadow-xl shadow-stone-200/60 relative cursor-pointer border-[0.2px] p-0 rounded-md overflow-hidden border-gray-500",
        className,
      )}
    >
      <Link href={profilePath}>
        {/* Header - Image */}
        <GirlImageSwiper images={displayImages} priority={priority} />

        {/* Footer */}
        <div className="p-4">
          <h4 className="text-primary ml-0 md:ml-2 mb-1 text-nowrap text-base lg:text-xl font-bold capitalize">
            {escortName.split(" ").slice(0, 2).join(" ") || "Escort"}
          </h4>

          <div className="flex w-full flex-nowrap overflow-hidden border-b-[0.2px] border-gray-500 pb-2.5 font-medium lg:items-center justify-between">
            <div className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-4 text-stone-500 hidden lg:block"
              >
                <path
                  fillRule="evenodd"
                  d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                  clipRule="evenodd"
                />
              </svg>

              <span className="text-white text-sm font-semibold lg:text-lg">
                {formatSlugToTitle(`${primaryRegion}` || "Not Specified")}
              </span>
            </div>

            <span className="text-white text-nowrap text-sm lg:text-lg">
              {age} years
            </span>
          </div>

          <p className="text-lg font-semibold mt-2 lg:mt-3">
            {formatPhoneNumber(telephone || whatsappPhone)}
          </p>
        </div>
      </Link>

      {/* Display number of media */}
      <div className="fiex top-0 -left-2 absolute z-10">
        {videos && videos.length > 0 ? (
          <div className="flex items-center rounded-br-lg gap-4 p-2 px- bg-red-700 text-white/70">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-8"
            >
              <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
            </svg>

            <span className="text-xl">{videos.length}</span>
          </div>
        ) : (
          <div className="hidden lg:flex items-centerm font-semibold rounded-br-lg gap-4 p-2 px-6 bg-stone-300/50 text-black/60">
            <Images className="h-8 w-10" />
            <span className="text-xl">
              {displayImages.length > 0 ? displayImages.length : 1}
              <span className="text-sm  uppercase ml-0.5">x</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GirlItem;
