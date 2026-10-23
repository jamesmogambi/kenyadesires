"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

// 48px clears the 44x44 minimum touch target guidance.
const CONTROL_SIZE = 48;
// Minimum inset from the screen edge, before safe-area insets are applied.
const EDGE_INSET = 16;

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * How much of the page is hidden behind mobile browser chrome.
 */
function readViewportChromeOffset(): number {
  const vv = window.visualViewport;
  if (!vv) return 0;
  return Math.max(0, Math.round(window.innerHeight - (vv.height + vv.offsetTop)));
}

export default function ScrollToTopBottom() {
  const [isAtBottom, setIsAtBottom] = useState(false);
  const chromeOffsetRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const applyChromeOffset = () => {
      const offset = readViewportChromeOffset();
      if (offset === chromeOffsetRef.current) return;
      chromeOffsetRef.current = offset;
      document.documentElement.style.setProperty(
        "--scroll-controls-chrome-offset",
        `${offset}px`,
      );
    };

    const measure = () => {
      frameRef.current = null;

      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const documentHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
      );

      // Consider at bottom if within 50px of the bottom
      const atBottom = scrollY + viewportHeight >= documentHeight - 50;
      setIsAtBottom(atBottom);
    };

    const scheduleMeasure = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(measure);
    };

    measure();
    applyChromeOffset();

    window.addEventListener("scroll", scheduleMeasure, { passive: true });
    window.addEventListener("resize", applyChromeOffset);
    window.addEventListener("resize", scheduleMeasure);
    window.visualViewport?.addEventListener("resize", applyChromeOffset);
    window.visualViewport?.addEventListener("scroll", applyChromeOffset);

    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(document.documentElement);
    if (document.body) {
      observer.observe(document.body);
    }

    return () => {
      window.removeEventListener("scroll", scheduleMeasure);
      window.removeEventListener("resize", applyChromeOffset);
      window.removeEventListener("resize", scheduleMeasure);
      window.visualViewport?.removeEventListener("resize", applyChromeOffset);
      window.visualViewport?.removeEventListener("scroll", applyChromeOffset);
      observer.disconnect();
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      document.documentElement.style.removeProperty(
        "--scroll-controls-chrome-offset",
      );
    };
  }, []);

  const scrollTo = useCallback((top: number) => {
    window.scrollTo({
      top,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, []);

  const handleClick = () => {
    if (isAtBottom) {
      scrollTo(0);
    } else {
      scrollTo(document.documentElement.scrollHeight);
    }
  };

  const baseClasses = [
    "flex items-center justify-center rounded-full",
    "bg-pink-600 text-white shadow-xl",
    "transition-all duration-200 ease-out",
    "hover:bg-pink-700 focus:outline-none",
    "focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
    "[touch-action:manipulation]",
    "[-webkit-tap-highlight-color:transparent]",
    "motion-safe:hover:scale-110 motion-safe:active:scale-95",
  ].join(" ");

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isAtBottom ? "Scroll back to top" : "Scroll to bottom"}
      title={isAtBottom ? "Back to top" : "Scroll to bottom"}
      style={{
        width: CONTROL_SIZE,
        height: CONTROL_SIZE,
        left: `max(env(safe-area-inset-left), ${EDGE_INSET}px)`,
        bottom: `calc(max(env(safe-area-inset-bottom), ${EDGE_INSET}px) + var(--scroll-controls-chrome-offset, 0px))`,
      }}
      className={`fixed z-[10000] ${baseClasses} motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2`}
    >
      {isAtBottom ? (
        <ArrowUp size={22} aria-hidden="true" />
      ) : (
        <ArrowDown size={22} aria-hidden="true" />
      )}
    </button>
  );
}
