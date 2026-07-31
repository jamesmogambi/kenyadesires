"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Navigation, Pagination, Scrollbar } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Prop {
  images: string[];
  priority?: boolean;
}

// Fallback image if image fails to load
const FALLBACK_IMAGE = "/images/fallback.png";

const GirlImageSwiper = ({ images, priority = false }: Prop) => {
  const [swiperRef, setSwiperRef] = useState<any>(null);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (swiperRef) swiperRef.slidePrev();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (swiperRef) swiperRef.slideNext();
  };

  if (!images || images.length === 0) {
    return (
      <div className="w-full relative bg-transparent rounded-t-lg flex items-center justify-center h-50 lg:h-75">
        <span className="text-gray-400">No images available</span>
      </div>
    );
  }

  return (
    <div className="w-full relative group">
      <div className="relative">
        <Swiper
          modules={[Navigation, Pagination, Scrollbar, A11y]}
          spaceBetween={0}
          slidesPerView={1}
          pagination={{ clickable: true, dynamicBullets: true }}
          scrollbar={{ draggable: true }}
          loop={images.length > 1}
          className="rounded-t-lg overflow-hidden"
          onSwiper={setSwiperRef}
        >
          {images.map((src, index) => {
            const imageSrc = imageErrors[index] ? FALLBACK_IMAGE : src;

            return (
              <SwiperSlide key={index}>
                <div className="relative w-full h-50 lg:h-75 bg-transparent">
                  <div className="absolute inset-0 pb-1.25">
                    <Image
                      src={imageSrc}
                      alt={`Slide ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={priority}
                      loading={priority ? "eager" : "lazy"}
                      // quality={50}
                      onError={() => handleImageError(index)}
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1.25 bg-primary"></div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* ✅ Always show navigation buttons, even for single image */}
        <button
          type="button"
          onClick={handlePrev}
          className="custom-swiper-button-prev absolute top-1/2 -translate-y-1/2 left-2 z-10 w-10 h-10 rounded-full bg-stone-300/50 text-black/60 flex items-center justify-center border-none cursor-pointer transition-all duration-300 hover:bg-[#fe0032] hover:text-white hover:scale-110"
          aria-label="Previous slide"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="custom-swiper-button-next absolute top-1/2 -translate-y-1/2 right-2 z-10 w-10 h-10 rounded-full bg-stone-300/50 text-black/60 flex items-center justify-center border-none cursor-pointer transition-all duration-300 hover:bg-[#fe0032] hover:text-white hover:scale-110"
          aria-label="Next slide"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <style jsx global>{`
        .swiper-pagination-bullet {
          background-color: white;
          opacity: 0.7;
        }

        .swiper-pagination-bullet-active {
          background-color: #fe0032;
          opacity: 1;
        }

        .swiper-scrollbar {
          background: rgba(0, 0, 0, 0.3);
          bottom: 0;
        }

        .swiper-scrollbar-drag {
          background: #fe0032;
        }
      `}</style>
    </div>
  );
};

export default GirlImageSwiper;
