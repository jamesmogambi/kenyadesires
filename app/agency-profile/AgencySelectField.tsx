"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface Prop {
  value?: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  isOpen?: boolean;
  onIsOpenChange?: (open: boolean) => void;
}

const AgencySelectField = ({
  value,
  onChange,
  options,
  placeholder = "- Select -",
  className,
  isOpen,
  onIsOpenChange,
}: Prop) => {
  return (
    <Select
      value={value}
      onValueChange={onChange}
      open={isOpen}
      onOpenChange={onIsOpenChange}
    >
      <SelectTrigger
        className={cn(
          "bg-white w-full border-primary text-black px-6 h-10 rounded-full text-lg focus-visible:ring-0",
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-white border-0 text-black/80">
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="text-black/90 text-lg"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default AgencySelectField;
