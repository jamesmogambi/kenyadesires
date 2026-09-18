import Image from "next/image";
import { X } from "lucide-react";
import {
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import { cn } from "@/lib/utils";

export interface PreviewPhotoHandle {
  getPreviewFile: () => File | null;
  getPreviewUrl: () => string;
  clear: () => void;
  setStoredUrl: (url: string) => void;
}

type Prop = {
  className?: string;
  form: any;
  storedImageUrl?: string | null;
};

const PreviewPhoto = forwardRef<PreviewPhotoHandle, Prop>(
  ({ className, form, storedImageUrl }, ref) => {
    const { watch, setValue } = form;

    const inputRef = useRef<HTMLInputElement>(null);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>(storedImageUrl || "");

    useEffect(() => {
      if (!previewFile && storedImageUrl) {
        setPreviewUrl(storedImageUrl);
      }
    }, [storedImageUrl, previewFile]);

    useImperativeHandle(ref, () => ({
      getPreviewFile: () => previewFile,
      getPreviewUrl: () => previewUrl,
      clear: () => {
        setPreviewFile(null);
        setPreviewUrl("");
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      },
      setStoredUrl: (url: string) => {
        setPreviewFile(null);
        setPreviewUrl(url);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      },
    }));

    const triggerFileSelect = () => {
      inputRef.current?.click();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (selectedFiles && selectedFiles.length > 0) {
        const file = selectedFiles[0];
        setPreviewFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        e.target.value = "";
      }
    };

    const clearImage = () => {
      setPreviewFile(null);
      setPreviewUrl("");

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    };

    return (
      <>
        {previewUrl && (
          <div className="relative mt-6 inline-block">
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 cursor-pointer right-2 z-10 rounded-full bg-primary p-1.5 text-white hover:bg-red-600 transition"
            >
              <X size={16} />
            </button>

            <Image
              src={previewUrl}
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
          <input
            type="file"
            accept="image/*"
            ref={inputRef}
            className="hidden"
            onChange={handleChange}
          />

          <div
            onClick={triggerFileSelect}
            className="border flex-1 overflow-hidden cursor-pointer flex rounded-full border-primary"
          >
            <span className="w-2/3  py-3 pl-3 flex items-center text-nowrap  h-12 text-lg text-white/30">
              {previewUrl || "No preview selected"}
            </span>
            <span className="flex-1 bg-primary justify-center items-center flex font-bold text-white uppercase  text-center text-xl">
              insert
            </span>
          </div>
        </div>
      </>
    );
  },
);

PreviewPhoto.displayName = "PreviewPhoto";

export default PreviewPhoto;
