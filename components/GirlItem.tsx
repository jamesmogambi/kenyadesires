"use client";
// components/GirlItem.tsx
import { cn, formatSlugToTitle, normalizeArray } from "@/lib/utils";
import Link from "next/link";
import React from "react";
import GirlImageSwiper from "./GirlImageSwiper";
import { Images, BadgeCheck, MapPin } from "lucide-react";
import { formatPhoneNumber } from "@/lib/phone";
import { Escort } from "@/server-actions/escort.action";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

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
    isVerified,
    regions,
    cleanedImages,
  } = girl;

  // ✅ Ensure we have a valid ID - use slug or username as fallback
  const getEscortIdentifier = (): string => {
    if (id) return id;
    if (slug) return slug;
    if (girl.username) return girl.username;
    console.warn("⚠️ Escort missing ID, slug, and username:", girl);
    return `escort-${Date.now()}`;
  };

  const escortIdentifier = getEscortIdentifier();

  const profilePath = path || `/girl/${encodeURIComponent(escortIdentifier)}`;

  const escortName = name || "Escort";

  // Use cleanedImages field if available (populated by map-cleaned-images script),
  // otherwise fall back to extracting from imagesMetadata, then original images
  const getDisplayImages = (): string[] => {
    let result: string[] = [];
    if (cleanedImages && normalizeArray(cleanedImages).length > 0) {
      result = normalizeArray(cleanedImages);
    } else if (imagesMetadata) {
      const cleanedUrls: string[] = [];
      for (const info of Object.values(imagesMetadata)) {
        const imageInfo = info as any;
        if (imageInfo?.status === "completed") {
          cleanedUrls.push(imageInfo.cleanedUrl || imageInfo.cloudinaryUrl);
        }
      }
      result = cleanedUrls.length > 0 ? cleanedUrls : [];
    }
    if (result.length === 0) {
      result = normalizeArray(images);
    }
    return result.filter(
      (img): img is string => typeof img === "string" && img.length > 0,
    );
  };

  const displayImages = getDisplayImages();

  // ✅ Build display text for operating regions and county
  const allRegions = React.useMemo(() => {
    const unique = new Set<string>();
    if (primaryRegion) unique.add(primaryRegion);
    (normalizeArray(regions) as string[]).forEach((r) => r && unique.add(r));
    return Array.from(unique);
  }, [regions, primaryRegion]);

  const primaryRegionTitle = formatSlugToTitle(
    `${primaryRegion}` || "Not Specified",
  );
  const allRegionsTitle = allRegions.map(formatSlugToTitle).join(", ");
  const countyTitle = formatSlugToTitle(`${county}` || "Not Specified");

  const [showRegionsTooltip, setShowRegionsTooltip] = React.useState(false);

  return (
    <div
      className={cn(
        "text-4xl font-bold hover:shadow-xl shadow-stone-200/60 relative border-[0.2px] p-0 rounded-md overflow-hidden border-gray-500",
        className,
      )}
    >
      <Link href={profilePath} className="cursor-pointer">
        {/* Header - Image */}
        <GirlImageSwiper images={displayImages} priority={priority} />

        {/* Verification badge - only rendered for verified escorts */}
        {isVerified && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute top-2 right-2 z-20 bg-green-500 rounded-full p-1.5 shadow-lg">
                  <BadgeCheck className="size-5 text-white" />
                </div>
                {/* <div className="absolute top-2 right-2 z-20  rounded-full  shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-9 text-green-600 "
                  >
                    <path
                      fill-rule="evenodd"
                      d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div> */}
              </TooltipTrigger>
              <TooltipContent>
                <p>Verified</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </Link>

      {/* Footer - not linkable, hover/tap reveals all regions + county */}
      <TooltipProvider delayDuration={0}>
        <Tooltip open={showRegionsTooltip} onOpenChange={setShowRegionsTooltip}>
          <TooltipTrigger asChild>
            <div
              className="p-4 cursor-help"
              onClick={(e) => {
                e.stopPropagation();
                setShowRegionsTooltip(!showRegionsTooltip);
              }}
            >
              <h4 className="text-primary ml-0 md:ml-2 mb-1 text-nowrap text-base lg:text-xl font-bold capitalize">
                {escortName.split(" ").slice(0, 2).join(" ") || "Escort"}
              </h4>

              <div className="flex w-full flex-nowrap overflow-hidden border-b-[0.2px] border-gray-500 pb-2 gap-2 items-center justify-between">
                <div className="flex items-center gap-1 min-w-0">
                  <MapPin className="size-3 text-stone-400 lg:size-4 shrink-0" />

                  <span className="text-white text-base font-semibold  text-nowrap min-w-0 truncate">
                    {primaryRegionTitle}
                  </span>
                </div>

                <span className="text-white text-nowrap  font-semibold text-sm lg:text-lg shrink-0">
                  {age} years
                </span>
              </div>

              <p className="text-lg font-semibold mt-3">
                {formatPhoneNumber(telephone || whatsappPhone)}
              </p>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div>
              <p className="font-semibold">Regions: {allRegionsTitle}</p>
              <p className="text-base opacity-70">County: {countyTitle}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Display number of media */}
      <div className="flex -top-1 -left-2 absolute z-10">
        {videos && videos.length > 0 ? (
          <div className="flex items-center rounded-br-lg gap-1.5 p-2.5 px-4 bg-red-700 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-5"
            >
              <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
            </svg>

            <span className="text-base font-semibold">{videos.length}</span>
          </div>
        ) : (
          <div className="hidden lg:flex items-center font-semibold rounded-br-lg gap-2 p-2.5 px-4 bg-stone-300/50 text-black/60">
            <Images className="h-6 w-7" />
            <span className="text-base">
              {displayImages.length > 0 ? displayImages.length : 1}
              <span className="text-xs uppercase ml-0.5">x</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GirlItem;
