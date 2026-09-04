"use client";

import { useEffect, useRef } from "react";
import { PROVIDER_EVENTS } from "../constants";
import { usePostHog } from "posthog-js/react";

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
              if (posthog) {
                posthog.capture(event);
              }
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
