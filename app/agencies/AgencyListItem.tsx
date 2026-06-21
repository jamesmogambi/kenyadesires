"use client";
import React, {useEffect, useState} from "react";
import {Swiper, SwiperSlide} from "swiper/react";
import {A11y, Navigation, Pagination, Scrollbar} from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import {cn} from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import {IAgency} from "@/types/agency.types";
import {Escort} from "@/server-actions/escort.action";
import {IEscort} from "@/types/escort.types";

interface Prop {
    className?: string;
    agency: IAgency & { escorts?: (Escort | IEscort)[] };
}

// Helper function to get first gallery image or profile image
function getDisplayImage(escort: any): string {
    const e = escort as any;
    // Try server-action Escort type properties first (more common in this project)
    if (e.previewPhoto && e.previewPhoto !== "") {
        return e.previewPhoto;
    }
    if (e.images && e.images.length > 0) {
        return e.images[0];
    }

    // Fallback to IEscort type properties
    if (e.profileImage && e.profileImage !== "") {
        return e.profileImage;
    }
    if (e.gallery && e.gallery.length > 0) {
        return e.gallery[0];
    }
    return "/logo.jpg";
}

// Helper to format joined date
function formatDate(dateString: string): string {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}

// Helper to get first name
function getFirstName(fullName: string): string {
    return fullName?.split(" ")[0] || fullName;
}

