import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import React from "react";

interface Prop {
  className?: string;
}
const AdvertisingPriceLIst = ({ className }: Prop) => {
  return (
    <section className={cn("", className)}>
      <div>
        <h4 className="text-3xl text-center mt-6 text-red-700 font-bold">
          Advertising Price List
        </h4>
        <h6 className="text-red-700 text-2xl font-bold text-center mt-10">
          30 days of advertising = 150 credits
        </h6>
      </div>

      {/* // checkbox */}
      <div className="flex flex-row mt-6 mb-12  items-center gap-2">
        <Checkbox
          className="bg-white size-8"
          //   id="terms"
          //   checked={field.value}
          //   onCheckedChange={field.onChange}
          id="acceptTerms"
        />
        <Label
          htmlFor="terms"
          className="text-gray-800 font-semibold text-wrap text-base"
        >
          <p className="">
            {" "}
            I agree to the{" "}
            <span className="text-primary">terms and conditions.</span>
            and to the provision of the service before the expiry of the
            withdrawal period in accordance with § 1834 of the Civil Code.
          </p>
        </Label>
      </div>
    </section>
  );
};

export default AdvertisingPriceLIst;
