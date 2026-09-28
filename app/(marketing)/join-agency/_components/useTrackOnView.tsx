"use client";

import { useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import { trackAgency } from "@/lib/agency-analytics";

export function useTrackOnView(events: string[]) {
  const ref = useRef<HTMLDivElement>(null);
  const posthog = usePostHog();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!ref.current || hasTracked.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTracked.current) {
            hasTracked.current = true;
            events.forEach((event) => {
              // Fire PostHog (existing tracking)
              if (posthog) {
                posthog.capture(event);
              }
              // Fire GA4/GTM via dataLayer (Campaign 02)
              trackAgency(event as any);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 },
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [events, posthog]);

  return ref;
}