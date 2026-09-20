"use client";

import { usePostHog } from "posthog-js/react";
import { useCallback, useEffect } from "react";
import { PROVIDER_EVENTS } from "../constants";
import { captureUtms } from "@/lib/utm";
import { trackProvider } from "@/lib/analytics";

export function useProviderTracking() {
  const posthog = usePostHog();

  const track = useCallback(
    (event: string, properties?: Record<string, unknown>) => {
      if (posthog) {
        posthog.capture(event, properties);
      }
    },
    [posthog],
  );

  useEffect(() => {
    track(PROVIDER_EVENTS.LANDING_VIEW, {
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
    });
    trackProvider("landing_view", captureUtms());
  }, [track]);

  return { track };
}
