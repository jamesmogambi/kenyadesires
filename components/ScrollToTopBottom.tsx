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
 * Sizes and insets are written in explicit pixels rather than `rem` units on
 * purpose. `app/globals.css` sets `html { font-size: 12px }`, so every
 * `rem`-based Tailwind size is 0.75x its nominal value: `h-11` (2.75rem)
 * rendered as 33px, not the 44px it reads as. A 33px target is fine under a
 * mouse and below the 44x44 minimum for a fingertip, which is why these
 * controls were tappable on desktop and effectively dead on a phone.
 */

// Show the up button once the user is this far down the page.
const UP_REVEAL_OFFSET = 160;
// Show the down button while at least this much of the page is still below.
const DOWN_REVEAL_REMAINING = 320;

// 48px clears the 44x44 minimum touch target guidance with room for the two
// controls to sit side by side without a fat-finger mis-tap.
const CONTROL_SIZE = 48;
const CONTROL_GAP = 10;
// Minimum inset from the screen edge, before safe-area insets are applied.
const EDGE_INSET = 16;

interface ScrollMetrics {
  canScrollUp: boolean;
  canScrollDown: boolean;
}

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * How much of the page is hidden behind mobile browser chrome.
 *
 * On a phone the layout viewport (`innerHeight`) is taller than what is actually
 * visible (`visualViewport.height`) whenever the address bar is showing. A
 * `position: fixed` element anchored with a plain `bottom` value is placed
 * against the layout viewport, so the controls end up underneath the address
 * bar — visible in devtools, untappable in practice. Publishing the difference
 * as a CSS variable lets the container push itself clear of the chrome.
 */
function readViewportChromeOffset(): number {
  const vv = window.visualViewport;
  if (!vv) return 0;
  return Math.max(0, Math.round(window.innerHeight - (vv.height + vv.offsetTop)));
}

export default function ScrollToTopBottom() {
  const [metrics, setMetrics] = useState<ScrollMetrics>({
    canScrollUp: false,
    canScrollDown: false,
  });
  // The chrome offset changes on every address-bar transition. Keep it in a ref
  // and write it straight to a CSS variable instead of re-rendering: a
  // re-render here would rebuild the buttons mid-gesture.
  const chromeOffsetRef = useRef(0);

  // Scroll listeners fire far more often than React needs to re-render. Measure
  // on every event, but only commit to state when a threshold actually flips.
  const frameRef = useRef<number | null>(null);
  const metricsRef = useRef<ScrollMetrics>({ ...metrics });

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
    applyChromeOffset();

    window.addEventListener("scroll", scheduleMeasure, { passive: true });
    // Bound to `window` as well as `visualViewport`: when the mobile browser
    // chrome collapses, some engines only notify the layout viewport and some
    // only the visual one. Listening on just one left the controls underneath
    // the address bar on half the engines.
    window.addEventListener("resize", applyChromeOffset);
    window.visualViewport?.addEventListener("resize", applyChromeOffset);
    window.visualViewport?.addEventListener("scroll", applyChromeOffset);

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

  const { canScrollUp, canScrollDown } = metrics;

  // Nothing to scroll to: don't render an empty control cluster.
  if (!canScrollUp && !canScrollDown) return null;

  const baseClasses = [
    "flex items-center justify-center rounded-full",
    "bg-pink-600 text-white shadow-xl",
    "transition-[transform,background-color] duration-200 ease-out",
    "hover:bg-pink-700 focus:outline-none",
    "focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
    // `manipulation` tells the browser this is a tap target, not a gesture
    // surface: it removes the double-tap-zoom delay that otherwise makes taps
    // on small fixed controls feel like they were dropped on a phone.
    "[touch-action:manipulation]",
    "[-webkit-tap-highlight-color:transparent]",
    "motion-safe:hover:scale-110 motion-safe:active:scale-95",
  ].join(" ");

  return (
    <div
      className="fixed left-0 z-[10000] flex flex-col"
      style={{
        // `env(safe-area-inset-*)` keeps the controls clear of the iPhone home
        // indicator and Android's edge back-swipe zones; the `max()` falls back
        // to the plain inset everywhere else. The second term lifts the cluster
        // above mobile browser chrome whenever the address bar is showing.
        left: `max(env(safe-area-inset-left), ${EDGE_INSET}px)`,
        bottom: `calc(max(env(safe-area-inset-bottom), ${EDGE_INSET}px) + var(--scroll-controls-chrome-offset, 0px))`,
        gap: CONTROL_GAP,
      }}
    >
      {canScrollUp && (
        <button
          type="button"
          onClick={() => scrollTo(0)}
          aria-label="Scroll back to top"
          title="Back to top"
          style={{ width: CONTROL_SIZE, height: CONTROL_SIZE }}
          className={`${baseClasses} motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2`}
        >
          <ArrowUp size={22} aria-hidden="true" />
        </button>
      )}

      {canScrollDown && (
        <button
          type="button"
          onClick={() => scrollTo(document.documentElement.scrollHeight)}
          aria-label="Scroll further down"
          title="Scroll down"
          style={{ width: CONTROL_SIZE, height: CONTROL_SIZE }}
          className={`${baseClasses} motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2`}
        >
          <ArrowDown size={22} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
