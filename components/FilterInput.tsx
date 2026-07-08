"use client";
import { cn, formatSlugToTitle } from "@/lib/utils";
import React, { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { X } from "lucide-react";
// import { practices } from "@/fixtures/practice";
import { useFilterInputStore } from "@/app/girls/filterInputStore";
import regionInitializer from "./FileInputInitializer";
import { useRouter, useSearchParams } from "next/navigation";
import LocationInitializer from "./FileInputInitializer";

interface Prop {
  className?: string;
}

interface IRegion {
  _id: string;
  name: string;
  countyCode: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICounty {
  _id: string;
  name: string;
  code: string;
  description?: string;
  isPopular?: boolean;
  population?: number;
  area?: string;
  capital?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// TODO: // UPDATE TO RENDER UPDATAED regionS AND PRACTICES FROM DB
const FilterInput = ({ className }: Prop) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [county, setCounty] = useState<ICounty | null>(null);
  const [open, setOpen] = React.useState(false);
  const [regionOpen, setRegionOpen] = React.useState(false);
  const [region, setRegion] = useState<IRegion | null>(null);
  const [regions, setRegions] = useState<IRegion[]>([]);

  const [practice, setPractice] = useState("");
  const [practiceOpen, setPracticeOpen] = React.useState(false);

  const {
    practices,
    counties,
    regions: fetchedRegions,
  } = useFilterInputStore();
  const clearFilters = () => {
    (setCounty(null), setRegion(null), setPractice(""), setRegions([]));
    const params = new URLSearchParams(searchParams.toString());
    params.delete("county");
    params.delete("region");
    params.delete("practice");
    router.replace(`?${params.toString()}`);
  };

  const handleCounty = (val: any) => {
    (setRegion(null), setRegions([]));
    // Update region state
    setCounty(val);

    // Update query params
    const params = new URLSearchParams(searchParams.toString());
    params.delete("region");
    params.delete("region"); // Optional: remove stale region param
    params.delete("practice"); // Optional: remove stale practice param
    router.replace(`?${params.toString()}`);

    // Filter regions based on selected region
    // const filteredRegions = fetchedRegions.filter(
    //   (region: { region: { name: string } }) => region.region.name === val.code,
    // );

    console.log("regions from store", fetchedRegions);
    console.log("seleceted value", val);
    const filteredRegions = fetchedRegions.filter(
      (region: any) => region.countyCode === val.code,
    );
    console.log("filteredregions", filteredRegions);
    setRegions(filteredRegions);
  };

  const handlePractice = (val: string) => {
    // const params = new URLSearchParams(searchParams.toString());
    setPractice(val);
    // params.set("practice", val);
    // router.replace(`?${params.toString()}`);
  };

  const handleRegion = (val: any) => {
    if (!county) {
      alert("You must first select region");
    }
    setRegion(val);
  };

  const onFilter = () => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("county", county?.name || "");
    params.set("region", region?.name || "");
    params.set("practice", practice);
    router.replace(`?${params.toString()}`);
  };
  return (
    <div
      className={cn(
        " flex justify-center flex-row flex-wrap   w-full gap-6 ",
        className,
      )}
    >
      <LocationInitializer />
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
          //   side="left"
          className="flex border-0 flex-col outline-none p-2 gap-3 w-screen  lg:max-w-225 bg-gray-1 "
        >
          <div className="flex flex-row w-full gap-1.5  flex-wrap">
            {counties.map((item: any) => (
              <DropdownMenuItem
                className="rounded-lg cursor-pointer hover:bg-[#262322] p-1.5 px-6 text-white/70 text-base font-medium bg-[#262322]"
                onSelect={(e) => handleCounty(item)}
                key={item.code}
              >
                {formatSlugToTitle(item.name)}
              </DropdownMenuItem>
            ))}
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
          //   side="left"
          className="flex border-0 flex-col outline-none p-2 gap-3 w-screen  lg:max-w-225 bg-gray-1 "
        >
          <div className="flex -2 gap-1.5 flex-wrap">
            {/* TODO: RENDER REGIONS BASED ON SELECTED COUNTY */}
            {regions.map((item: IRegion) => (
              <DropdownMenuItem
                className="rounded-lg cursor-pointer hover:bg-[#262322] p-1.5 px-6 text-white/70 text-base font-medium bg-[#262322]"
                onSelect={(e) => handleRegion(item)}
                key={item._id}
              >
                {item.name}
              </DropdownMenuItem>
            ))}
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
          //   side="left"
          className="flex border-0 flex-col outline-none p-2 gap-3 w-screen  lg:max-w-225 bg-gray-1 "
        >
          <div className="flex -2 gap-1.5 flex-wrap">
            {practices?.map((item: any) => (
              <DropdownMenuItem
                className="rounded-lg cursor-pointer hover:bg-[#262322] p-1.5 px-6 text-white/70 text-base font-medium bg-[#262322]"
                onSelect={(e) => {
                  handlePractice(item.name);
                }}
                key={item.id}
              >
                {item.name}
              </DropdownMenuItem>
            ))}
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
