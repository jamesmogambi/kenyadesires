// components/AgencyListItem.tsx
"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Navigation, Pagination, Scrollbar } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { IAgency } from "@/types/agency.types";
import { getAgencyEscorts } from "@/server-actions/agency.action";
import { Escort } from "@/server-actions/escort.action";

interface Prop {
  className?: string;
  agency: IAgency & { escorts?: Escort[] };
}

// ✅ Helper functions
const getDisplayImage = (escort: Escort): string => {
  if (escort.previewPhoto && escort.previewPhoto !== "") {
    return escort.previewPhoto;
  }
  if (escort.images && escort.images.length > 0) {
    return escort.images[0];
  }
  return "/logo.jpg";
};

const getFirstName = (fullName: string): string => {
  return fullName?.split(" ")[0] || fullName || "Girl";
};

// ✅ Loading skeleton component
const LoadingSkeleton = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "border border-white/20 rounded-md h-200 lg:h-102.5 flex items-center justify-center",
      className,
    )}
  >
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-primary">Loading agency details...</p>
    </div>
  </div>
);

// ✅ Error component
const ErrorDisplay = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <div className="border border-white/20 rounded-md h-200 lg:h-102.5 flex items-center justify-center">
    <div className="text-center">
      <p className="text-red-500 mb-2">Error: {error}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors"
      >
        Retry
      </button>
    </div>
  </div>
);

