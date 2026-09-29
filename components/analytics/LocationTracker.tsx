"use client";

import { useEffect } from "react";
import { trackViewLocation } from "@/lib/customer-analytics";

interface LocationTrackerProps {
  location: string;
  locationSlug: string;
  profileType?: "provider" | "agency";
}

export default function LocationTracker({
  location,
  locationSlug,
  profileType,
}: LocationTrackerProps) {
  useEffect(() => {
    if (location && location !== "Kenya") {
      trackViewLocation(location, locationSlug, profileType);
    }
  }, [location, locationSlug, profileType]);

  return null;
}