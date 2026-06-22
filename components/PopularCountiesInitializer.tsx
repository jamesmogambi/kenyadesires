// components/ClientInitializer.tsx
"use client";

import { useCountyStore } from "@/store/countyStore";
import { County, ICounty } from "@/types/county.types";
import { useEffect } from "react";

interface Props {
  counties: ICounty[];
}

export default function PopularCountiesInitializer({ counties }: Props) {
  const setPopularCounties = useCountyStore(
    (state: any) => state.setPopularCounties,
  );

  useEffect(() => {
    // ✅ Set counties in store
    const mappedCounties = counties.map((item: any) => ({
      id: item.id || "",
      name: item.name || "",
      slug: item.slug || item.name?.toLowerCase().replace(/\s+/g, "-") || "",
    }));
    setPopularCounties(mappedCounties);
  }, [counties, setPopularCounties]);

  return null; // This component doesn't render anything
}
