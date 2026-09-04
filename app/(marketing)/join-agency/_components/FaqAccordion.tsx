"use client";

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import React, { useState } from "react";

const FaqAccordion = ({
  items,
  className,
}: {
  items: { question: string; answer: string }[];
  className?: string;
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="border border-white/10 rounded-lg bg-white/5 overflow-hidden"
          >
            <CollapsiblePrimitive.Root open={isOpen} onOpenChange={() => setOpenIndex(isOpen ? null : index)}>
              <CollapsiblePrimitive.Trigger
                className="flex w-full items-center justify-between px-6 py-4 text-left"
              >
                <span className="font-semibold text-white">{item.question}</span>
                <ChevronDown
                  className={cn(
                    "size-5 text-primary transition-transform duration-300",
                    isOpen && "rotate-180",
                  )}
                />
              </CollapsiblePrimitive.Trigger>
              <CollapsiblePrimitive.Content
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  isOpen ? "max-h-96" : "max-h-0",
                )}
              >
                <div className="px-6 pb-4 text-white/70 text-sm leading-relaxed">
                  {item.answer}
                </div>
              </CollapsiblePrimitive.Content>
            </CollapsiblePrimitive.Root>
          </div>
        );
      })}
    </div>
  );
};

export default FaqAccordion;