export default function AgencyListItem({agency, className}: Prop) {
    const {name, coverImage, contactPhone, id} = agency;

    // State management
    const [escorts, setEscorts] = useState<(Escort | IEscort)[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const displayEscorts = React.useMemo(() => escorts.slice(0, 10), [escorts]); // Limit to 10 escorts for performance

    // Fetch escorts data
    useEffect(() => {
        let isMounted = true;
        const fetchEscorts = async () => {
            // Check if we already have escorts in the agency object (if extended)
            if (agency.escorts && Array.isArray(agency.escorts)) {
                if (isMounted) {
                    setEscorts(agency.escorts);
                    setLoading(false);
                }
                return;
            }

            if (isMounted) {
                setLoading(true);
                setError(null);
            }

            try {
                const baseUrl =
                    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4000";

                const response = await fetch(`${baseUrl}/api/agencies/${id}/escorts`);

                if (!response.ok) {
                    throw new Error("Failed to fetch escorts");
                }

                const escortsData = await response.json();

                if (isMounted) {
                    if (escortsData.success) {
                        setEscorts(escortsData.data.escorts);
                    } else {
                        setError("Failed to load girls");
                    }
                }
            } catch (err) {
                console.error("Error fetching agency escorts:", err);
                if (isMounted) {
                    setError(err instanceof Error ? err.message : "An error occurred");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        if (id) {
            fetchEscorts();
        }

        return () => {
            isMounted = false;
        };
    }, [id]);

    // Loading state
    if (loading) {
        return (
            <div
                className={cn(
                    "border border-white/20 rounded-md h-[800px] lg:h-[410px] flex items-center justify-center",
                    className,
                )}
            >
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-primary">Loading agency details...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div
                className={cn(
                    "border border-white/20 rounded-md h-[800px] lg:h-[410px] flex items-center justify-center",
                    className,
                )}
            >
                <div className="text-center">
                    <p className="text-red-500 mb-2">Error: {error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-primary text-white rounded-md"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "border border-white/20 overflow-hidden rounded-md h-[600px] lg:h-[410px] flex flex-col lg:flex-row gap-1.5 bg-transparent  transition-colors relative group/item",
                className,
            )}
        >
            {/* Box 1 - Cover Image */}
            <div className="w-full h-[600px] lg:h-full lg:w-1/2 flex flex-col relative z-20 pointer-events-none">
                <Link href={`/agencies/${id}`} className="absolute inset-0 z-0 pointer-events-auto"
                      onClick={(e) => {
                          // Prevent navigation if clicking on things that should be interactive but are not captured
                          const target = e.target as HTMLElement;
                          if (target.closest('.agency-swiper') || target.closest('.swiper-button-next') || target.closest('.swiper-button-prev')) {
                              e.stopPropagation();
                          }
                      }}
                      aria-label={`View ${name} details`}/>
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
                        <div
                            className="w-full h-full bg-linear-to-br from-gray-700 to-gray-900 flex items-center justify-center rounded-t-md lg:rounded-l-md lg:rounded-tr-none">
                            <span className="text-white/40 text-lg font-light">No Cover Image</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Box 2 - Content (Name, Contact & Girls Slider) */}
            <div
                className="w-full p-6  h-full lg:w-1/2 overflow-y-auto relative z-30 flex flex-col  pointer-events-none bg-transparent">
                {/* Agency Name and Contact */}
                <div className="flex flex-col gap-2 mb-6">
                    <Link href={`/agencies/${id}`} className=" inline-block pointer-events-auto">
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
                            <span className="text-2xl font-semibold text-white/40">{contactPhone}</span>
                        </div>
                    )}
                </div>

                {/*<h4 className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-2">Our Featured*/}
                {/*    Girls</h4>*/}

                {/* Description */}
                {/*{description && (
          <p className="text-white/60 text-sm mt-3 line-clamp-2">
            {description}
          </p>
        )}*/}

                {/* Escorts Count */}
                {/*<div className="mt-3">
          <span className="text-white/40 text-sm">
            {escortsCount} Escort{escortsCount !== 1 ? "s" : ""} Available
          </span>
        </div>*/}

                {/* Images Swiper */}
                {displayEscorts.length > 0 ? (
                    <div className="pointer-events-auto relative z-40" onClick={(e) => e.stopPropagation()}>
                        <Swiper
                            modules={[Navigation, Pagination, Scrollbar, A11y]}
                            spaceBetween={10}
                            slidesPerView={"auto"}
                            navigation
                            scrollbar={{draggable: true}}
                            className="w-full mt-4 !h-[180px] agency-swiper"
                        >
                            {displayEscorts.map((member, index: number) => {
                                const slideKey = member.id ? `escort-${member.id}` : `escort-index-${index}`;
                                const imgSrc = getDisplayImage(member);
                                const m = member as any;
                                return (
                                    <SwiperSlide
                                        key={slideKey}
                                        className="border border-white/30 !w-[100px] rounded-md overflow-hidden"
                                    >
                                        <Link href={`/girl/${member.id}`}
                                              className="block w-full h-full pointer-events-auto">
                                            <div className="relative border-white/40 w-[120px] h-[150px] group">
                                                <Image
                                                    src={imgSrc}
                                                    alt={`${m.name || "Escort"} ${index + 1}`}
                                                    fill
                                                    sizes="120px"
                                                    style={{objectFit: "cover"}}
                                                    quality={75}
                                                    className="transition-transform duration-300 group-hover:scale-110"
                                                    onError={(e) => {
                                                        // Fallback if image fails to load
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = "/logo.jpg";
                                                    }}
                                                />
                                                <div
                                                    className="absolute  -bottom-10 left-0 right-0 text-sm font-normal mx-auto text-white/40 w-full flex items-center justify-between bg-transparent px-2 py-1.5 backdrop-blur-xs">
                                        <span className="truncate font-medium">
                                            {getFirstName(m.name || "Girl")}
                                        </span>
                                                    <span
                                                        className="text-right whitespace-nowrap ml-2 text-white/40 font-bold">
                                            {m.age || m.ageCategory || "N/A"} {m.age ? "yrs" : ""}
                                        </span>
                                                </div>
                                            </div>
                                        </Link>
                                    </SwiperSlide>
                                );
                            })}
                        </Swiper>
                    </div>
                ) : (
                    <div
                        className="w-full h-[200px] mt-4 flex items-center justify-center border-0 border-white/20 rounded-md">
                        <p className="text-white/40 font-light">No girls available</p>
                    </div>
                )}

                {/* Location - Uncomment if needed */}
                {/* <p className="text-center drop-shadow-gray-600 bg-[#252525]/70 shadow-inner tracking-wider text-white/40 text-lg font-semibold mb-2">
          {agency.region}, {agency.county}
        </p> */}
            </div>

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

                /* Scrollbar styling */
                .agency-swiper .swiper-scrollbar {
                    background: rgba(255, 255, 255, 0.1);
                    height: 4px;
                }

                .agency-swiper .swiper-scrollbar-drag {
                    background: #fe0032;
                }

                /* For mobile devices (max-width: 640px) */
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
