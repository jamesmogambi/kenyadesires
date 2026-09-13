import { cn, convertToLocalPhone, formatKenyanPhoneNumber } from "@/lib/utils";
import { PhoneCall } from "lucide-react";
import React from "react";

interface Prop {
  className?: string;
  phone: string | null;
}

const app = null;
const PhonePicker = ({ phone, className }: Prop) => {
  return (
    <div
      className={cn(
        "bg-primary flex p-2 cursor-pointer overflow-ellipsis  items-center gap-3  text-white w-full rounded-full",
        className,
      )}
    >
      <div className="rounded-full p-3 bg-white text-primary">
        <PhoneCall className="lg:h-7 lg:w-7 h-5 w-5" />
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="lg:text-2xl text-lg font-semibold">
          {formatKenyanPhoneNumber(phone)}
        </p>
        <p className="lg:text-sm whitespace-nowrap overflow-hidden text-ellipsis  text-nowrap text-[12px] font-semibold">
          Say you're calling from kenyadesires.xyz
        </p>
      </div>
    </div>
  );
};

export default PhonePicker;
