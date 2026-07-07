// lib/county-config.ts
// NO "use server" directive here

import { ICounty } from "@/server-actions/region.action";

export interface County {
  id: string;
  name: string;
  slug: string;
  [key: string]: any;
}

export const CACHE_TAGS = {
  COUNTIES: "counties",
  COUNTY: (id: string) => `county-${id}`,
  ALL_COUNTIES: "all-counties",
};

// Re-export ICounty if needed
export type { ICounty };
