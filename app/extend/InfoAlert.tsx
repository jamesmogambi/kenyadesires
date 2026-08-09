"use client";

import { cn } from "@/lib/utils";

interface Prop {
  text: string;
  className?: string;
}
const InfoAlert = ({ text, className }: Prop) => {
  return (
    <div
      className={cn(
        "bg-green-600 flex flex-col sm:flex-row justify-center items-center gap-4 py-2.5 w-full text-white text-lg",
        className,
      )}
    >
      <span className="font-semibold text-center">{text}</span>
    </div>
  );
};

export default InfoAlert;
