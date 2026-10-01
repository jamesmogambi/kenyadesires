"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

/**
 * Floating scroll controls.
 *
 * The previous version was a single button that toggled its direction, so it
 * only offered "scroll up" after the user had already reached the very bottom
 * of the page — and only offered "scroll down" from the very top. On a long
 * listing that meant long dead scrolling with no useful control.
 *
 * These are two independent buttons that appear as soon as they have somewhere
 * useful to take you:
 *   - Up appears once there is a meaningful amount of page above you.
 *   - Down appears once there is a meaningful amount of page below you.
 *
 * Both thresholds are deliberately smaller than the page height so the
 * controls react immediately instead of waiting for a hard edge, and both are
 * evaluated against the same cached layout metrics so they stay consistent
 * while the user scrolls.
 */

// Show the up button once the user is this far down the page.
const UP_REVEAL_OFFSET = 160;
// Show the down button while at least this much of the page is still below.
const DOWN_REVEAL_REMAINING = 320;

interface ScrollMetrics {
  canScrollUp: boolean;
  canScrollDown: boolean;
}

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function ScrollToTopBottom() {
  const [metrics, setMetrics] = useState<ScrollMetrics>({
    canScrollUp: false,
    canScrollDown: false,
  });

  // Scroll listeners fire far more often than React needs to re-render. Measure
  // on every event, but only commit to state when a threshold actually flips.
  const frameRef = useRef<number | null>(null);
  const metricsRef = useRef<ScrollMetrics>({ ...metrics });

  useEffect(() => {
    const measure = () => {
      frameRef.current = null;

      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      // `scrollHeight` can lag the visual viewport on mobile while the address
      // bar collapses, so take the larger of the two document measurements.
      const documentHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
      );

      const next: ScrollMetrics = {
        canScrollUp: scrollY > UP_REVEAL_OFFSET,
        canScrollDown:
          scrollY + viewportHeight < documentHeight - DOWN_REVEAL_REMAINING,
      };

      const previous = metricsRef.current;
      if (
        previous.canScrollUp !== next.canScrollUp ||
        previous.canScrollDown !== next.canScrollDown
      ) {
        metricsRef.current = next;
        setMetrics(next);
      }
    };

    const scheduleMeasure = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(measure);
    };

    measure();

    window.addEventListener("scroll", scheduleMeasure, { passive: true });
    window.addEventListener("resize", scheduleMeasure);

    // Images, ads and client fetches all land after mount and change the page
    // height without a scroll or resize event; ResizeObserver on the document
    // element catches those.
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(document.documentElement);
    if (document.body) {
      observer.observe(document.body);
    }

    return () => {
      window.removeEventListener("scroll", scheduleMeasure);
      window.removeEventListener("resize", scheduleMeasure);
      observer.disconnect();
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const scrollTo = useCallback((top: number) => {
    window.scrollTo({
      top,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, []);

  const { canScrollUp, canScrollDown } = metrics;

  // Nothing to scroll to: don't render an empty control cluster.
  if (!canScrollUp && !canScrollDown) return null;

  const baseClasses =
    "flex h-11 w-11 items-center justify-center rounded-full bg-pink-600 text-white shadow-xl transition duration-200 ease-out hover:bg-pink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black motion-safe:hover:scale-110";

  return (
    <div
      className="fixed bottom-6 left-6 z-[10000] flex flex-col gap-2"
    >
      {canScrollUp && (
        <button
          type="button"
          onClick={() => scrollTo(0)}
          aria-label="Scroll back to top"
          title="Back to top"
          className={`${baseClasses} motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2`}
        >
          <ArrowUp size={20} aria-hidden="true" />
        </button>
      )}

      {canScrollDown && (
        <button
          type="button"
          onClick={() => scrollTo(document.documentElement.scrollHeight)}
          aria-label="Scroll further down"
          title="Scroll down"
          className={`${baseClasses} motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2`}
        >
          <ArrowDown size={20} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
