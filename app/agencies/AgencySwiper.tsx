// components/AgencySwiper.tsx
"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Scrollbar } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/scrollbar";

// Only import what you need
const SwiperModules = [Navigation, Scrollbar];

export default function AgencySwiper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Swiper
      modules={SwiperModules}
      spaceBetween={10}
      slidesPerView="auto"
      navigation
      scrollbar={{ draggable: true }}
      className="w-full mt-4 !h-[180px]"
    >
      {children}
    </Swiper>
  );
}
