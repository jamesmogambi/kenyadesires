import { cn } from "@/lib/utils";
import React from "react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface Prop {
  form: any;
  className?: string;
}
const AboutMeForm = ({ form, className }: Prop) => {
  const rows = [
    { name: "myAge", label: "Age:" },
    { name: "myWeight", label: "Weight:" },
    { name: "myHeight", label: "Height:" },
    { name: "myBreasts", label: "Breasts:" },
  ];

  return (
    <section className={cn("w-full", className)}>
      <h4 className="text-xl text-primary mb-6 font-bold">About me:</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
        {rows.map(({ name, label }) => (
          <FormField
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
              <>
                <FormItem className="flex flex-row items-center gap-4 mb-4 border-none">
                  <FormLabel className="font-medium text-nowrap text-white/40 text-base w-28 shrink-0">
                    {label}
                  </FormLabel>
                  <FormControl className="border border-primary flex-1 min-w-0">
                    <Input
                      placeholder=""
                      {...field}
                      className="bg-white text-black px-6 h-10 rounded-full text-2xl focus-visible:ring-0 w-full"
                    />
                  </FormControl>
                </FormItem>
                <FormMessage className="-mt-4" />
              </>
            )}
          />
        ))}
      </div>
    </section>
  );
};

export default AboutMeForm;
