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
                    quality={50}
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

        {/* Custom Navigation Buttons */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="custom-swiper-button-prev"
              aria-label="Previous slide"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="custom-swiper-button-next"
              aria-label="Next slide"
            >
              <ChevronRight size={24} />
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
            spaceBetween={10}
            slidesPerView={4}
            breakpoints={{
              320: { slidesPerView: 3 },
              640: { slidesPerView: 4 },
              768: { slidesPerView: 5 },
              1024: { slidesPerView: 6 },
              1280: { slidesPerView: 8 },
            }}
            navigation
            scrollbar={{ draggable: true }}
            onSwiper={(swiper: any) => (thumbSwiperRef.current = swiper)}
            className="thumbnails-swiper"
          >
            {photos.map((src, index) => (
              <SwiperSlide key={index}>
                <div
                  className={cn(
                    "relative aspect-square cursor-pointer transition-all duration-200 rounded-lg overflow-hidden border-2",
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
        .custom-swiper-button-prev,
        .custom-swiper-button-next {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background-color: white;
          color: black;
          opacity: 0.5;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          z-index: 10;
          padding: 0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .group:hover .custom-swiper-button-prev,
        .group:hover .custom-swiper-button-next {
          opacity: 0.5;
        }

        .custom-swiper-button-prev:hover,
        .custom-swiper-button-next:hover {
          opacity: 0.5 !important;
          background-color: white;
          transform: translateY(-50%) scale(1.1);
          color: #fe0032;
        }

        .custom-swiper-button-prev {
          left: 16px;
        }

        .custom-swiper-button-next {
          right: 16px;
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

        /* Thumbnail Swiper Navigation */
        .thumbnails-swiper .swiper-button-next,
        .thumbnails-swiper .swiper-button-prev {
          color: #333;
          background-color: rgba(255, 255, 255, 0.9);
          width: 30px;
          height: 30px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border-radius: 50%;
        }

        .thumbnails-swiper .swiper-button-next::after,
        .thumbnails-swiper .swiper-button-prev::after {
          font-size: 12px;
        }

        .thumbnails-swiper .swiper-button-next:hover,
        .thumbnails-swiper .swiper-button-prev:hover {
          background-color: white;
          transform: scale(1.05);
        }

        .thumbnails-swiper .swiper-scrollbar {
          background: rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 640px) {
          .custom-swiper-button-prev,
          .custom-swiper-button-next {
            width: 32px;
            height: 32px;
            opacity: 0.8;
          }

          .thumbnails-swiper .swiper-button-next,
          .thumbnails-swiper .swiper-button-prev {
            width: 24px;
            height: 24px;
          }

          .swiper-pagination-bullet-active {
            width: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default PhotoGallery;
