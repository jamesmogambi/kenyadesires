"use client";
import React, { useRef, useState } from "react";
import { A11y, Navigation, Pagination, Scrollbar } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Prop {
  photos: string[];
  title?: string;
}

const PhotoGallery = ({ photos, title = "Gallery" }: Prop) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mainSwiper, setMainSwiper] = useState<any>(null);
  const thumbSwiperRef = useRef<any | null>(null);

  // Sync thumbnails when main slide changes
  const handleMainSlideChange = (swiper: any) => {
    setCurrentIndex(swiper.activeIndex);
    if (thumbSwiperRef.current) {
      thumbSwiperRef.current.slideTo(swiper.activeIndex);
    }
  };

  // Handle thumbnail click
  const handleThumbClick = (index: number) => {
    setCurrentIndex(index);
    if (mainSwiper) {
      mainSwiper.slideTo(index);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (mainSwiper) mainSwiper.slidePrev();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (mainSwiper) mainSwiper.slideNext();
  };

  if (!photos || photos.length === 0) {
    return (
      <div className="mt-5 w-full bg-transparent rounded-lg flex items-center justify-center h-100">
        <span className="text-gray-400">No photos available</span>
      </div>
    );
  }

  return (
    <div className="mt-5 w-full group">
      {/* Main Image Swiper */}
      <div className="relative w-full h-100 md:h-125 lg:h-150 bg-transparent rounded-t-lg overflow-hidden">
        <Swiper
          modules={[Navigation, Pagination, Scrollbar, A11y]}
          spaceBetween={0}
          slidesPerView={1}
          pagination={{ clickable: true }}
          scrollbar={{ draggable: true }}
          loop={photos.length > 1}
          onSwiper={setMainSwiper}
          onSlideChange={handleMainSlideChange}
          className="w-full h-full"
        >
          {photos.map((src, index) => (
            <SwiperSlide key={index}>
              <div className="relative w-full h-full bg-transparent">
                <div className="absolute inset-0 pb-1.25">
                  <Image
                    src={src}
                    alt={`${title} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    priority={index === 0}
                    loading={index === 0 ? "eager" : "lazy"}
                    onError={(e) => {
                      console.error(`Failed to load image: ${src}`);
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1.25 bg-primary"></div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Main Navigation Buttons */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute top-1/2 -translate-y-1/2 left-2 z-20 w-13 h-13 rounded-full bg-stone-300/50 text-black/60 flex items-center justify-center border-none cursor-pointer transition-all duration-300 hover:bg-[#fe0032] hover:text-white hover:scale-110"
              aria-label="Previous slide"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute top-1/2 -translate-y-1/2 right-2 z-20 w-13 h-13 rounded-full bg-stone-300/50 text-black/60 flex items-center justify-center border-none cursor-pointer transition-all duration-300 hover:bg-[#fe0032] hover:text-white hover:scale-110"
              aria-label="Next slide"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        {/* Image Counter Badge */}
        <div className="absolute top-4 hidden right-4 z-10 bg-black/60 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm">
          {currentIndex + 1} / {photos.length}
        </div>
      </div>

      {/* Thumbnail Navigation */}
      {photos.length > 1 && (
        <div className="mt-4 w-full">
          <Swiper
            modules={[Navigation, Scrollbar]}
            spaceBetween={6}
            slidesPerView={4}
            breakpoints={{
              320: { slidesPerView: 3, spaceBetween: 4 },
              480: { slidesPerView: 4, spaceBetween: 6 },
              640: { slidesPerView: 5, spaceBetween: 8 },
              768: { slidesPerView: 6, spaceBetween: 8 },
              1024: { slidesPerView: 7, spaceBetween: 8 },
              1280: { slidesPerView: 8, spaceBetween: 8 },
            }}
            onSwiper={(swiper: any) => (thumbSwiperRef.current = swiper)}
            className="thumbnails-swiper"
          >
            {photos.map((src, index) => (
              <SwiperSlide key={index}>
                 <div
                   className={cn(
                     "relative w-full aspect-square cursor-pointer transition-all duration-200 rounded-lg overflow-hidden border-2",
                     index === currentIndex
                       ? "border-primary scale-95 shadow-lg"
                       : "border-transparent opacity-60 hover:opacity-100 hover:scale-95",
                   )}
                   onClick={() => handleThumbClick(index)}
                 >
                  <Image
                    src={src}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, 15vw"
                    quality={50}
                    loading="lazy"
                  />
                  {index === currentIndex && (
                    <div className="absolute inset-0 bg-primary/20 pointer-events-none" />
                  )}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx global>{`
        .swiper-button-next,
        .swiper-button-prev {
          display: none !important;
        }

        /* Main Swiper Pagination */
        .swiper-pagination-bullet {
          background-color: white;
          opacity: 0.7;
          width: 8px;
          height: 8px;
          transition: all 0.3s ease;
        }

        .swiper-pagination-bullet-active {
          background-color: #fe0032;
          opacity: 1;
          width: 24px;
          border-radius: 4px;
        }

        /* Main Swiper Scrollbar */
        .swiper-scrollbar {
          background: rgba(255, 255, 255, 0.3);
          bottom: 8px;
        }

        .swiper-scrollbar-drag {
          background: #fe0032;
        }

        /* Thumbnail Swiper Scrollbar */
        .thumbnails-swiper .swiper-scrollbar {
          background: rgba(0, 0, 0, 0.08);
          border-radius: 4px;
          height: 4px;
        }

        .thumbnails-swiper .swiper-scrollbar-drag {
          background: #fe0032;
          border-radius: 4px;
        }

        /* Mobile Optimizations */
        @media (max-width: 640px) {
          .swiper-pagination-bullet-active {
            width: 18px;
          }
        }

        /* Ensure thumbnail swiper container allows overflow for buttons */
        .thumbnails-swiper {
          padding: 0 20px !important;
        }

        @media (max-width: 640px) {
          .thumbnails-swiper {
            padding: 0 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PhotoGallery;
