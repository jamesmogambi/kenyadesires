"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import React from "react";

interface Prop {
  className?: string;
}
const AdvertisingPriceLIst = ({ className }: Prop) => {
  return (
    <section className={cn("px-4", className)}>
      <div>
        <h4 className="text-2xl md:text-3xl text-center mt-6 text-red-700 font-bold">
          Advertising Price List
        </h4>
        <h6 className="text-red-700 text-xl md:text-2xl font-bold text-center mt-6 md:mt-10">
          30 days of advertising = 150 credits
        </h6>
      </div>

      {/* checkbox */}
      <div className="flex flex-col sm:flex-row mt-6 mb-10 md:mb-12 items-start sm:items-center gap-3">
        <Checkbox
          className="bg-white size-6 md:size-8 shrink-0"
          id="acceptTerms"
        />
        <Label
          htmlFor="terms"
          className="text-gray-800 font-semibold text-wrap text-base"
        >
          <p className="">
            {" "}
            I agree to the{" "}
            <span className="text-primary">terms and conditions.</span> and to
            the provision of the service before the expiry of the withdrawal
            period in accordance with § 1834 of the Civil Code.
          </p>
        </Label>
      </div>

      {/* packages */}
      <div className="flex flex-col lg:flex-row justify-center gap-6 items-center">
        {/* first package */}
        <div className="bg-stone-100 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 w-full max-w-[320px] flex items-center justify-center flex-col h-fit p-4 md:p-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="6em"
            height="6em"
            viewBox="0 0 24 24"
            className="md:w-8em md:h-8em"
          >
            <path d="M0 0h24v24H0z" fill="none" />
            <g
              fill="none"
              stroke="#c7c7c7"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
            >
              <path d="M4.58 8.607L2 8.454C3.849 3.704 9.158 1 14.333 2.344c5.513 1.433 8.788 6.918 7.314 12.25c-1.219 4.411-5.304 7.337-9.8 7.406" />
              <path stroke-dasharray=".5 3" d="M12 22C6.5 22 2 17 2 11" />
              <path d="M13.604 9.722c-.352-.37-1.213-1.237-2.575-.62c-1.361.615-1.577 2.596.482 2.807c.93.095 1.537-.11 2.093.47c.556.582.659 2.198-.761 2.634s-2.341-.284-2.588-.509m1.653-6.484v.79m0 6.337v.873" />
            </g>
          </svg>
          <div>
            <h5 className="text-4xl md:text-5xl mt-4 font-bold text-center text-red-700">
              50{" "}
            </h5>
            <span className="text-xl md:text-2xl text-red-700 font-extrabold">
              Credits
            </span>
          </div>

          <div className="mt-6 md:mt-8 flex items-center justify-center flex-col gap-2 md:gap-3">
            <span className="text-black font-bold text-base md:text-lg text-center ">
              Price
            </span>
            <span className="text-2xl md:text-3xl font-bold text-black">
              KSH 500
            </span>
            <span className="text-black text-sm md:text-base font-bold">
              including VAT
            </span>
          </div>

          <Button className="bg-red-800 mt-6 md:mt-8 h-10 md:h-12 hover:bg-red-700 w-full text-white font-semibold text-lg md:text-2xl">
            Buy
          </Button>
        </div>
        {/* second package */}
        <div className="bg-red-700 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 w-full max-w-[320px] flex items-center justify-center flex-col h-fit p-4 md:p-6 relative">
          <div className="absolute -top-2 md:-top-3 right-2 md:right-4 bg-green-500 text-white text-xs md:text-sm font-bold px-2 md:px-3 py-1 rounded-full shadow-md">
            Save 20%
          </div>
          <Label className="border border-primary shadow-lg mt-3 md:mt-4 mb-8 md:mb-10 bg-white text-red-800 text-lg md:text-xl p-2 font-bold rounded-2xl ">
            Most Popular
          </Label>
          <div className="mt-10 md:mt-16">
            <h5 className="text-4xl md:text-5xl mt-4 font-bold text-center ">
              180{" "}
            </h5>
            <span className="text-xl md:text-2xl font-extrabold">Credits</span>
          </div>

          <div className="mt-6 md:mt-8 flex items-center justify-center flex-col gap-2 md:gap-3">
            <span className=" font-bold text-base md:text-lg text-center ">
              Price
            </span>
            <span className="text-2xl md:text-3xl font-bold ">KSH 1800</span>
            <span className=" text-sm md:text-base font-bold">including VAT</span>
          </div>

          <Button className="bg-white h-10 md:h-12 mt-6 md:mt-8 text-red-700  hover:bg-white/90 w-full font-semibold text-lg md:text-2xl">
            Buy
          </Button>
        </div>
      </div>
    </section>
  );
};

export default AdvertisingPriceLIst;
