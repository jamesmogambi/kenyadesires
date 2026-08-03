"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface Prop {
  value: string[];
  onChange: (value: string[]) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  isOpen?: boolean;
  onIsOpenChange?: (open: boolean) => void;
}

const AgencyMultiSelectField = ({
  value = [],
  onChange,
  options,
  placeholder = "Select...",
  className,
  isOpen,
  onIsOpenChange,
}: Prop) => {
  const selectedSet = new Set(value);

  return (
    <DropdownMenu open={isOpen} onOpenChange={onIsOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "bg-white w-full border-primary text-black px-6 h-10 rounded-full text-lg focus-visible:ring-0 flex items-center justify-between gap-2 truncate cursor-pointer",
            className,
          )}
        >
          <span className="truncate">
            {value.length > 0
              ? `${value.length} region(s) selected`
              : placeholder}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white border-0 text-black w-full min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-72 overflow-y-auto">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selectedSet.has(option.value)}
            onCheckedChange={(checked) => {
              const next = checked
                ? Array.from(new Set([...value, option.value]))
                : value.filter((v) => v !== option.value);
              onChange(next);
            }}
            className="text-black/90 text-lg data-[highlighted]:bg-primary data-[highlighted]:text-white"
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AgencyMultiSelectField;
