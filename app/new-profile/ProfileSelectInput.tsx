import { cn } from "@/lib/utils";
import React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select";

interface Props {
  name?: string;
  type?: string;
  register?: any;
  error?: any;
  isMust?: boolean;
  className?: string;
  label?: string;
  prefix?: string;
  options: any[];
  placeholder?: string;
  onChange: (value: any) => void;
  value?: any;
  defaultValue?: any;
  inputClass?: string;
}

const ProfileSelectInput = ({
  name,
  type = "text",
  register,
  error,
  isMust = false,
  className = "",
  options,
  label,
  prefix,
  placeholder = "- Select -",
  onChange,
  value,
  defaultValue,
  inputClass,
}: Props) => {
  const selectedOption = options.find((opt) => opt.name === value);

  return (
    <div className={cn("w-full", className)}>
      <label className="mb-3">{label}</label>

      <Select
        defaultValue={defaultValue}
        value={value}
        onValueChange={onChange}
      >
        <SelectTrigger
          className={cn(
            " py-6 w-full  ring-white outline-0 ring-0 border-white  focus-visible:ring-0 focus-visible:border-0 text-xl border-none outline-none text-black rounded-none  bg-white",
            inputClass
          )}
        >
          {selectedOption
            ? prefix
              ? `${prefix}: ${selectedOption.name}`
              : selectedOption.name
            : placeholder}
        </SelectTrigger>
        <SelectContent className="rounded-none outline-none border-0 bg-white text-black/80 text-xl ">
          <SelectGroup>
            <SelectLabel className="text-lg">Select</SelectLabel>

            {options.map((i, k) => (
              <SelectItem
                className="rounded-none text-black/90  text-lg"
                value={i.name}
                key={k}
              >
                {i.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProfileSelectInput;
