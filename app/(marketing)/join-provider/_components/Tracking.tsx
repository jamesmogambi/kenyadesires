"use client";

import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";
import { PROVIDER_EVENTS } from "../constants";

export function useProviderTracking() {
  const posthog = usePostHog();

  const track = (event: string, properties?: Record<string, unknown>) => {
    if (posthog) {
      posthog.capture(event, properties);
    }
  };

  useEffect(() => {
    track(PROVIDER_EVENTS.LANDING_VIEW, {
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
    });
  }, [track]);

  return { track };
}
