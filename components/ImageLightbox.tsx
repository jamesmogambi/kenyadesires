"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Keyboard, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

const FALLBACK_IMAGE = "/images/fallback.png";

interface Prop {
  images: string[];
  /** Index to open at, or null while the lightbox is closed. */
  index: number | null;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  title?: string;
}

/**
 * Full-bleed image viewer.
 *
 * Opens as a fixed overlay that covers all but a small margin, so a photo is shown
 * at close to the largest size the viewport allows. Unlike the inline galleries,
 * which use `object-cover` and crop, this uses `object-contain` so the whole image
 * is visible. Arrows, keyboard and touch swiping all move between images.
 *
 * Note: DialogContent renders its own portal and overlay, so neither is added here.
 */
const ImageLightbox = ({
  images,
  index,
  onClose,
  onIndexChange,
  title = "Gallery",
}: Prop) => {
  const isOpen = index !== null;
  const [swiper, setSwiper] = useState<any>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  // Seed from the requested index each time the lightbox opens, and reset the
  // per-image error state so a previously failed image is retried.
  useEffect(() => {
    if (index === null) return;
    setActiveIndex(index);
    setFailed({});
  }, [index, isOpen]);

  // Lock background scrolling so the page behind the overlay cannot move
  useEffect(() => {
    if (!isOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const handleSlideChange = useCallback(
    (instance: any) => {
      setActiveIndex(instance.activeIndex);
      onIndexChange?.(instance.activeIndex);
    },
    [onIndexChange],
  );

  if (!images || images.length === 0) {
    return null;
  }

  const startIndex = Math.min(Math.max(index ?? 0, 0), images.length - 1);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        // Neutralise DialogContent's centred-card defaults: no translate, full
        // width, no padding, and a viewport-height box (dvh for mobile browsers).
        // `w-full`, not `w-screen`: the element is already pinned by `inset-0`
        // and 100vw includes the scrollbar gutter.
        className="fixed inset-0 z-[100] flex h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-transparent p-0 shadow-none sm:max-w-none sm:p-2 md:p-3"
      >
        <DialogTitle className="sr-only">{title} image viewer</DialogTitle>
        <DialogDescription className="sr-only">
          Use the arrow keys or swipe to move between images.
        </DialogDescription>

        {/* Counter */}
        <div className="pointer-events-none absolute top-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-sm font-medium text-white tabular-nums backdrop-blur-sm">
          {activeIndex + 1} / {images.length}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close image viewer"
          className="absolute top-4 right-4 z-20 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-primary focus-visible:outline-2 focus-visible:outline-white"
        >
          <X size={22} />
        </button>

        <div className="relative h-full w-full flex-1">
          <Swiper
            modules={[Navigation, Pagination, A11y, Keyboard]}
            spaceBetween={0}
            slidesPerView={1}
            loop={images.length > 1}
            initialSlide={startIndex}
            keyboard={{ enabled: true }}
            navigation
            pagination={{ clickable: true, dynamicBullets: true }}
            onSwiper={setSwiper}
            onSlideChange={handleSlideChange}
            className="h-full w-full"
          >
            {images.map((src, i) => (
              <SwiperSlide key={`${src}-${i}`}>
                <div className="relative h-full w-full">
                  <Image
                    src={failed[i] ? FALLBACK_IMAGE : src}
                    alt={`${title} - Image ${i + 1}`}
                    fill
                    // contain, not cover: show the whole photo uncropped
                    className="object-contain"
                    sizes="100vw"
                    priority={i === startIndex}
                    onError={() => setFailed((prev) => ({ ...prev, [i]: true }))}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={(e) => {
                  e.stopPropagation();
                  swiper?.slidePrev();
                }}
                className="absolute top-1/2 left-2 z-20 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-primary focus-visible:outline-2 focus-visible:outline-white"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={(e) => {
                  e.stopPropagation();
                  swiper?.slideNext();
                }}
                className="absolute top-1/2 right-2 z-20 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-primary focus-visible:outline-2 focus-visible:outline-white"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Brand watermark — fixed at the bottom-right of the fullscreen viewer */}
          <div className="pointer-events-none absolute bottom-4 right-4 z-10 flex items-center justify-center rounded-md bg-black/50 px-3 py-2 ring-1 ring-white/25 backdrop-blur-sm opacity-55">
            <Image
              src="/logo.png"
              alt="kenyadesires watermark"
              width={136}
              height={34}
              className="object-contain"
              loading="eager"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageLightbox;
