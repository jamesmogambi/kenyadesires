import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import React from "react";

interface Prop {
  className?: string;
}

export const PurchaseInfoSection = ({ className }: Prop) => {
  return (
    <section
      className={cn(
        "shadow-md rounded-md mx-4 md:mx-10 p-4 md:p-8 border-b-sky-400",
        className,
      )}
    >
      <ul className="space-y-3 md:space-y-4">
        <li className="flex gap-2 md:gap-3">
          <Check className="text-red-700 size-4 md:size-5 shrink-0 mt-0.5" />
          <p className="text-black font-semibold text-base md:text-xl">
            Choose a boost package that fits your needs
          </p>
        </li>
        <li className="flex gap-2 md:gap-3">
          <Check className="text-red-700 size-4 md:size-5 shrink-0 mt-0.5" />
          <p className="text-black font-semibold text-base md:text-xl">
            Use existing credits or buy credits via M-Pesa
          </p>
        </li>
        <li className="flex gap-2 md:gap-3">
          <Check className="text-red-700 size-4 md:size-5 shrink-0 mt-0.5" />
          <p className="text-black font-semibold text-base md:text-xl">
            Click Buy to purchase your boost
          </p>
        </li>
        <li className="flex gap-2 md:gap-3">
          <Check className="text-red-700 size-4 md:size-5 shrink-0 mt-0.5" />
          <p className="text-black font-semibold text-base md:text-xl">
            Payment is made by M-Pesa /Airtel Money/ Card
          </p>
        </li>
        <li className="flex gap-2 md:gap-3">
          <Check className="text-red-700 size-4 md:size-5 shrink-0 mt-0.5" />
          <p className="text-black font-semibold text-base md:text-xl">
            Boost activates immediately after purchase
          </p>
        </li>
      </ul>
    </section>
  );
};
