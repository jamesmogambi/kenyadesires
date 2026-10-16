"use client";
import { cn, formatSlugToTitle, buildFilterUrl } from "@/lib/utils";
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
import BDSMInitializer from "./BDSMInitializer";
import { useBDSMStore } from "@/store/bdsmStore";
import { useFilterInputStore } from "../girls/filterInputStore";
import { ICounty } from "@/server-actions/region.action";
import { IRegion } from "@/types/region.types";

interface Prop {
  className?: string;
  initialBDSMs?: { value: string; count: number }[];
}

const formatPracticeName = (name: string): string => {
  if (!name) return "";
  const words = name.split(/\s+/);
  if (words.length <= 10) return name;
  return words.slice(0, 10).join(" ") + "...";
};

const BDSMFilterInput = ({ className, initialBDSMs }: Prop) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial values from URL params
  const initialCountyCode = searchParams.get("county") || "";
  const initialRegionName = searchParams.get("region") || "";
  const initialpractice = searchParams.get("practice") || "";

  const [county, setCounty] = useState<ICounty | null>(null);
  const [open, setOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [region, setRegion] = useState<IRegion | null>(null);
  const [regions, setRegions] = useState<IRegion[]>([]);
  const [practice, setPractice] = useState(initialpractice);
  const [practiceOpen, setPracticeOpen] = useState(false);

  // Search states for each dropdown
  const [countySearch, setCountySearch] = useState("");
  const [regionSearch, setRegionSearch] = useState("");
  const [practiceSearch, setPracticeSearch] = useState("");

  // Get data from stores
  const {
    practices,
    counties,
    regions: fetchedRegions,
  } = useFilterInputStore();
  const { bdsms: bdsmVariants } = useBDSMStore();

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

  // ✅ Memoize filtered BDSM practices based on search
  const filteredBDSMs = useMemo(() => {
    const term = practiceSearch.toLowerCase();
    return bdsmVariants.filter(
      (item: any) => (item.name || item.value).toLowerCase().includes(term),
    );
  }, [bdsmVariants, practiceSearch]);

  // Initialize from URL params on mount
  useEffect(() => {
    if (initialCountyCode && counties.length > 0) {
      const foundCounty = counties.find(
        (c: ICounty) =>
          c.code?.toLowerCase() === initialCountyCode.toLowerCase() ||
          c.name?.toLowerCase() === initialCountyCode.toLowerCase(),
      );

      if (foundCounty) {
        setCounty(foundCounty);

        const filtered = fetchedRegions.filter(
          (region: IRegion) =>
            region.countyCode?.toLowerCase() ===
              foundCounty.code?.toLowerCase() ||
            region.county?.toLowerCase() ===
              foundCounty.name?.toLowerCase(),
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
    if (!practiceOpen) setPracticeSearch("");
  }, [practiceOpen]);

  // Clear all filters
  const clearFilters = () => {
    setCounty(null);
    setRegion(null);
    setPractice("");
    setRegions([]);
    setCountySearch("");
    setRegionSearch("");
    setPracticeSearch("");

    const targetUrl = buildFilterUrl("/bdsm", searchParams, {}, false);
    router.replace(targetUrl);
  };

  // Handle county selection
  const handleCounty = (val: ICounty) => {
    setCounty(val);
    setRegion(null);
    setCountySearch("");
    setOpen(false);
  };

  // Handle practice selection
  const handlepractice = (val: string) => {
    setPractice(val);
    setPracticeSearch("");
    setPracticeOpen(false);
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
    practice?: string;
  }) => {
    const targetUrl = buildFilterUrl("/bdsm", searchParams, {
      county: params.county,
      region: params.region,
      practice: params.practice,
    });

    router.replace(targetUrl);
  };

  // Apply filters
  const onFilter = () => {
    const params = {
      county: county?.name || "",
      region: region?.name || "",
      practice: practice,
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

  const clearpractice = () => {
    setPractice("");
    setPracticeSearch("");
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
      <BDSMInitializer initialBDSMs={initialBDSMs} />

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
              City or region
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
          {filteredRegionsByCounty.length === 0 ? (
            <div className="text-gray-500 text-center py-2 text-sm">
              No regions found
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {filteredRegionsByCounty.map((item: IRegion) => (
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

      {/* BDSM Practices */}
      <DropdownMenu open={practiceOpen} onOpenChange={setPracticeOpen}>
        <DropdownMenuTrigger className="cursor-pointer self-end border-0 flex w-full lg:w-1/5 justify-between items-center p-2 px-5 bg-gray-1 rounded-md">
          {practice ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-100 text-lg font-bold capitalize truncate">
                {formatPracticeName(practice)}
              </span>
            </div>
          ) : (
            <span className="text-white/50 text-lg font-medium">Practice</span>
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
            value: practiceSearch,
            onChange: (e) => setPracticeSearch(e.target.value),
            placeholder: "Search practices...",
          })}
          <div className="flex flex-wrap gap-1.5">
            {filteredBDSMs.length === 0 ? (
              <div className="text-gray-500 text-center py-2 text-sm">
                No practices found
              </div>
            ) : (
              filteredBDSMs.map((item: any) => (
                <DropdownMenuItem
                  className="rounded-lg cursor-pointer hover:bg-[#262322] p-1.5 px-6 text-white/70 text-base font-medium bg-[#262322] truncate max-w-full"
                  onSelect={(e) => {
                    e.preventDefault();
                    handlepractice(item.name || item.value);
                    setPracticeOpen(false);
                  }}
                  key={item.id}
                >
                  {formatPracticeName(item.name || item.value)}
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
          disabled={!county && !region && !practice}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default BDSMFilterInput;
