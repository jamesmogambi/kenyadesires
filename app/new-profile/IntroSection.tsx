"use client";
import { cn } from "@/lib/utils";
import React, { useMemo, useState } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { RefreshCw } from "lucide-react";
import { useFormStore } from "@/store/formStore";
import { useSettingStore } from "@/store/settingStore";
import { useVariantStore } from "@/store/variantStore";
import { useFilterInputStore } from "@/app/girls/filterInputStore";

interface Prop {
  className?: string;
  form: any;
  isEscort?: boolean;
}

const IntroSection = ({ form, className, isEscort }: Prop) => {
  const [regionOpen, setRegionOpen] = useState<boolean>(false);
  const [countyOpen, setCountyOpen] = useState<boolean>(false);
  const [townOpen, setTownOpen] = useState<boolean>(false);
  const [availabilityOpen, setAvailabilityOpen] = useState<boolean>(false);

  const { towns, region, county, setRegion, setCounty, resetLocations } =
    useFormStore();

  const { availability, setAvailability } = useSettingStore();

  const { availability: variantAvailability } = useVariantStore();

  // County/region data is sourced from the DB-backed zustand store (populated by
  // LocationInitializer in the root layout) rather than the static JSON fixture,
  // so the dropdowns always reflect the current `counties`/`regions` tables.
  const { counties: dbCounties, regions: dbRegions } = useFilterInputStore();

  const variantGender = form.watch("variantGender");

  const countiesAndRegions = useMemo(() => {
    const grouped: Record<
      string,
      { countyName: string; countyCode: string; regions: string[] }
    > = {};

    for (const r of dbRegions as any[]) {
      const countyName = r?.county || "";
      if (!countyName) continue;
      if (!grouped[countyName]) {
        grouped[countyName] = {
          countyName,
          countyCode: r?.countyCode || "",
          regions: [],
        };
      }
      const name = r?.name || "";
      if (name && !grouped[countyName].regions.includes(name)) {
        grouped[countyName].regions.push(name);
      }
    }

    // Include counties that exist in the DB but have no regions listed yet
    for (const c of dbCounties as any[]) {
      const name = c?.name || "";
      if (name && !grouped[name]) {
        grouped[name] = { countyName: name, countyCode: c?.code || "", regions: [] };
      }
    }

    return Object.values(grouped);
  }, [dbCounties, dbRegions]);

  const selectedCountyData = countiesAndRegions.find(
    (c) => c.countyName === county,
  );

  const countyOtherRegions = selectedCountyData
    ? selectedCountyData.regions
    : [];

  const handleSelectRegion = (regionName: string) => {
    setRegion(regionName);
  };

  const handleSelectCounty = (countyName: string) => {
    setCounty(countyName);
  };

  const handleSelectTown = (townName: string) => {
    if (towns.includes(townName)) {
      useFormStore.getState().removeTown(townName);
    } else {
      useFormStore.getState().setTown(townName);
    }
  };

  return (
    <section
      className={cn("flex gap-2 flex-col lg:flex-row lg:gap-10", className)}
    >
      {/* 1 */}
      <div className="space-y-6 basis-full lg:basis-1/3">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <>
              <FormItem className="flex-row justify-between flex gap-4 border-none">
                <FormLabel className="font-medium text-nowrap mb-2 text-white/40 text-base">
                  Escort's name:
                </FormLabel>
                <FormControl className="border w-2/3 lg:w-1/ border-primary">
                  <Input
                    placeholder=""
                    {...field}
                    className="bg-white text-black px-6 h-10 rounded-full text-sm lg:text-xl focus-visible:ring-0 "
                  />
                </FormControl>
              </FormItem>
              <FormMessage className="-mt-4" />
            </>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <>
              <FormItem className="flex-row justify-between items-start flex gap-4 border-none">
                <FormLabel className="font-medium text-nowrap mb-2 text-white/40 text-base">
                  Email:
                </FormLabel>
                <FormControl className="border w-2/3 lg:w-1/ border-primary">
                  <Input
                    placeholder=""
                    {...field}
                    disabled={isEscort}
                    className="bg-white text-black px-6 h-10 rounded-full text-sm lg:text-lg focus-visible:ring-0 "
                  />
                </FormControl>
              </FormItem>
              <FormMessage className="-mt-4" />
            </>
          )}
        />

        <FormField
          control={form.control}
          name="street"
          render={({ field }) => (
            <>
              <FormItem className="flex-row flex gap-4 justify-between border-none">
                <FormLabel className="font-medium text-nowrap mb-2 text-white/40 text-base">
                  Street:
                </FormLabel>
                <FormControl className="border w-2/3 lg:w-1/ border-primary">
                  <Input
                    placeholder=""
                    {...field}
                    className="bg-white text-black px-6 h-10 rounded-full text-lg lg:text-xl focus-visible:ring-0 "
                  />
                </FormControl>
              </FormItem>
              <FormMessage className="-mt-4" />
            </>
          )}
        />

        {/* Gender - locked to female */}
        <FormField
          control={form.control}
          name="variantGender"
          render={({ field }) => (
            <>
              <FormItem className="flex-row justify-between flex gap-4 border-none">
                <FormLabel className="font-medium text-nowrap mb-2 text-white/40 text-base">
                  Gender:
                </FormLabel>
                <FormControl className="border w-2/3 lg:w-1/ border-primary">
                  <Input
                    placeholder=""
                    {...field}
                    value={field.value === "female" ? "Female" : field.value}
                    readOnly
                    className="bg-white text-black px-6 h-10 rounded-full text-sm lg:text-xl focus-visible:ring-0 "
                  />
                </FormControl>
              </FormItem>
              <FormMessage className="-mt-4" />
            </>
          )}
        />
      </div>
      {/* 2 */}
      <div className="space-y-6 basis-full lg:basis-1/3">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <>
              <FormItem className="flex-row justify-between flex gap-2 border-none">
                <FormLabel className="font-medium text-nowrap mb-2 text-white/40 text-base">
                  Phone:
                </FormLabel>
                <FormControl className="border w-2/3 lg:w-1/ border-primary">
                  <Input
                    placeholder=""
                    {...field}
                    className="bg-white text-black px-6 h-10 rounded-full text-lg lg:text-xl focus-visible:ring-0 "
                  />
                </FormControl>
              </FormItem>
              <FormMessage className="-mt-4" />
            </>
          )}
        />

        {/* ROW 1: County + Primary Region + Reset (far right end) */}
        <div className="relative flex-row justify-end flex gap-2">
          <DropdownMenu open={countyOpen} onOpenChange={setCountyOpen}>
            <DropdownMenuTrigger className="outline-0 self-end cursor-pointer border-0 flex w-full lg:w-[250px] justify-between items-center p-2 text-base px-5 bg-gray-1 rounded-md">
              {county ? (
                <span className="text-white/50 text-base font-semibold">
                  {county}
                </span>
              ) : (
                <span className="text-white/50 text-base font-semibold">
                  County
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
            <DropdownMenuContent className="flex border-0 flex-col outline-none p-4 gap-3 w-screen lg:max-w-[900px] bg-gray-1">
              <div className="flex flex-row w-full gap-1.5 gap-y-2.5 flex-wrap">
                {countiesAndRegions.map((item) => (
                  <DropdownMenuItem
                    key={item.countyCode}
                    className={`rounded-lg cursor-pointer hover:bg-[#262322] p-1.5 px-6 text-base font-medium bg-[#262322] ${
                      county === item.countyName
                        ? "bg-primary/30 text-primary"
                        : "text-white/70"
                    }`}
                    onSelect={() => handleSelectCounty(item.countyName)}
                  >
                    {county === item.countyName && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="size-4 mr-1"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2.25 12c0-5.385 4.365-9.75 10-9.75s10 4.365 10 9.75s-4.365 9.75-10 9.75S2.25 17.385 2.25 12zm13.5 4.5l8.25-8.25a.75.75 0 0 0-1.06-1.06L12.75 14.44l-3.69-3.69a.75.75 0 0 0-1.06 0L6.75 12.75V15a.75.75 0 0 0 .75.75h3v-3a2.25 2.25 0 0 1 2.25-2.25h.75a.75.75 0 0 1 .75.75v3h3a.75.75 0 0 0 .75-.75v-2.25z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {item.countyName}
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu open={regionOpen} onOpenChange={setRegionOpen}>
            <DropdownMenuTrigger className="outline-0 self-end cursor-pointer border-0 flex w-full lg:w-[250px] justify-between items-center p-2 text-base px-5 bg-gray-1 rounded-md">
              {region ? (
                <span className="text-white/50 text-base font-semibold">
                  {region}
                </span>
              ) : (
                <span className="text-white/50 text-base font-semibold">
                  Primary Region
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
            {county ? (
              <DropdownMenuContent className="flex border-0 flex-col outline-none p-4 gap-3 w-screen lg:max-w-[900px] bg-gray-1">
                <div className="flex flex-row w-full gap-1.5 gap-y-2.5 flex-wrap">
                  {countyOtherRegions.map((regionName) => (
                    <DropdownMenuItem
                      key={regionName}
                      className={`rounded-lg cursor-pointer hover:bg-[#262322] p-1.5 px-6 text-base font-medium bg-[#262322] ${
                        region === regionName
                          ? "bg-primary/30 text-primary"
                          : "text-white/70"
                      }`}
                      onSelect={() => handleSelectRegion(regionName)}
                    >
                      {region === regionName && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="size-4 mr-1"
                        >
                          <path
                            fillRule="evenodd"
                            d="M2.25 12c0-5.385 4.365-9.75 10-9.75s10 4.365 10 9.75s-4.365 9.75-10 9.75S2.25 17.385 2.25 12zm13.5 4.5l8.25-8.25a.75.75 0 0 0-1.06-1.06L12.75 14.44l-3.69-3.69a.75.75 0 0 0-1.06 0L6.75 12.75V15a.75.75 0 0 0 .75.75h3v-3a2.25 2.25 0 0 1 2.25-2.25h.75a.75.75 0 0 1 .75.75v3h3a.75.75 0 0 0 .75-.75v-2.25z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {regionName}
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            ) : (
              <DropdownMenuContent className="flex border-0 flex-col outline-none p-4 gap-3 w-screen lg:max-w-[900px] bg-gray-1">
                <p className="text-yellow-400 text-base font-medium px-2">
                  Please select a county first before selecting a primary
                  region.
                </p>
              </DropdownMenuContent>
            )}
          </DropdownMenu>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => resetLocations()}
                  className="absolute left-full ml-2 inset-y-0 z-20 flex items-center justify-center w-10 rounded-md bg-gray-1 hover:bg-[#262322] text-white/50 hover:text-primary transition-colors"
                  aria-label="Reset locations"
                >
                  <RefreshCw className="size-5 text-primary" />
                </button>
              </TooltipTrigger>
              <TooltipContent className=" py-2">
                <p className="">Reset locations</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* ROW 2: Areas/Town + Availability (right-aligned, aligned with ROW 1) */}
        <div className="flex-row justify-end flex gap-2">
          <DropdownMenu open={townOpen} onOpenChange={setTownOpen}>
            <DropdownMenuTrigger className="outline-0 self-end cursor-pointer border-0 flex w-full lg:w-[250px] justify-between items-center p-2 text-base px-5 bg-gray-1 rounded-md">
              {towns.length > 0 ? (
                <div className="flex flex-nowrap items-center gap-1 overflow-hidden min-w-0 flex-1">
                  {towns.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="shrink-0 overflow-hidden text-ellipsis whitespace-nowrap max-w-[90px] bg-primary/30 text-primary text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          useFormStore.getState().removeTown(t);
                        }}
                        className="ml-1 text-primary hover:text-red-400"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                  {towns.length > 2 && (
                    <span className="shrink-0 bg-primary/30 text-primary text-xs px-2 py-0.5 rounded-full">
                      +{towns.length - 2} more
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-white/50 text-base font-semibold">
                  Other Areas/Towns
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
            {!county && (
              <DropdownMenuContent className="flex border-0 flex-col outline-none p-4 gap-3 w-screen lg:max-w-[900px] bg-gray-1">
                <p className="text-yellow-400 text-base font-medium px-2">
                  Please select a county first before selecting an area or town.
                </p>
              </DropdownMenuContent>
            )}
            {county && (
              <DropdownMenuContent className="flex border-0 flex-col outline-none p-4 gap-3 w-screen lg:max-w-[900px] bg-gray-1">
                <div className="flex flex-row w-full gap-1.5 gap-y-2.5 flex-wrap">
                  {selectedCountyData &&
                    selectedCountyData.regions
                      .flatMap((regionName: string) =>
                        regionName
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      )
                      .map((townName: string) => (
                        <DropdownMenuItem
                          key={townName.trim()}
                          className={`rounded-lg cursor-pointer hover:bg-[#262322] p-1.5 px-6 text-base font-medium bg-[#262322] ${
                            towns.includes(townName.trim())
                              ? "bg-primary/30 text-primary"
                              : "text-white/70"
                          }`}
                          onSelect={() => handleSelectTown(townName.trim())}
                        >
                          {towns.includes(townName.trim()) && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="size-4 mr-1"
                            >
                              <path
                                fillRule="evenodd"
                                d="M2.25 12c0-5.385 4.365-9.75 10-9.75s10 4.365 10 9.75s-4.365 9.75-10 9.75S2.25 17.385 2.25 12zm13.5 4.5l8.25-8.25a.75.75 0 0 0-1.06-1.06L12.75 14.44l-3.69-3.69a.75.75 0 0 0-1.06 0L6.75 12.75V15a.75.75 0 0 0 .75.75h3v-3a2.25 2.25 0 0 1 2.25-2.25h.75a.75.75 0 0 1 .75.75v3h3a.75.75 0 0 0 .75-.75v-2.25z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                          {townName.trim()}
                        </DropdownMenuItem>
                      ))}
                </div>
              </DropdownMenuContent>
            )}
          </DropdownMenu>

          <DropdownMenu
            open={availabilityOpen}
            onOpenChange={setAvailabilityOpen}
          >
            <DropdownMenuTrigger className="outline-0 self-end cursor-pointer border-0 flex w-full lg:w-[250px] justify-between items-center p-2 text-base px-5 bg-gray-1 rounded-md">
              <span className="text-white/50 text-base font-semibold">
                {availability.length > 0
                  ? ` Availability ${availability.length} selected`
                  : "Availability"}
              </span>
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
            <DropdownMenuContent className="flex border-0 flex-col outline-none p-5 gap-3 w-screen lg:max-w-[900px] bg-gray-1 max-h-[300px] overflow-y-auto">
              {variantAvailability.map((i, k) => {
                const item: any = i;
                const label = typeof item === "string" ? item : item.name;
                const key =
                  typeof item === "string" ? item : (item.id ?? item.name ?? k);
                const checked = availability.includes(label);
                return (
                  <DropdownMenuItem
                    key={key}
                    className="rounded-lg cursor-pointer hover:bg-[#262322] p-1.5 px-6 text-white/70 text-base font-medium bg-[#262322] flex items-center gap-3"
                    onSelect={() => {
                      setAvailability(label, !checked);
                    }}
                  >
                    <div
                      className={`size-5 rounded border flex items-center justify-center ${
                        checked
                          ? "bg-primary border-primary"
                          : "border-white/30"
                      }`}
                    >
                      {checked && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={14}
                          height={14}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </div>
                    <span>{label}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </section>
  );
};

export default IntroSection;
