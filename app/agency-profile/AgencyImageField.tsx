"use client";

import Image from "next/image";
import { X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Prop {
  label: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  /** Already uploaded image, shown until a new file is picked */
  existingUrl?: string;
  onClear?: () => void;
  className?: string;
}

const AgencyImageField = ({
  label,
  file,
  onFileChange,
  existingUrl = "",
  onClear,
  className,
}: Prop) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [filePreview, setFilePreview] = useState<string>("");

  useEffect(() => {
    if (!file) {
      setFilePreview("");
      return;
    }

    const url = URL.createObjectURL(file);
    setFilePreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const previewUrl = filePreview || existingUrl;

  const clearImage = () => {
    onFileChange(null);
    onClear?.();
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center gap-3 w-full">
        <label className="text-base font-medium text-white/40 text-nowrap">
          {label}
        </label>

        <input
          type="file"
          accept="image/*"
          ref={inputRef}
          className="hidden"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) onFileChange(selected);
            e.target.value = "";
          }}
        />

        <div
          onClick={() => inputRef.current?.click()}
          className="border flex-1 h-10 overflow-hidden cursor-pointer flex rounded-full border-primary"
        >
          <span className="flex-1 truncate pl-4 flex items-center text-base text-white/30">
            {file
              ? file.name
              : existingUrl
                ? "Current image - click to replace"
                : "No image selected"}
          </span>
          <span className="w-1/3 bg-primary justify-center items-center flex font-bold text-white uppercase text-base">
            insert
          </span>
        </div>
      </div>

      {previewUrl && (
        <div className="relative mt-4 inline-block">
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-2 cursor-pointer right-2 z-10 rounded-full bg-primary p-1.5 text-white hover:bg-red-600 transition"
          >
            <X size={16} />
          </button>

          <Image
            src={previewUrl}
            alt={label}
            width={180}
            height={180}
            className="rounded-md object-cover"
          />
        </div>
      )}
    </div>
  );
};

export default AgencyImageField;
