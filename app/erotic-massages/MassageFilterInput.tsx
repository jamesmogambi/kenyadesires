"use client";
import { cn, formatSlugToTitle } from "@/lib/utils";
import React, { useEffect, useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import LocationInitializer from "@/components/FileInputInitializer";
import MassageInitializer from "./MassageInitializer";
import { useMassageStore } from "@/store/massageStore";
import { useFilterInputStore } from "../girls/filterInputStore";
import { ICounty } from "@/server-actions/region.action";
import { IRegion } from "@/types/region.types";

interface Prop {
  className?: string;
  initialMassages?: { value: string; count: number }[];
}

const MassageTypeFilterInput = ({ className, initialMassages }: Prop) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial values from URL params
  const initialCountyCode = searchParams.get("county") || "";
  const initialRegionName = searchParams.get("region") || "";
  const initialMassageType = searchParams.get("massageType") || "";

  const [county, setCounty] = useState<ICounty | null>(null);
  const [open, setOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [region, setRegion] = useState<IRegion | null>(null);
  const [regions, setRegions] = useState<IRegion[]>([]);
  const [massageType, setMassageType] = useState(initialMassageType);
  const [massageTypeOpen, setMassageTypeOpen] = useState(false);

  // Get data from stores
  const {
    practices,
    counties,
    regions: fetchedRegions,
  } = useFilterInputStore();
  const { massages: massageVariants } = useMassageStore();

  // ✅ Memoize filtered regions based on selected county (same pattern as GirlFIlterInput)
  const filteredRegionsByCounty = useMemo(() => {
    if (!county) return [];
    return fetchedRegions.filter(
      (region: IRegion) =>
        region.countyCode?.toLowerCase() === county.code?.toLowerCase() ||
        region.county?.toLowerCase() === county.name?.toLowerCase(),
    );
  }, [county, fetchedRegions]);

  // Initialize from URL params on mount
  useEffect(() => {
    if (initialCountyCode && counties.length > 0) {
      // Find county by code (slug) or name
      const foundCounty = counties.find(
        (c: ICounty) =>
          c.code?.toLowerCase() === initialCountyCode.toLowerCase() ||
          c.name?.toLowerCase() === initialCountyCode.toLowerCase(),
      );

      if (foundCounty) {
        setCounty(foundCounty);

        // Filter regions based on found county
        const filtered = fetchedRegions.filter(
          (region: IRegion) =>
            region.countyCode?.toLowerCase() ===
              foundCounty.code?.toLowerCase() ||
            region.county?.toLowerCase() === foundCounty.name?.toLowerCase(),
        );
        setRegions(filtered);
      }
    }

    if (initialRegionName && regions.length > 0) {
      const foundRegion = regions.find(
        (r) => r.name?.toLowerCase() === initialRegionName.toLowerCase(),
      );
      if (foundRegion) {
        setRegion(foundRegion);
      }
    }
  }, [counties, fetchedRegions, initialCountyCode, initialRegionName]);

  // ✅ Update regions when county changes (for the dropdown)
  useEffect(() => {
    if (county) {
      setRegions(filteredRegionsByCounty);
    } else {
      setRegions([]);
    }
  }, [county, filteredRegionsByCounty]);

  // Clear all filters
  const clearFilters = () => {
    setCounty(null);
    setRegion(null);
    setMassageType("");
    setRegions([]);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("county");
    params.delete("region");
    params.delete("massageType");
    router.replace(`?${params.toString()}`);
  };

  // Handle county selection
  const handleCounty = (val: ICounty) => {
    setCounty(val);
    setRegion(null); // Reset region when county changes
    // Regions will be automatically updated by the useEffect above
  };

  // Handle massage type selection
  const handleMassageType = (val: string) => {
    setMassageType(val);
  };

  // Handle region selection
  const handleRegion = (val: IRegion) => {
    if (!county) {
      alert("You must first select a county");
      return;
    }
    setRegion(val);
  };

  // Update URL params helper
  const updateURLParams = (params: {
    county: string;
    region: string;
    massageType: string;
  }) => {
    const urlParams = new URLSearchParams(searchParams.toString());

    if (params.county) {
      urlParams.set("county", params.county);
    } else {
      urlParams.delete("county");
    }

    if (params.region) {
      urlParams.set("region", params.region);
    } else {
      urlParams.delete("region");
    }

    if (params.massageType) {
      urlParams.set("massageType", params.massageType);
    } else {
      urlParams.delete("massageType");
    }

    router.replace(`?${urlParams.toString()}`);
  };

  // Apply filters
  const onFilter = () => {
    const params = {
      county: county?.name || "",
      region: region?.name || "",
      massageType: massageType,
    };

    updateURLParams(params);
  };

  // Clear individual filters
  const clearCounty = () => {
    setCounty(null);
    setRegion(null);
    setRegions([]);
  };

  const clearRegion = () => {
    setRegion(null);
  };

  const clearMassageType = () => {
    setMassageType("");
  };

  return (
    <div
      className={cn(
        "flex justify-center flex-row flex-wrap w-full gap-6",
        className,
      )}
    >
      <LocationInitializer />
      <MassageInitializer initialMassages={initialMassages} />

      {/* County Filter */}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger className="self-end cursor-pointer border-0 flex w-full lg:w-1/5 justify-between items-center p-2 px-5 bg-gray-1 rounded-md">
          {county ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-100 text-lg font-bold">
                {county.name}
              </span>
            </div>
          ) : (
            <span className="text-white/50 text-lg font-medium">County</span>
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={18}
            height={18}
            viewBox="0 0 32 32"
            className="text-white/50"
          >
            <path
              fill="currentColor"
              d="M8.037 11.166L14.5 22.36c.825 1.43 2.175 1.43 3 0l6.463-11.195c.826-1.43.15-2.598-1.5-2.598H9.537c-1.65 0-2.326 1.17-1.5 2.6z"
              strokeWidth={1}
              stroke="currentColor"
            ></path>
          </svg>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="flex border-0 flex-col outline-none p-2 gap-3 w-screen lg:max-w-[900px] bg-gray-1">
          <div className="flex flex-row w-full gap-1.5 flex-wrap">
            {counties.map((item: any) => (
              <DropdownMenuItem
                className="rounded-lg cursor-pointer hover:bg-[#262322] p-1.5 px-6 text-white/70 text-base font-medium bg-[#262322]"
                onSelect={(e) => {
                  e.preventDefault();
                  handleCounty(item);
                  setOpen(false);
                }}
                key={item.code}
              >
                {formatSlugToTitle(item.name)}
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Region/City Filter */}
      <DropdownMenu open={regionOpen} onOpenChange={setRegionOpen}>
        <DropdownMenuTrigger
          className="self-end text-nowrap overflow-ellipsis pr-2 cursor-pointer border-0 flex w-full lg:w-1/5 justify-between items-center p-2 px-5 bg-gray-1 rounded-md"
          disabled={!county}
        >
          {region ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-100 text-lg font-bold">
                {region.name}
              </span>
            </div>
          ) : (
            <span className="text-white/50 text-lg font-medium">
              {county ? "City or region" : "Select county first"}
            </span>
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={18}
            height={18}
            viewBox="0 0 32 32"
            className="text-white/50"
          >
            <path
              fill="currentColor"
              d="M8.037 11.166L14.5 22.36c.825 1.43 2.175 1.43 3 0l6.463-11.195c.826-1.43.15-2.598-1.5-2.598H9.537c-1.65 0-2.326 1.17-1.5 2.6z"
              strokeWidth={1}
              stroke="currentColor"
            ></path>
          </svg>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="flex border-0 flex-col outline-none p-2 gap-3 w-screen lg:max-w-[900px] bg-gray-1">
          {regions.length === 0 ? (
            <div className="text-white/50 text-center py-4">
              {county
                ? "No regions found for this county"
                : "Select a county first"}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {regions.map((item: IRegion) => (
                <DropdownMenuItem
                  className="rounded-lg cursor-pointer hover:bg-[#262322] p-1.5 px-6 text-white/70 text-base font-medium bg-[#262322]"
                  onSelect={(e) => {
                    e.preventDefault();
                    handleRegion(item);
                    setRegionOpen(false);
                  }}
                  key={item.id}
                >
                  {formatSlugToTitle(item.name)}
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Massage Type Filter */}
      <DropdownMenu open={massageTypeOpen} onOpenChange={setMassageTypeOpen}>
        <DropdownMenuTrigger className="cursor-pointer self-end border-0 flex w-full lg:w-1/5 justify-between items-center p-2 px-5 bg-gray-1 rounded-md">
          {massageType ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-100 text-lg font-bold capitalize">
                {massageType}
              </span>
            </div>
          ) : (
            <span className="text-white/50 text-lg font-medium">
              Type of massage
            </span>
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={18}
            height={18}
            viewBox="0 0 32 32"
            className="text-white/50"
          >
            <path
              fill="currentColor"
              d="M8.037 11.166L14.5 22.36c.825 1.43 2.175 1.43 3 0l6.463-11.195c.826-1.43.15-2.598-1.5-2.598H9.537c-1.65 0-2.326 1.17-1.5 2.6z"
              strokeWidth={1}
              stroke="currentColor"
            ></path>
          </svg>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="flex border-0 flex-col outline-none p-2 gap-3 w-screen lg:max-w-[900px] bg-gray-1">
          <div className="flex flex-wrap gap-1.5">
            {massageVariants?.map((item: any) => (
              <DropdownMenuItem
                className="rounded-lg cursor-pointer hover:bg-[#262322] p-1.5 px-6 text-white/70 text-base font-medium bg-[#262322]"
                onSelect={(e) => {
                  e.preventDefault();
                  handleMassageType(item.name || item.value);
                  setMassageTypeOpen(false);
                }}
                key={item.id}
              >
                {item.name || item.value}
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={clearFilters}
          className="text-pink-600 cursor-pointer flex items-center gap-1"
        >
          <X className="h-5 w-5" />
          <span className="font-bold text-base">Cancel Filters</span>
        </button>

        <button
          onClick={onFilter}
          className="rounded-md cursor-pointer hover:bg-primary/80 text-white bg-primary text-lg font-medium p-2 px-5"
          disabled={!county && !region && !massageType}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default MassageTypeFilterInput;
