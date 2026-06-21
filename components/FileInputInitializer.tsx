"use client";

import { useEffect } from "react";
import { useFilterInputStore } from "@/app/girls/filterInputStore";
import { useVariantStore } from "@/store/variantStore";

interface Props {
  initialCounties?: any[];
  initialRegions?: any[];
  initialLookup?: any;
}

const LocationInitializer = ({
  initialCounties,
  initialRegions,
  initialLookup,
}: Props) => {
  const { setCounties, setRegions, setPractices } = useFilterInputStore();
  const {
    setMassage,
    setBdsm,
    setPractices: setVariantPractices,
  } = useVariantStore();

  useEffect(() => {
    // ✅ Use initial data if provided
    if (initialCounties) setCounties(initialCounties);
    if (initialRegions) setRegions(initialRegions);
    if (initialLookup) {
      setPractices(initialLookup.practices || []);
      setMassage(initialLookup.massage || []);
      setBdsm(initialLookup.bdsm || []);
      setVariantPractices(initialLookup.practices || []);
    }
  }, [initialCounties, initialRegions, initialLookup]);

  return null;
};

export default LocationInitializer;
