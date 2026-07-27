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
            Select the credit package that suits you
          </p>
        </li>
        <li className="flex gap-2 md:gap-3">
          <Check className="text-red-700 size-4 md:size-5 shrink-0 mt-0.5" />
          <p className="text-black font-semibold text-base md:text-xl">
            The 150 credits package includes a 10% discount
          </p>
        </li>
        <li className="flex gap-2 md:gap-3">
          <Check className="text-red-700 size-4 md:size-5 shrink-0 mt-0.5" />
          <p className="text-black font-semibold text-base md:text-xl">
            You can use remaining credits later or for{" "}
            <span className="text-red-800">boosting</span> your listing
          </p>
        </li>
        <li className="flex gap-2 md:gap-3">
          <Check className="text-red-700 size-4 md:size-5 shrink-0 mt-0.5" />
          <p className="text-black font-semibold text-base md:text-xl">
            Click Buy to see the payment details
          </p>
        </li>
        <li className="flex gap-2 md:gap-3">
          <Check className="text-red-700 size-4 md:size-5 shrink-0 mt-0.5" />
          <p className="text-black font-semibold text-base md:text-xl">
            Payment is made by Mpesa
          </p>
        </li>
      </ul>
    </section>
  );
};
