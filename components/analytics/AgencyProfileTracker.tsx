"use client";

import { useEffect } from "react";
import { handleProfileView } from "@/lib/customer-analytics";
import type { IAgency } from "@/types/agency.types";

interface AgencyProfileTrackerProps {
  profileId: string;
  agency: Pick<IAgency, "id" | "region" | "county">;
}

export default function AgencyProfileTracker({ profileId, agency }: AgencyProfileTrackerProps) {
  useEffect(() => {
    const location = agency.region || agency.county || "Kenya";
    const locationSlug = agency.region || agency.county || "kenya";
    handleProfileView(profileId, "agency", location, locationSlug);
  }, [profileId, agency.id, agency.region, agency.county]);

  return null;
}