"use client";

import Image from "next/image";
import { X, Video } from "lucide-react";
import { useRef, useState } from "react";
import { useFileStore } from "@/store/fileStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB (Mux limit)

interface Props {
  className?: string;
}

const PhotoVideoUploads = ({ className }: Props) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const {
    existingImages,
    files,
    addFiles,
    removeExistingImage,
    removeFile,
    existingVideos,
    videoFiles,
    addVideoFiles,
    removeVideoFile,
    removeExistingVideo,
    clearVideoFiles,
  } = useFileStore();

  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    setError(null);

    const validVideos: File[] = [];
    const errors: string[] = [];

    selectedFiles.forEach((file) => {
      if (!file.type.startsWith("video/")) {
        errors.push(`${file.name} is not a video`);
        return;
      }

      if (file.size > MAX_VIDEO_SIZE) {
        errors.push(`${file.name} exceeds 500MB`);
        return;
      }

      validVideos.push(file);
    });

    if (errors.length) {
      setError(errors.join(" • "));
    }

    if (validVideos.length) {
      addVideoFiles(validVideos);
      toast.info(
        `${validVideos.length} video(s) added. They will be uploaded to Mux after profile creation.`,
      );
    }

    e.target.value = "";
  };

  const handleImageDelete = (item: { type: "existing" | "new"; url: string; file: File | null; index?: number }) => {
    if (item.type === "existing") {
      removeExistingImage(item.url);
    } else if (item.index !== undefined) {
      removeFile(item.index);
    }
  };

  const handleVideoDelete = (index: number) => {
    removeVideoFile(index);
  };

  const handleExistingVideoDelete = (playbackId: string) => {
    removeExistingVideo(playbackId);
  };

  const allImages = [
    ...existingImages.map((url) => ({ type: "existing" as const, url, file: null as File | null })),
    ...files.map((file, idx) => ({
      type: "new" as const,
      url: URL.createObjectURL(file),
      file,
      index: idx,
    })),
  ];

  const videoPreviews = videoFiles.map((file, idx) => ({
    url: URL.createObjectURL(file),
    name: file.name,
    size: (file.size / (1024 * 1024)).toFixed(1),
    index: idx,
  }));

  return (
    <section className={cn("mt-12", className)}>
      <h5 className="text-xl font-semibold">
        Upload your photos
        <span className="text-primary">
          {" "}
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
            ref={imageInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />

          <Button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="bg-primary py-3 cursor-pointer uppercase font-semibold rounded-full"
          >
            upload a photo
          </Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {allImages.map((item, idx) => (
            <div
              key={`${item.type}-${item.url}-${idx}`}
              className="relative group"
            >
              <button
                type="button"
                onClick={() => handleImageDelete(item)}
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

      {/* Video Upload Section */}
      <div className="mt-8">
        <h5 className="text-xl font-semibold mb-4">
          Upload your videos <span className="text-primary">(optional)</span>
        </h5>

        <div className="border-2 border-dashed rounded-lg p-6">
          <div className="flex flex-col items-center justify-center py-6">
            <Video className="size-12 text-stone-500 mb-2" />
            <label className="text-center text-sm text-stone-400">
              Upload video files (max 500MB each)
            </label>

            <input
              ref={videoInputRef}
              type="file"
              multiple
              accept="video/*"
              className="hidden"
              onChange={handleVideoChange}
            />

            <Button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="bg-primary py-3 cursor-pointer uppercase font-semibold rounded-full mt-4"
            >
              upload a video
            </Button>
          </div>

          {/* Video Previews */}
          {videoPreviews.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {videoPreviews.map((video) => (
                <div
                  key={video.index}
                  className="relative group border rounded-lg overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => handleVideoDelete(video.index)}
                    className="absolute top-2 right-2 z-10 rounded-full bg-red-600 p-1.5 text-white opacity-0 group-hover:opacity-100 transition"
                  >
                    <X size={16} />
                  </button>

                  <video
                    src={video.url}
                    poster="https://via.placeholder.com/300x200?text=Video+Preview"
                    className="w-full h-32 object-cover"
                    muted
                    preload="metadata"
                  />

                  <div className="p-2">
                    <p className="text-sm font-medium truncate">{video.name}</p>
                    <p className="text-xs text-stone-400">{video.size} MB</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Existing Videos (from Mux) */}
          {existingVideos.length > 0 && (
            <div className="mt-4">
              <h6 className="text-sm font-semibold text-stone-300 mb-2">
                Existing videos on Mux
              </h6>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {existingVideos.map((playbackId) => (
                  <div
                    key={playbackId}
                    className="relative group border rounded-lg overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => handleExistingVideoDelete(playbackId)}
                      className="absolute top-2 right-2 z-10 rounded-full bg-red-600 p-1.5 text-white opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={16} />
                    </button>

                    <div className="relative w-full h-32">
                      <Image
                        src={`https://image.mux.com/${playbackId}/thumbnail.jpg`}
                        alt={`Existing video ${playbackId.slice(0, 8)}`}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="p-2">
                      <p className="text-sm font-medium text-stone-400 truncate">
                        Mux video
                      </p>
                      <p className="text-xs text-stone-500">
                        ID: {playbackId.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <li className="mx-4 my-4 text-base bg-red-200 text-center border border-primary p-6 text-primary">
            {error}
          </li>
        )}
      </div>
    </section>
  );
};

export default PhotoVideoUploads;
