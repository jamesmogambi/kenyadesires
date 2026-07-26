"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { cn, formatCategory } from "@/lib/utils";

interface Prop {
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
}

const AgencyTagsInput = ({
  label,
  value,
  onChange,
  placeholder = "Type and press enter",
  suggestions = [],
  className,
}: Prop) => {
  const [inputValue, setInputValue] = useState("");

  const addTag = (raw: string) => {
    const formatted = formatCategory(raw.trim());

    if (formatted && !value.includes(formatted)) {
      onChange([...value, formatted]);
    }
  };

  const toggleTag = (tag: string) => {
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag));
    } else {
      onChange([...value, tag]);
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className={cn("w-full", className)}>
      <label className="font-medium text-white/40 text-base">{label}</label>

      <div className="flex items-center gap-2 mt-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(inputValue);
              setInputValue("");
            }
          }}
          placeholder={placeholder}
          className="bg-white text-black px-6 h-10 rounded-full text-lg focus-visible:ring-0 border-primary"
        />
        <Button
          type="button"
          onClick={() => {
            addTag(inputValue);
            setInputValue("");
          }}
          className="bg-primary hover:bg-primary/70 cursor-pointer h-10 rounded-full px-6 font-semibold text-white uppercase"
        >
          add
        </Button>
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {suggestions.map((suggestion) => {
            const selected = value.includes(suggestion);
            return (
              <button
                key={suggestion}
                type="button"
                onClick={() => toggleTag(suggestion)}
                className={cn(
                  "rounded-full cursor-pointer px-4 py-1 text-base font-medium transition-colors",
                  selected
                    ? "bg-primary text-white"
                    : "bg-[#262322] text-white/70 hover:bg-gray-1",
                )}
              >
                {suggestion}
              </button>
            );
          })}
        </div>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {value.map((tag) => (
            <Badge
              key={tag}
              className="hover:bg-primary hover:text-white text-base"
              variant="secondary"
            >
              {tag}
              <button
                type="button"
                className="ml-2 cursor-pointer"
                onClick={() => removeTag(tag)}
              >
                <XIcon className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgencyTagsInput;
