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
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface Prop {
  className?: String;
  control?: any;
  form?: any;
}
const WorkHoursForm = ({ control, form, className }: Prop) => {
  return (
    <div className={cn("w-full", className)}>
      <h4 className="my-4 font-bold text-primary text-xl mb-3">
        Opening Hours
      </h4>
      <div className="flex flex-col lg:flex-row w-full gap-10">
        {/* monday - thursdaye working hours */}
        <div className="w-full lg:w-1/2">
          {[
            ["monday", "Monday:"],
            ["tuesday", "Tuesday:"],
            ["wednesday", "Wednesday:"],
            ["thursday", "Thursday:"],
          ].map(([name, label]) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <>
                  <FormItem className="flex flex-row items-center mb-5 gap-4 border-none">
                    <FormLabel className="font-medium text-nowrap text-white/40 text-base w-28 shrink-0">
                      {label}
                    </FormLabel>
                    <FormControl className="border border-primary flex-1 min-w-0">
                      <Input
                        placeholder="08:00 - 20:00"
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

        {/* friday - sunday working hours */}
        <div className="w-full lg:w-1/2">
          {[
            ["friday", "Friday:"],
            ["saturday", "Saturday:"],
            ["sunday", "Sunday:"],
          ].map(([name, label]) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <>
                  <FormItem className="flex flex-row mb-5 items-center gap-4 border-none">
                    <FormLabel className="font-medium text-nowrap text-white/40 text-base w-28 shrink-0">
                      {label}
                    </FormLabel>
                    <FormControl className="border border-primary flex-1 min-w-0">
                      <Input
                        placeholder="08:00 - 20:00"
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
      </div>
    </div>
  );
};

export default WorkHoursForm;
