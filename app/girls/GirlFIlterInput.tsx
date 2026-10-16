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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import LocationInitializer from "@/components/FileInputInitializer";
import { useVariantStore } from "@/store/variantStore";
import { useFilterInputStore } from "../girls/filterInputStore";
import { ICounty } from "@/server-actions/region.action";
import { IRegion } from "@/types/region.types";

interface Prop {
  className?: string;
}

const GirlFilterInput = ({ className }: Prop) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial values from URL params
  const initialCountyCode = searchParams.get("county") || "";
  const initialRegionName = searchParams.get("region") || "";
  const initialpractice = searchParams.get("practice") || "";
  const initialSort = searchParams.get("sort") || "createdAt";
  const initialOrder = searchParams.get("order") || "desc";

  const [county, setCounty] = useState<ICounty | null>(null);
  const [open, setOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [region, setRegion] = useState<IRegion | null>(null);
  const [regions, setRegions] = useState<IRegion[]>([]);
  const [practice, setPractice] = useState(initialpractice);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [countyWarningOpen, setCountyWarningOpen] = useState(false);
  const [sort, setSort] = useState(initialSort);
  const [order, setOrder] = useState(initialOrder);
  const [sortOpen, setSortOpen] = useState(false);

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
  const {
    massage: massageVariants,
    bdsm: bdsmVariants,
    practices: variantPractices,
  } = useVariantStore();

  // Memoize filtered counties based on search
  const filteredCounties = useMemo(() => {
    const term = countySearch.toLowerCase();
    return counties.filter(
      (c: ICounty) => c.name.toLowerCase().includes(term),
    );
  }, [counties, countySearch]);

  // Memoize filtered regions based on selected county and search
  const filteredRegionsByCounty = useMemo(() => {
    if (!county) return [];
    return fetchedRegions.filter(
      (region: IRegion) =>
        (region.countyCode?.toLowerCase() === county.code?.toLowerCase() ||
          region.county?.toLowerCase() === county.name?.toLowerCase()) &&
        region.name.toLowerCase().includes(regionSearch.toLowerCase()),
    );
  }, [county, fetchedRegions, regionSearch]);

  // Memoize filtered practices based on search
  const filteredPractices = useMemo(() => {
    const term = practiceSearch.toLowerCase();
    return variantPractices.filter(
      (item: any) => item.name.toLowerCase().includes(term),
    );
  }, [variantPractices, practiceSearch]);

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

  // Resolve a `?practice=` param back to its display name once the option list
  // loads, so the chip reads "Tantric body-to-body massage" rather than the raw
  // slug. Runs for both the slugified and the legacy raw form of the param.
  useEffect(() => {
    if (!initialpractice || !variantPractices?.length) return;
    const match = variantPractices.find((item: any) =>
      filterValuesMatch(item.name, initialpractice),
    );
    if (match?.name && match.name !== practice) {
      setPractice(match.name);
    }
  }, [variantPractices, initialpractice]);

  // Update regions when county changes (for the dropdown)
  useEffect(() => {
    if (county) {
      const filtered = fetchedRegions.filter(
        (region: IRegion) =>
          region.countyCode?.toLowerCase() === county.code?.toLowerCase() ||
          region.county?.toLowerCase() === county.name?.toLowerCase(),
      );
      setRegions(filtered);
    } else {
      setRegions([]);
    }
  }, [county, fetchedRegions]);

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

  // Update URL params helper - navigates to /girls with params
  const updateURLParams = (params: {
    county?: string;
    region?: string;
    practice?: string;
    sort?: string;
    order?: string;
  }) => {
    const targetUrl = buildFilterUrl("/girls", searchParams, {
      county: params.county,
      region: params.region,
      practice: params.practice,
      sort: params.sort,
      order: params.order,
    });

    router.push(targetUrl);
  };

  // Clear all filters
  const clearFilters = () => {
    setCounty(null);
    setRegion(null);
    setPractice("");
    setSort("createdAt");
    setOrder("desc");
    setRegions([]);
    setCountySearch("");
    setRegionSearch("");
    setPracticeSearch("");

    // Navigate to girls page with no params
    router.push("/girls");
  };

  // Handle county selection
  const handleCounty = (val: ICounty) => {
    setCounty(val);
    setRegion(null); // Reset region when county changes
    setCountySearch("");
    setOpen(false);
    // Regions will be automatically updated by the useEffect above
  };

  // Handle practice selection
  const handlePractice = (val: string) => {
    setPractice(val);
    setPracticeSearch("");
    setPracticeOpen(false);
  };

  // Handle region selection
  const handleRegion = (val: IRegion) => {
    if (!county) {
      setCountyWarningOpen(true);
      return;
    }
    setRegion(val);
    setRegionSearch("");
    setRegionOpen(false);
  };

  // Apply filters
  const onFilter = () => {
    const params = {
      county: county?.name || "",
      region: region?.name || "",
      practice: practice,
      sort,
      order,
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

  const clearPractice = () => {
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
      autoFocus
      value={value}
      onChange={onChange}
      placeholder={placeholder}
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

      {/* County-required warning modal */}
      <Dialog open={countyWarningOpen} onOpenChange={setCountyWarningOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select a county first</DialogTitle>
            <DialogDescription>
              Please choose a county before selecting a city or region.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                setCountyWarningOpen(false);
                setOpen(true);
              }}
            >
              Select County
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* County Filter */}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger className="self-end cursor-pointer border-0 flex w-full lg:w-1/5 justify-between items-center p-2 px-5 bg-gray-1 rounded-md">
          {county ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-100 text-lg font-bold">
                {county.name}
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  clearCounty();
                }}
                className="ml-2 text-white/50 hover:text-white cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    clearCounty();
                  }
                }}
              >
                <X className="h-4 w-4" />
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
        <DropdownMenuContent className="flex border-0 flex-col outline-none p-2 gap-3 w-screen lg:max-w-225 bg-gray-1 max-h-100 overflow-y-auto">
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
              filteredCounties.map((item: ICounty) => (
                <DropdownMenuItem
                  className="rounded-lg cursor-pointer hover:bg-[#262322] p-1.5 px-6 text-white/70 text-base font-medium bg-[#262322]"
                  onSelect={(e) => {
                    e.preventDefault();
                    handleCounty(item);
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

      {/* Region/City Filter */}
      <DropdownMenu
        open={regionOpen}
        onOpenChange={(next) => {
          if (next && !county) {
            setCountyWarningOpen(true);
            return;
          }
          setRegionOpen(next);
        }}
      >
        <DropdownMenuTrigger className="self-end text-nowrap text-ellipsis pr-2 cursor-pointer border-0 flex w-full lg:w-1/5 justify-between items-center p-2 px-5 bg-gray-1 rounded-md">
          {region ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-100 text-lg font-bold">
                {region.name}
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  clearRegion();
                }}
                className="ml-2 text-white/50 hover:text-white cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    clearRegion();
                  }
                }}
              >
                <X className="h-4 w-4" />
              </span>
            </div>
          ) : (
            <span className="text-white/50 text-lg font-medium">
              City or Region
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
        <DropdownMenuContent className="flex border-0 flex-col outline-none p-2 gap-3 w-screen lg:max-w-225 bg-gray-1 max-h-100 overflow-y-auto">
          {searchInput({
            value: regionSearch,
            onChange: (e) => setRegionSearch(e.target.value),
            placeholder: "Search regions...",
          })}
          {regions.length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              {county ? "No regions found for this county" : "Select a county first"}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {filteredRegionsByCounty.length === 0 ? (
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
                    }}
                    key={item.id}
                  >
                    {formatSlugToTitle(item.name)}
                  </DropdownMenuItem>
                ))
              )}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Practices Filter */}
      <DropdownMenu open={practiceOpen} onOpenChange={setPracticeOpen}>
        <DropdownMenuTrigger className="cursor-pointer self-end border-0 flex w-full lg:w-1/5 justify-between items-center p-2 px-5 bg-gray-1 rounded-md">
          {practice ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-100 text-lg font-bold capitalize">
                {practice}
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  clearPractice();
                }}
                className="ml-2 text-white/50 hover:text-white cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    clearPractice();
                  }
                }}
              >
                <X className="h-4 w-4" />
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
        <DropdownMenuContent className="flex border-0 flex-col outline-none p-2 gap-3 w-screen lg:max-w-225 bg-gray-1 max-h-100 overflow-y-auto">
          {searchInput({
            value: practiceSearch,
            onChange: (e) => setPracticeSearch(e.target.value),
            placeholder: "Search practices...",
          })}
          <div className="flex flex-wrap gap-1.5">
            {filteredPractices.length === 0 ? (
              <div className="text-gray-500 text-center py-2 text-sm">
                No practices found
              </div>
            ) : (
              filteredPractices.map((item: any) => (
                <DropdownMenuItem
                  className="rounded-lg cursor-pointer hover:bg-[#262322] p-1.5 px-6 text-white/70 text-base font-medium bg-[#262322]"
                  onSelect={(e) => {
                    e.preventDefault();
                    handlePractice(item.name);
                  }}
                  key={item.id}
                >
                  {item.name.split(" ").length > 10
                    ? item.name.split(" ").slice(0, 10).join(" ") + "..."
                    : item.name}
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
          className="text-pink-600 cursor-pointer flex items-center gap-1 hover:text-pink-500 transition-colors"
        >
          <X className="h-5 w-5" />
          <span className="font-bold text-base">Cancel Filters</span>
        </button>

        <button
          onClick={onFilter}
          className="rounded-md cursor-pointer hover:bg-primary/80 text-white bg-primary text-lg font-medium p-2 px-5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={!county && !region && !practice}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default GirlFilterInput;
