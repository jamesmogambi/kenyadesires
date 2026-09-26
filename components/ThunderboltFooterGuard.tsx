/**
 * components/ThunderboltFooterGuard.tsx
 *
 * Stops the Thunderbolt chat widget from covering the footer's links
 * WITHOUT changing the footer, the layout, or the widget itself.
 *
 * THE PROBLEM
 * -----------
 * The embed script (thunderbolt.com/.../thunderbolt-ui/embed.js) injects a
 * fixed iframe at `bottom: 8px; right: 8px`, 348px x 112px in its resting
 * collapsed state, with `z-index: 2147483647` — the maximum 32-bit value,
 * above every layer on this site. It is mounted inside a *closed* shadow
 * root appended to `document.body`, so it cannot be restyled or reached by
 * CSS from the host page.
 *
 * Because it is `position: fixed`, the only place it can collide with page
 * content is the end of the document. It lands on the right-hand end of the
 * footer nav, which swallows clicks on "contact" and "privacy policy" while
 * leaving the links to its left working — the exact reported symptom.
 *
 * WHY NOT JUST ADD PADDING
 * ------------------------
 * Reserving space at the bottom of the page does fix the overlap, but it
 * changes the page. This component leaves the footer and the document
 * structure exactly as they are and only manages the widget's visibility.
 *
 * HOW IT WORKS
 * ------------
 * The embed script assigns a small API to `window.Thunderbolt`, including
 * `open()`, `close()` and a `ready()` promise. We observe the footer with an
 * `IntersectionObserver` and close the widget whenever the footer is on
 * screen, restoring it when the user scrolls away.
 *
 * Two safeguards:
 *  - We only ever re-open a widget that *we* closed, so a widget the user
 *    dismissed deliberately stays dismissed.
 *  - If the embed script is blocked, fails to load, or exposes no API, the
 *    component does nothing. The site is unaffected either way.
 */

"use client";

import { useEffect } from "react";

/** The subset of the embed script's public API that this component uses. */
interface ThunderboltApi {
  open: () => void;
  close: () => void;
  toggle: () => void;
  ready: () => Promise<void>;
  on?: (event: string, handler: () => void) => () => void;
}

declare global {
  interface Window {
    Thunderbolt?: ThunderboltApi;
  }
}

/** How long to wait for the lazyOnload embed to expose its API. */
const API_POLL_INTERVAL_MS = 250;
const API_POLL_TIMEOUT_MS = 15_000;

export default function ThunderboltFooterGuard() {
  useEffect(() => {
    let cancelled = false;
    let observer: IntersectionObserver | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    /** True only while WE are the reason the widget is hidden. */
    let closedByUs = false;

    const closeWidget = () => {
      const api = window.Thunderbolt;
      if (!api) return;
      try {
        api.close();
        closedByUs = true;
      } catch {
        // The widget may not be ready yet; nothing to restore later.
      }
    };

    const restoreWidget = () => {
      const api = window.Thunderbolt;
      // Never re-open a widget the user closed themselves.
      if (!api || !closedByUs) return;
      try {
        api.open();
      } catch {
        // Ignore: the widget is optional decoration.
      } finally {
        closedByUs = false;
      }
    };

    const observeFooter = () => {
      const footer = document.querySelector("footer");
      if (!footer) return;

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              // The footer is on screen, so the bottom-right corner is
              // about to be occupied by the widget. Get it out of the way.
              closeWidget();
            } else {
              restoreWidget();
            }
          }
        },
        // Any visibility counts. Erring toward hiding the widget is the
        // safe direction: an over-eager hide is a missing button, whereas
        // an over-eager show puts it back over the links.
        { threshold: 0 },
      );

      observer.observe(footer);
    };

    /**
     * The embed is `strategy="lazyOnload"`, so `window.Thunderbolt` may not
     * exist when this effect runs. Poll for it, then wait for `ready()` so
     * we never send commands before the widget can accept them.
     */
    const attach = () => {
      if (cancelled) return;

      const api = window.Thunderbolt;
      if (!api) {
        if (API_POLL_TIMEOUT_MS > 0 && !pollTimer) {
          // Bounded: give up rather than poll forever.
          const startedAt = Date.now();
          pollTimer = setInterval(() => {
            if (Date.now() - startedAt > API_POLL_TIMEOUT_MS) {
              if (pollTimer) clearInterval(pollTimer);
              pollTimer = null;
              return;
            }
            if (window.Thunderbolt) {
              if (pollTimer) clearInterval(pollTimer);
              pollTimer = null;
              attach();
            }
          }, API_POLL_INTERVAL_MS);
        }
        return;
      }

      const start = () => {
        if (cancelled) return;
        observeFooter();
      };

      try {
        const ready = api.ready();
        if (ready && typeof ready.then === "function") {
          ready.then(start, start);
        } else {
          start();
        }
      } catch {
        start();
      }
    };

    attach();

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      observer?.disconnect();
      // Do NOT re-open on unmount: leaving the route should not resurrect a
      // widget the user had closed.
    };
  }, []);

  // Renders nothing — this is a behaviour-only component.
  return null;
}
