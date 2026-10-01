import { cn, normalizeArray, slugify, splitIntoThreeColumns, buildListingHref } from "@/lib/utils";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import About from "./About";
// import { practices } from "@/fixtures/practice";
import Link from "next/link";
import { openingHoursToArray } from "@/lib/opening-hours";

interface Prop {
  className?: string;
  girl: any;
}

const AboutTabs = ({ girl, className }: Prop) => {
  const { age, practices, openingHours } = girl;

  // const days = Array.from({ length: 7 }, (_, i) => {
  //   // const date = new Date(today);
  //   // date.setDate(today.getDate() + i);

  //   return {
  //     id: i.toString(),
  //     day: "Monday",
  //     startTime: "09:00",
  //     endTime: "17:30",
  //   };
  // });

  const days = openingHoursToArray(openingHours);

  const [firstFive, lastTwo] = [days.slice(0, 5), days.slice(5)];

  const [col1, col2, col3] = splitIntoThreeColumns(normalizeArray(practices));

  return (
    <div className={cn("", className)}>
      <Tabs defaultValue="about" className="w-full bg-transparent">
        <TabsList className="w-full gap-10  bg-transparent ">
          <TabsTrigger
            className=" data-[state=active]:bg-primary text-white text-base font-semibold cursor-pointer py-6  items-center flex  bg-gray-1"
            value="about"
          >
            about me
          </TabsTrigger>
          <TabsTrigger
            className=" data-[state=active]:bg-primary text-white text-base font-semibold cursor-pointer py-6  items-center flex  bg-gray-1"
            value="openingHours"
          >
            opening Hours
          </TabsTrigger>
          <TabsTrigger
            className=" data-[state=active]:bg-primary text-white text-base font-semibold cursor-pointer py-6  items-center flex  bg-gray-1"
            value="practices"
          >
            practices
          </TabsTrigger>
        </TabsList>
        <TabsContent className="w-full" value="about">
          <About girl={girl} />
        </TabsContent>
        <TabsContent className="text-base" value="openingHours">
          <div className="inline-flex flex-col lg:flex-row lg:gap-12 p-4">
            {/* Column 1 */}
            <div className="space-y-2 basis-full lg:basis-1/2">
              {firstFive.map((item, index: React.Key | null | undefined) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="mr-4 text-white/40 whitespace-nowrap">
                    {item.day}:
                  </span>
                  <span className="font-medium truncate min-w-0">
                    {item.hours}
                  </span>
                </div>
              ))}
            </div>

            {/* Column 2 */}
            <div className="space-y-2 basis-full lg:basis-1/2">
              {lastTwo.map((item, index: React.Key | null | undefined) => (
                <div key={index} className="flex items-center justify-between ">
                  <span className="mr-4 text-white/40 whitespace-nowrap">
                    {item.day}:
                  </span>
                  <span className="font-medium truncate min-w-0">
                    {item.hours}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="practices">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
            {[col1, col2, col3].map((column, i) => (
              <div key={i} className="space-y-3 flex flex-col">
                {column.map((practice: any, j) => (
                  <Link
                    href={buildListingHref("/girls", { practice })}
                    key={j}
                    className="bg-primary font-medium text-white  text-center rounded-full p-2.5 "
                  >
                    {practice}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AboutTabs;