// ✅ Memoized Swiper component
const EscortSwiper = React.memo(({ escorts }: { escorts: Escort[] }) => {
  if (escorts.length === 0) {
    return (
      <div className="w-full h-50 mt-4 flex items-center justify-center border border-white/10 rounded-md">
        <p className="text-white/40 font-light">No girls available</p>
      </div>
    );
  }

  return (
    <div
      className="pointer-events-auto relative z-40"
      onClick={(e) => e.stopPropagation()}
    >
      <Swiper
        modules={[Navigation, Pagination, Scrollbar, A11y]}
        spaceBetween={10}
        slidesPerView="auto"
        navigation
        scrollbar={{ draggable: true }}
        className="w-full mt-4 h-45! agency-swiper"
        breakpoints={{
          320: { slidesPerView: 2 },
          480: { slidesPerView: 3 },
          768: { slidesPerView: 4 },
          1024: { slidesPerView: 5 },
        }}
      >
        {escorts.map((escort) => {
          const imgSrc = getDisplayImage(escort);
          return (
            <SwiperSlide
              key={escort.id}
              className="border border-white/30 w-25! rounded-md overflow-hidden"
            >
              <Link
                href={`/girl/${escort.slug || escort.id}`}
                className="block w-full h-full pointer-events-auto"
              >
                <div className="relative border-white/40 w-30 h-37.5 group">
                  <Image
                    src={imgSrc}
                    alt={escort.name || "Escort"}
                    fill
                    sizes="120px"
                    style={{ objectFit: "cover" }}
                    quality={50}
                    className="transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/logo.jpg";
                    }}
                  />
                  <div className="absolute -bottom-10 left-0 right-0 text-sm font-normal mx-auto text-white/40 w-full flex items-center justify-between bg-transparent px-2 py-1.5 backdrop-blur-xs">
                    <span className="truncate font-medium">
                      {getFirstName(escort.name)}
                    </span>
                    <span className="text-right whitespace-nowrap ml-2 text-white/40 font-bold">
                      {escort.age || escort.ageCategory || "N/A"}
                      {escort.age ? " yrs" : ""}
                    </span>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
});

EscortSwiper.displayName = "EscortSwiper";

// ✅ Main component
export default function AgencyListItem({ agency, className }: Prop) {
  const { name, coverImage, contactPhone, id, slug } = agency;

  // ✅ Initialize state from server-provided escorts to avoid hydration mismatch
  const initialEscorts =
    agency.escorts && Array.isArray(agency.escorts) && agency.escorts.length > 0
      ? agency.escorts
      : [];
  const [escorts, setEscorts] = useState<Escort[]>(initialEscorts);
  const [loading, setLoading] = useState(initialEscorts.length === 0);
  const [error, setError] = useState<string | null>(null);

  // ✅ Memoize displayed escorts (limit to 10)
  const displayEscorts = useMemo(() => escorts.slice(0, 10), [escorts]);

  // ✅ Memoized fetch function
  const fetchEscorts = useCallback(async () => {
    // Check if we already have escorts in the agency object
    if (
      agency.escorts &&
      Array.isArray(agency.escorts) &&
      agency.escorts.length > 0
    ) {
      setEscorts(agency.escorts);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ✅ Use server action instead of fetch
      const result = await getAgencyEscorts(id);

      if (result.success) {
        setEscorts(result.data);
      } else {
        setError(result.error || "Failed to load girls");
      }
    } catch (err) {
      console.error("Error fetching agency escorts:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [id, agency.escorts]);

  // ✅ Fetch on mount
  useEffect(() => {
    fetchEscorts();
  }, [fetchEscorts]);

  // ✅ Handle retry
  const handleRetry = useCallback(() => {
    fetchEscorts();
  }, [fetchEscorts]);

  // ✅ Loading state
  if (loading) {
    return <LoadingSkeleton className={className} />;
  }

  // ✅ Error state
  if (error) {
    return <ErrorDisplay error={error} onRetry={handleRetry} />;
  }

  return (
    <div
      className={cn(
        "border border-white/20 overflow-hidden rounded-md h-150 lg:h-102.5 flex flex-col lg:flex-row gap-1.5 bg-transparent transition-colors relative group/item",
        className,
      )}
    >
      {/* Box 1 - Cover Image */}
      <div className="w-full h-150 lg:h-full lg:w-1/2 flex flex-col relative z-20 pointer-events-none">
        <Link
          href={`/agencies/${slug || id}`}
          className="absolute inset-0 z-0 pointer-events-auto"
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (
              target.closest(".agency-swiper") ||
              target.closest(".swiper-button-next") ||
              target.closest(".swiper-button-prev")
            ) {
              e.stopPropagation();
            }
          }}
          aria-label={`View ${name} details`}
        />
        <div className="w-full relative h-full">
          {coverImage ? (
            <Image
              src={coverImage}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover rounded-t-md lg:rounded-l-md lg:rounded-tr-none"
              priority
              alt={name}
              quality={75}
            />
          ) : (
            <Image
              src="/fallback.png"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover rounded-t-md lg:rounded-l-md lg:rounded-tr-none"
              priority
              alt={name}
              quality={75}
            />
          )}
        </div>
      </div>

      {/* Box 2 - Content */}
      <div className="w-full p-6 h-full lg:w-1/2 overflow-y-auto relative z-30 flex flex-col pointer-events-none bg-transparent">
        {/* Agency Name and Contact */}
        <div className="flex flex-col gap-2 mb-6">
          <Link
            href={`/agencies/${slug || id}`}
            className="inline-block pointer-events-auto"
          >
            <h3 className="text-3xl text-primary font-bold">{name}</h3>
          </Link>
          {contactPhone && (
            <div className="flex items-center gap-2 text-white/80 pointer-events-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6 text-white/30"
              >
                <path
                  fillRule="evenodd"
                  d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-2xl font-semibold text-white/40">
                {contactPhone}
              </span>
            </div>
          )}
        </div>

        {/* Escorts Swiper */}
        <EscortSwiper escorts={displayEscorts} />
      </div>

      {/* Global styles for Swiper */}
      <style jsx global>{`
        .agency-swiper .swiper-button-next,
        .agency-swiper .swiper-button-prev {
          color: black;
          background-color: oklch(96.7% 0.001 286.375);
          opacity: 0.6;
          border-radius: 9999px;
          padding: 12px;
          width: 38px;
          height: 38px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 50;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          pointer-events: auto !important;
        }

        .agency-swiper .swiper-button-next:hover,
        .agency-swiper .swiper-button-prev:hover {
          opacity: 0.7;
          background-color: white;
        }

        .agency-swiper .swiper-button-next::after,
        .agency-swiper .swiper-button-prev::after {
          font-size: 12px;
          font-weight: bold;
        }

        .agency-swiper .swiper-button-next {
          right: 5px;
        }

        .agency-swiper .swiper-button-prev {
          left: 5px;
        }

        .agency-swiper .swiper-scrollbar {
          background: rgba(255, 255, 255, 0.1);
          height: 4px;
        }

        .agency-swiper .swiper-scrollbar-drag {
          background: #fe0032;
        }

        @media (max-width: 640px) {
          .agency-swiper .swiper-button-next,
          .agency-swiper .swiper-button-prev {
            width: 30px;
            height: 30px;
            padding: 8px;
          }
        }
      `}</style>
    </div>
  );
}
