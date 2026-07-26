"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useRef, useState } from "react";
import { useFileStore } from "@/store/fileStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB

interface Props {
  className?: string;
}

const PhotoVideoUploads = ({ className }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const { existingImages, files, addFiles, removeExistingImage, removeFile } =
    useFileStore();

  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    setError(null);

    const validImages: File[] = [];
    const errors: string[] = [];

    selectedFiles.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        errors.push(`${file.name} is not an image`);
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        errors.push(`${file.name} exceeds 1MB`);
        return;
      }

      validImages.push(file);
    });

    if (errors.length) {
      setError(errors.join(" • "));
    }

    if (validImages.length) {
      addFiles(validImages);
    }

    e.target.value = "";
  };

  const handleDelete = (item: { type: "existing" | "new"; url: string; file: File | null; index?: number }) => {
    if (item.type === "existing") {
      removeExistingImage(item.url);
    } else if (item.index !== undefined) {
      removeFile(item.index);
    }
  };

  const allImages = [
    ...existingImages.map((url) => ({ type: "existing" as const, url })),
    ...files.map((file, idx) => ({
      type: "new" as const,
      url: URL.createObjectURL(file),
      index: idx,
    })),
  ];

  return (
    <section className={cn("mt-12", className)}>
      <h5 className="text-xl font-semibold">
        Upload your photos
        <span className="text-primary">
          (New – you can now upload your videos too!)
        </span>{" "}
      </h5>
      <div className="p-8 gap-6 lg:gap-0 flex flex-col lg:flex-row border-2 rounded-lg border-dashed">
        {/* Upload Button */}
        <div className="flex flex-col">
          <label className="text-center text-sm">
            Upload one or more files to the gallery
          </label>

          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <Button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="bg-primary py-3  cursor-pointer uppercase  font-semibold rounded-full"
          >
            upload a photo
          </Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {allImages.map((item, idx) => (
            <div key={`${item.type}-${item.url}-${idx}`} className="relative group">
              <button
                type="button"
                onClick={() => handleDelete(item)}
                className="absolute top-2 right-2 z-10 rounded-full bg-red-600 p-1.5 text-white opacity-0 group-hover:opacity-100 transition"
              >
                <X size={16} />
              </button>

              <Image
                src={item.url}
                alt="User photo"
                width={300}
                height={300}
                className="rounded-md object-cover aspect-square"
              />
            </div>
          ))}
        </div>
      </div>
      {/* Error message */}
      {error && (
        <li className="mx-4 my-4 text-base bg-red-200 text-center border border-primary p-6 text-primary">
          {error}
        </li>
      )}
    </section>
  );
};

export default PhotoVideoUploads;
