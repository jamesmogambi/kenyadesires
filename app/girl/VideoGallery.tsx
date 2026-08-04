"use client";
import React from "react";
import MuxPlayer from "@mux/mux-player-react";
import Image from "next/image";

interface Prop {
  className?: string;
  videos: string[];
}

const VideoGallery = ({ videos, className }: Prop) => {
  const [activeVideo, setActiveVideo] = React.useState(videos?.[0] || "");

  const getThumbnailUrl = (playbackId: string) => {
    if (!playbackId) return null;
    return `https://image.mux.com/${playbackId}/thumbnail.jpg`;
  };

  return (
    <div className={`flex h-200 flex-1 flex-col gap-4 ${className || ""}`}>
      {/* Main player */}
      <div className="h-[70%] mt-4 w-full">
        {videos.length > 0 && activeVideo ? (
          <MuxPlayer
            className="h-full w-full rounded-xl"
            playbackId={activeVideo}
            preload="auto"
            metadata={{
              video_id: activeVideo,
              video_title: "Escort video",
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-2xl text-gray-500">No videos available</p>
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {videos.length > 0 && (
        <div className="flex w-full gap-2 overflow-x-auto">
          {videos.map((playbackId: string, index: number) => (
            <div
              className="relative aspect-video w-1/4 min-w-30 cursor-pointer overflow-hidden rounded-lg"
              key={playbackId || index}
              onClick={() => setActiveVideo(playbackId)}
            >
              <Image
                src={getThumbnailUrl(playbackId) || "/favicon.svg"}
                alt={`Video thumbnail ${index + 1}`}
                fill
                priority={index === 0}
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoGallery;
