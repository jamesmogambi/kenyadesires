"use client";
import { cn, formatSlugToTitle } from "@/lib/utils";
import React, { useState, useMemo } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { X } from "lucide-react";
import { useFilterInputStore } from "@/app/girls/filterInputStore";
import { useRouter, useSearchParams } from "next/navigation";

interface Prop {
  className?: string;
}

interface IRegion {
  _id: string;
  name: string;
  county_code: string;
  county: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICounty {
  _id: string;
  name: string;
  code: string;
  description?: string;
  is_popular?: boolean;
  population?: number;
  area?: string;
  capital?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const FilterInput = ({ className }: Prop) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [county, setCounty] = useState<ICounty | null>(null);
  const [open, setOpen] = React.useState(false);
  const [regionOpen, setRegionOpen] = React.useState(false);
  const [region, setRegion] = useState<IRegion | null>(null);
  const [regions, setRegions] = useState<IRegion[]>([]);

  const [practice, setPractice] = useState("");
  const [practiceOpen, setPracticeOpen] = React.useState(false);

  // Search states for each dropdown
  const [countySearch, setCountySearch] = useState("");
  const [regionSearch, setRegionSearch] = useState("");
  const [practiceSearch, setPracticeSearch] = useState("");

  const {
    practices,
    counties,
    regions: fetchedRegions,
  } = useFilterInputStore();

  // Memoize filtered counties based on search
  const filteredCounties = useMemo(() => {
    const term = countySearch.toLowerCase();
    return counties.filter(
      (item: any) => item.name.toLowerCase().includes(term),
    );
  }, [counties, countySearch]);

  // Memoize filtered regions based on selected county and search
  const filteredRegions = useMemo(() => {
    const term = regionSearch.toLowerCase();
    return regions.filter(
      (item: IRegion) => item.name.toLowerCase().includes(term),
    );
  }, [regions, regionSearch]);

  // Memoize filtered practices based on search
  const filteredPractices = useMemo(() => {
    const term = practiceSearch.toLowerCase();
    return practices.filter(
      (item: any) => item.name.toLowerCase().includes(term),
    );
  }, [practices, practiceSearch]);

  const clearFilters = () => {
    (setCounty(null), setRegion(null), setPractice(""), setRegions([]));
    setCountySearch("");
    setRegionSearch("");
    setPracticeSearch("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("county");
    params.delete("region");
    params.delete("practice");
    router.replace(`?${params.toString()}`);
  };

  const handleCounty = (val: any) => {
    (setRegion(null), setRegions([]));
    setCounty(val);
    setCountySearch("");
    setOpen(false);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("region");
    params.delete("region");
    params.delete("practice");
    router.replace(`?${params.toString()}`);

    const filteredRegions = fetchedRegions.filter(
      (region: any) => region.county_code === val.code,
    );
    setRegions(filteredRegions);
  };

  const handlePractice = (val: string) => {
    setPractice(val);
    setPracticeSearch("");
    setPracticeOpen(false);
  };

  const handleRegion = (val: any) => {
    setRegion(val);
    setRegionSearch("");
    setRegionOpen(false);
  };

  const onFilter = () => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("county", county?.name || "");
    params.set("region", region?.name || "");
    params.set("practice", practice);
    router.replace(`?${params.toString()}`);
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
      className="w-full bg-[#262322] border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-colors mb-2"
    />
  );

  return (
    <div
      className={cn(
        " flex justify-center flex-row flex-wrap   w-full gap-6 ",
        className,
      )}
    >
      {/* Counties */}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger className=" self-end  cursor-pointer border-0 flex w-full lg:w-62.5 justify-between items-center p-2 text-base px-5 bg-gray-1 rounded-md ">
          {county ? (
            <span className="text-slate-100 text-lg font-bold">
              {county.name}
            </span>
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
          className="flex border-0 flex-col outline-none p-2 gap-3 w-screen  lg:max-w-225 bg-gray-1 "
        >
          {searchInput({
            value: countySearch,
            onChange: (e) => setCountySearch(e.target.value),
            placeholder: "Search counties...",
          })}
          <div className="flex flex-row w-full gap-1.5  flex-wrap">
            {filteredCounties.length === 0 ? (
              <div className="text-gray-500 text-center py-2 text-sm">
                No counties found
              </div>
            ) : (
              filteredCounties.map((item: any) => (
                <DropdownMenuItem
                  className="rounded-lg cursor-pointer hover:bg-[#262322] p-1.5 px-6 text-white/70 text-base font-medium bg-[#262322]"
                  onSelect={(e) => handleCounty(item)}
                  key={item.code}
                >
                  {formatSlugToTitle(item.name)}
                </DropdownMenuItem>
              ))
            )}
          </div>

          <button
            onClick={() => {
              (setCounty(null), setOpen(false));
            }}
            className="inline-flex text-primary cursor-pointer  mx-auto items-center gap-2"
          >
            <X className="h-5 w-5" />
            <span className="font-medium">Cancel Filter</span>
          </button>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* region, city or region */}
      <DropdownMenu open={regionOpen} onOpenChange={setRegionOpen}>
        <DropdownMenuTrigger className="self-end text-nowrap text-ellipsis pr-2 cursor-pointer border-0 flex w-full lg:w-62.5 justify-between items-center p-2 text-base px-5 bg-gray-1 rounded-md ">
          {region ? (
            <span className="text-slate-100 text-lg font-bold">
              {region.name}
            </span>
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
          className="flex border-0 flex-col outline-none p-2 gap-3 w-screen  lg:max-w-225 bg-gray-1 "
        >
          {searchInput({
            value: regionSearch,
            onChange: (e) => setRegionSearch(e.target.value),
            placeholder: "Search regions...",
          })}
          <div className="flex -2 gap-1.5 flex-wrap">
            {filteredRegions.length === 0 ? (
              <div className="text-gray-500 text-center py-2 text-sm">
                No regions found
              </div>
            ) : (
              filteredRegions.map((item: IRegion) => (
                <DropdownMenuItem
                  className="rounded-lg cursor-pointer hover:bg-[#262322] p-1.5 px-6 text-white/70 text-base font-medium bg-[#262322]"
                  onSelect={(e) => handleRegion(item)}
                  key={item._id}
                >
                  {item.name}
                </DropdownMenuItem>
              ))
            )}
          </div>

          <button
            onClick={() => {
              (setRegion(null), setRegionOpen(false));
            }}
            className="inline-flex text-primary cursor-pointer  mx-auto items-center gap-2"
          >
            <X className="h-5 w-5" />
            <span className="font-medium">Cancel Filter</span>
          </button>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* practices */}
      <DropdownMenu open={practiceOpen} onOpenChange={setPracticeOpen}>
        <DropdownMenuTrigger className=" cursor-pointer self-end border-0 flex w-full lg:w-62.5 justify-between items-center p-2 text-base px-5 bg-gray-1 rounded-md ">
          {practice ? (
            <span className="text-slate-100 text-lg font-bold capitalize">
              {practice}
            </span>
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
          className="flex border-0 flex-col outline-none p-2 gap-3 w-screen  lg:max-w-225 bg-gray-1 "
        >
          {searchInput({
            value: practiceSearch,
            onChange: (e) => setPracticeSearch(e.target.value),
            placeholder: "Search practices...",
          })}
          <div className="flex -2 gap-1.5 flex-wrap">
            {filteredPractices.length === 0 ? (
              <div className="text-gray-500 text-center py-2 text-sm">
                No practices found
              </div>
            ) : (
              filteredPractices.map((item: any) => (
                <DropdownMenuItem
                  className="rounded-lg cursor-pointer hover:bg-[#262322] p-1.5 px-6 text-white/70 text-base font-medium bg-[#262322]"
                  onSelect={(e) => {
                    handlePractice(item.name);
                  }}
                  key={item.id}
                >
                  {item.name}
                </DropdownMenuItem>
              ))
            )}
          </div>

          <button
            onClick={() => {
              (setPractice(""), setPracticeOpen(false));
            }}
            className="inline-flex text-primary cursor-pointer  mx-auto items-center gap-2"
          >
            <X className="h-5 w-5" />
            <span className="font-medium">Cancel Filter</span>
          </button>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex flex-col   items-center gap-2">
        <button
          onClick={clearFilters}
          className="text-pink-600 cursor-pointer flex items-center"
        >
          <X className="h-5 w-5" />
          <span className="font-bold text-base">Cancel Filter</span>
        </button>

        <button
          onClick={onFilter}
          className="rounded-md cursor-pointer hover:bg-primary/80 text-white bg-primary text-lg font-medium p-2 px-5"
        >
          Filter the girls
        </button>
      </div>
    </div>
  );
};

export default FilterInput;
