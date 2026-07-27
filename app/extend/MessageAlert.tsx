import { cn } from "@/lib/utils";
import React from "react";

interface Prop {
  text: String;
  className?: string;
}
const MessageAlert = ({ text, className }: Prop) => {
  return (
    <div
      className={cn(
        "bg-purple-700 py-2.5 flex justify-center items-center text-white text-bas font-semibold",
        className,
      )}
    >
      <p className="text-lg font-semibold">{text}</p>
    </div>
  );
};

export default MessageAlert;
