// "use client";
// import { cn } from "@/lib/utils";
// import { useFileStore } from "@/store/fileStore";
// import { useFormStore } from "@/store/formStore";
// import { X } from "lucide-react";
// import Image from "next/image";
// import React, { useEffect, useRef, useState } from "react";

// interface Prop {
//   className?: string;
//   form?: any;
// }

// // TODO:// HOOK TO GLOBAL STORE
// const PreviewPhoto = ({ className, form }: Prop) => {
//   const { watch, setValue } = form;
//   const { setFiles, files } = useFormStore();

//   const preview =
//     files && files.length > 0 ? URL.createObjectURL(files.item(0)!) : null;

//   const inputRef = useRef<HTMLInputElement>(null);

//   const triggerFileSelect = () => {
//     inputRef.current?.click();
//   };

//   const handleChange = (e: any) => {
//     const selectedFiles = e.target.files;
//     if (selectedFiles && selectedFiles.length > 0) {
//       setFiles(selectedFiles); // ✅ Store the files
//       // setValue("photo", selectedFiles); // Optional: still update form
//     }
//   };

//   // TODO:Remove photo

//   const clearImage = () => {
//     setFiles(null); // Clear the selected file
//     // setPreviewUrl(null); // Clear the preview URL

//     if (inputRef.current) {
//       inputRef.current.value = ""; // Reset the input so same file can be selected again
//     }
//   };

//   return (
//     <>
//       {/* TODO: PREVIEW IMAGE */}
//       {preview && (
//         <div className="relative mt-6 inline-block">
//           {/* Delete button */}
//           <button
//             type="button"
//             onClick={clearImage}
//             className="absolute top-2 cursor-pointer right-2 z-10 rounded-full bg-primary p-1.5 text-white hover:bg-red-600 transition"
//           >
//             <X size={16} />
//           </button>

//           {/* Preview image */}
//           <Image
//             src={preview}
//             alt="Preview"
//             width={200}
//             height={200}
//             className="rounded-md object-cover"
//           />
//         </div>
//       )}

//       <div className={cn("flex items-center gap-3 w-full", className)}>
//         <label className=" text-lg font-bold text-primary ">
//           Preview Photo:
//         </label>
//         {/* Hidden native input */}
//         <input
//           type="file"
//           accept="image/*"
//           // {...register("photo")}
//           ref={inputRef}
//           className="hidden"
//           onChange={handleChange}
//         />

//         <div
//           onClick={triggerFileSelect}
//           className="border flex-1 overflow-hidden cursor-pointer flex rounded-full border-primary"
//         >
//           <span className="w-2/3  py-3 pl-3 flex items-center text-nowrap  h-12 text-lg text-white/30">
//             {preview}
//           </span>
//           <span className="flex-1 bg-primary justify-center items-center flex font-bold text-white uppercase  text-center text-xl">
//             insert
//           </span>
//         </div>
//       </div>
//     </>
//   );
// };

// export default PreviewPhoto;

import Image from "next/image";
import { X } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useFormStore } from "@/store/formStore";

type Prop = {
  className?: string;
  form: any;
  storedImageUrl?: string | null;
  onClear?: () => void;
};

const PreviewPhoto = ({ className, form, storedImageUrl, onClear }: Prop) => {
  const { watch, setValue } = form;
  const { setFiles, files } = useFormStore();

  const inputRef = useRef<HTMLInputElement>(null);

  // State to hold local preview URL from File object
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  // Generate local preview URL when files change
  useEffect(() => {
    if (files && files.length > 0) {
      const url = URL.createObjectURL(files[0]);
      setLocalPreview(url);

      return () => {
        URL.revokeObjectURL(url);
        setLocalPreview(null);
      };
    } else {
      setLocalPreview(null);
    }
  }, [files]);

  // Determine what to preview:
  // Prefer local file preview, else stored DB image URL
  const preview = localPreview || storedImageUrl || null;

  const triggerFileSelect = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      setFiles(selectedFiles); // store files locally
      // optionally update form value here if needed
    }
  };

  // Clear image handler clears files and optionally notifies parent to clear stored URL
  const clearImage = () => {
    setFiles([]); // clear selected files locally
    onClear?.(); // notify parent to clear stored preview URL

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <>
      {/* TODO: PREVIEW IMAGE */}
      {preview && (
        <div className="relative mt-6 inline-block">
          {/* Delete button */}
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-2 cursor-pointer right-2 z-10 rounded-full bg-primary p-1.5 text-white hover:bg-red-600 transition"
          >
            <X size={16} />
          </button>

          {/* Preview image */}
          <Image
            src={preview}
            alt="Preview"
            width={200}
            height={200}
            className="rounded-md object-cover"
          />
        </div>
      )}

      <div className={cn("flex items-center gap-3 w-full", className)}>
        <label className=" text-lg font-bold text-primary ">
          Preview Photo:
        </label>
        {/* Hidden native input */}
        <input
          type="file"
          accept="image/*"
          // {...register("photo")}
          ref={inputRef}
          className="hidden"
          onChange={handleChange}
        />

        <div
          onClick={triggerFileSelect}
          className="border flex-1 overflow-hidden cursor-pointer flex rounded-full border-primary"
        >
          <span className="w-2/3  py-3 pl-3 flex items-center text-nowrap  h-12 text-lg text-white/30">
            {preview}
          </span>
          <span className="flex-1 bg-primary justify-center items-center flex font-bold text-white uppercase  text-center text-xl">
            insert
          </span>
        </div>
      </div>
    </>
  );
};

export default PreviewPhoto;
