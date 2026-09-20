"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  parseUTMParams,
  setFirstTouchAttribution,
  setSessionAttribution,
} from "@/lib/attribution";

export default function AttributionCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const utmParams = parseUTMParams(searchParams);

    if (Object.keys(utmParams).length > 0) {
      const now = new Date().toISOString();
      setFirstTouchAttribution({
        ...utmParams,
        landing_page:
          typeof window !== "undefined" ? window.location.pathname : undefined,
        first_touch_at: now,
      });
      setSessionAttribution({
        ...utmParams,
        landing_page:
          typeof window !== "undefined" ? window.location.pathname : undefined,
        first_touch_at: now,
      });
    }
  }, [searchParams]);

  return null;
}
