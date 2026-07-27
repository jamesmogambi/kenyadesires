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
        "shadow-md rounded-md m-4 p-8 ml-10 border-b-sky-400",
        className,
      )}
    >
      <ul className="space-y-4">
        <li className="flex gap-2">
          <Check className="text-red-700 size-5  " />
          <p className="text-black font-semibold text-xl">
            Select the credit package that suits you
          </p>
        </li>
        <li className="flex gap-2">
          <Check className="text-red-700 size-5  " />
          <p className="text-black font-semibold text-xl">
            The 150 credits package includes a 10% discount
          </p>
        </li>
        <li className="flex gap-2">
          <Check className="text-red-700 size-5  " />
          <p className="text-black font-semibold text-xl">
            You can use remaining credits later or for{" "}
            <span className="text-red-800">boosting</span> your listing
          </p>
        </li>
        <li className="flex gap-2">
          <Check className="text-red-700 size-5  " />
          <p className="text-black font-semibold text-xl">
            Click Buy to see the payment details
          </p>
        </li>
        <li className="flex gap-2">
          <Check className="text-red-700 size-5  " />
          <p className="text-black font-semibold text-xl">
            Payment is made by Mpesa
          </p>
        </li>
      </ul>
    </section>
  );
};
