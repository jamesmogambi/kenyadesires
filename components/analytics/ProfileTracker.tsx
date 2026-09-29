"use client";

import { useEffect } from "react";
import { handleProfileView, determineProfileType } from "@/lib/customer-analytics";
import type { Escort } from "@/server-actions/escort.action";

interface ProfileTrackerProps {
  profileId: string;
  escort: Pick<Escort, "id" | "isAgencyOwned" | "agencyId" | "primaryRegion" | "county" | "locations">;
}

export default function ProfileTracker({ profileId, escort }: ProfileTrackerProps) {
  useEffect(() => {
    const location = escort.primaryRegion || escort.locations?.[0]?.region || escort.county || "Kenya";
    const locationSlug = escort.primaryRegion || escort.county || "kenya";
    const profileType = determineProfileType(escort);
    handleProfileView(profileId, profileType, location, locationSlug);
  }, [profileId, escort.id, escort.isAgencyOwned, escort.agencyId, escort.primaryRegion, escort.county, escort.locations]);

  return null;
}