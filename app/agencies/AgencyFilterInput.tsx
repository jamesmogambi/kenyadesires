"use client";
import { cn, formatSlugToTitle, buildFilterUrl, filterValuesMatch } from "@/lib/utils";
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
import { useVariantStore } from "@/store/variantStore";
import { useFilterInputStore } from "../girls/filterInputStore";
import { BUSINESS_TYPES } from "@/constants/index";
import { ICounty } from "@/server-actions/region.action";
import { IRegion } from "@/types/region.types";

interface Prop {
  className?: string;
}

const AgencyFilterInput = ({ className }: Prop) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial values from URL params
  const initialCountyCode = searchParams.get("county") || "";
  const initialRegionName = searchParams.get("region") || "";
  const initialbusiness = searchParams.get("business") || "";

  const [county, setCounty] = useState<ICounty | null>(null);
  const [open, setOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [region, setRegion] = useState<IRegion | null>(null);
  const [regions, setRegions] = useState<IRegion[]>([]);
  const [business, setbusiness] = useState(initialbusiness);
  const [businessOpen, setbusinessOpen] = useState(false);

  // Search states for each dropdown
  const [countySearch, setCountySearch] = useState("");
  const [regionSearch, setRegionSearch] = useState("");
  const [businessSearch, setBusinessSearch] = useState("");

  // Get data from stores
  const { counties, regions: fetchedRegions } = useFilterInputStore();
  const { massage: massageVariants, bdsm: bdsmVariants } = useVariantStore();

  // ✅ Memoize filtered counties based on search
  const filteredCounties = useMemo(() => {
    const term = countySearch.toLowerCase();
    return counties.filter(
      (c: any) => c.name.toLowerCase().includes(term),
    );
  }, [counties, countySearch]);

  // ✅ Memoize filtered regions based on selected county and search
  const filteredRegionsByCounty = useMemo(() => {
    const term = regionSearch.toLowerCase();
    if (!county) {
      return fetchedRegions.filter((r: IRegion) =>
        r.name.toLowerCase().includes(term),
      );
    }
    return fetchedRegions.filter(
      (region: IRegion) =>
        (region.countyCode?.toLowerCase() === county.code?.toLowerCase() ||
          region.county?.toLowerCase() === county.name?.toLowerCase()) &&
        region.name.toLowerCase().includes(term),
    );
  }, [county, fetchedRegions, regionSearch]);

  // ✅ Memoize filtered business types based on search
  const filteredBusinessTypes = useMemo(() => {
    const term = businessSearch.toLowerCase();
    return BUSINESS_TYPES.filter(
      (item: any) => item.label.toLowerCase().includes(term),
    );
  }, [BUSINESS_TYPES, businessSearch]);

  // Initialize from URL params on mount
  useEffect(() => {
    if (initialCountyCode && counties.length > 0) {
      const foundCounty = counties.find(
        (c: ICounty) =>
          c.code?.toLowerCase() === initialCountyCode.toLowerCase() ||
          filterValuesMatch(c.name, initialCountyCode),
      );

      if (foundCounty) {
        setCounty(foundCounty);

        const filtered = fetchedRegions.filter(
          (region: IRegion) =>
            region.countyCode?.toLowerCase() ===
              foundCounty.code?.toLowerCase() ||
            region.county?.toLowerCase() === foundCounty.name?.toLowerCase(),
        );
        setRegions(filtered);
      }
    }

    if (initialRegionName && fetchedRegions.length > 0) {
      const foundRegion = fetchedRegions.find((r: IRegion) =>
        filterValuesMatch(r.name, initialRegionName),
      );
      if (foundRegion) {
        setRegion(foundRegion);
      }
    }
  }, [counties, fetchedRegions, initialCountyCode, initialRegionName]);

  // Resolve `?business=` back to its canonical value
  useEffect(() => {
    if (!initialbusiness) return;
    const match = BUSINESS_TYPES.find((item: any) =>
      filterValuesMatch(item.value, initialbusiness),
    );
    if (match?.value && match.value !== business) {
      setbusiness(match.value);
    }
  }, [initialbusiness]);

  // ✅ Update regions when county changes
  useEffect(() => {
    if (county) {
      setRegions(filteredRegionsByCounty);
    } else {
      setRegions([]);
    }
  }, [county, filteredRegionsByCounty]);

  // Reset search terms when dropdowns close
  useEffect(() => {
    if (!open) setCountySearch("");
  }, [open]);

  useEffect(() => {
    if (!regionOpen) setRegionSearch("");
  }, [regionOpen]);

  useEffect(() => {
    if (!businessOpen) setBusinessSearch("");
  }, [businessOpen]);

  // Clear all filters
  const clearFilters = () => {
    setCounty(null);
    setRegion(null);
    setbusiness("");
    setRegions([]);
    setCountySearch("");
    setRegionSearch("");
    setBusinessSearch("");

    const targetUrl = buildFilterUrl("/agencies", searchParams, {}, false);
    router.replace(targetUrl);
  };

  // Handle county selection
  const handleCounty = (val: ICounty) => {
    setCounty(val);
    setRegion(null);
    setCountySearch("");
    setOpen(false);
  };

  // Handle business type selection
  const handlebusiness = (val: string) => {
    setbusiness(val);
    setBusinessSearch("");
    setbusinessOpen(false);
  };

  // Handle region selection
  const handleRegion = (val: IRegion) => {
    setRegion(val);
    setRegionSearch("");
    setRegionOpen(false);
  };

  // Update URL params helper
  const updateURLParams = (params: {
    county?: string;
    region?: string;
    business?: string;
  }) => {
    const targetUrl = buildFilterUrl("/agencies", searchParams, {
      county: params.county,
      region: params.region,
      business: params.business,
    });

    router.replace(targetUrl);
  };

  // Apply filters
  const onFilter = () => {
    const params = {
      county: county?.name || "",
      region: region?.name || "",
      business: business,
      page: "1",
    };

    updateURLParams(params);
  };

  // Clear individual filters
  const clearCounty = () => {
    setCounty(null);
    setRegion(null);
    setRegions([]);
    setCountySearch("");
  };

  const clearRegion = () => {
    setRegion(null);
    setRegionSearch("");
  };

  const clearbusiness = () => {
    setbusiness("");
    setBusinessSearch("");
  };

  const searchInput = ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
  }) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus
      className="w-full bg-[#262322] border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-colors mb-2"
    />
  );

  return (
    <div
      className={cn(
        "flex justify-center flex-row flex-wrap w-full gap-6",
        className,
      )}
    >
      <LocationInitializer />

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
        <DropdownMenuContent
          className="flex border-0 flex-col outline-none p-2 gap-3 w-screen lg:max-w-[900px] bg-gray-1">
          {searchInput({
            value: countySearch,
            onChange: (e) => setCountySearch(e.target.value),
            placeholder: "Search counties...",
          })}
          <div className="flex flex-row w-full gap-1.5 flex-wrap">
            {filteredCounties.length === 0 ? (
              <div className="text-gray-500 text-center py-2 text-sm">
                No counties found
              </div>
            ) : (
              filteredCounties.map((item: any) => (
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
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Region/City Filter */}
      <DropdownMenu open={regionOpen} onOpenChange={setRegionOpen}>
        <DropdownMenuTrigger
          className="self-end text-nowrap overflow-ellipsis pr-2 cursor-pointer border-0 flex w-full lg:w-1/5 justify-between items-center p-2 px-5 bg-gray-1 rounded-md"
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
        <DropdownMenuContent
          className="flex border-0 flex-col outline-none p-2 gap-3 w-screen lg:max-w-[900px] bg-gray-1">
          {searchInput({
            value: regionSearch,
            onChange: (e) => setRegionSearch(e.target.value),
            placeholder: "Search regions...",
          })}
          <div className="flex flex-wrap gap-1.5">
            {!county ? (
              <div className="text-yellow-400 text-center py-2 text-sm w-full">
                Please select a county first
              </div>
            ) : filteredRegionsByCounty.length === 0 ? (
              <div className="text-gray-500 text-center py-2 text-sm">
                No regions found
              </div>
            ) : (
              filteredRegionsByCounty.map((item: IRegion) => (
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
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Business TYpe */}
      <DropdownMenu open={businessOpen} onOpenChange={setbusinessOpen}>
        <DropdownMenuTrigger className="cursor-pointer self-end border-0 flex w-full lg:w-1/5 justify-between items-center p-2 px-5 bg-gray-1 rounded-md">
          {business ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-100 text-lg font-bold capitalize">
                {business}
              </span>
            </div>
          ) : (
            <span className="text-white/50 text-lg font-medium">
              Select a business
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
        <DropdownMenuContent
          className="flex border-0 flex-col outline-none p-2 gap-3 w-screen lg:max-w-[900px] bg-gray-1">
          {searchInput({
            value: businessSearch,
            onChange: (e) => setBusinessSearch(e.target.value),
            placeholder: "Search businesses...",
          })}
          <div className="flex flex-wrap gap-1.5">
            {filteredBusinessTypes.length === 0 ? (
              <div className="text-gray-500 text-center py-2 text-sm">
                No businesses found
              </div>
            ) : (
              filteredBusinessTypes.map((item: any) => (
                <DropdownMenuItem
                  className="rounded-lg cursor-pointer hover:bg-[#262322] p-1.5 px-6 text-white/70 text-base font-medium bg-[#262322]"
                  onSelect={(e) => {
                    e.preventDefault();
                    handlebusiness(item.value);
                    setbusinessOpen(false);
                  }}
                  key={item.label}
                >
                  {item.icon} {item.label}
                </DropdownMenuItem>
              ))
            )}
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
          disabled={!county && !region && !business}
        >
          Filter Company
        </button>
      </div>
    </div>
  );
};

export default AgencyFilterInput;
