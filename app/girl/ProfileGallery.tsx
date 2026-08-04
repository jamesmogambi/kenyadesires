import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import PhotoGallery from "./PhotoGallery";
import VideoGallery from "./VideoGallery";

interface Prop {
  photos: string[];
  videos: string[];
}
const ProfileGallery = ({ photos, videos }: Prop) => {
  // const { photos, videos } = girl;
  return (
    <div className=" h-full  flex-1 ">
      {/* header */}
      <Tabs defaultValue="photos" className="w-full bg-transparent">
        <TabsList className="w-full gap-3  lg:gap-6 bg-transparent ">
          <TabsTrigger
            className=" data-[state=active]:bg-primary text-lg font-semibold cursor-pointer py-6 px-6 items-center flex gap-2 bg-gray-1"
            value="photos"
          >
            <span className="text-white text-2xl font-semibold">photos</span>
            <Badge className="bg-white mt-1 text-lg   rounded-xl py-0 text-primary px-4.5  ">
              {photos.length}
            </Badge>
            <span></span>
          </TabsTrigger>
          <TabsTrigger
            className="group text-lg data-[state=active]:bg-primary  font-semibold cursor-pointer py-6 px-6 items-center flex gap-2 bg-gray-1"
            value="videos"
          >
            <span className="text-white text-2xl font-semibold">videos</span>

            <div className="bg-white group-data-[state=active]:text-white px-2 group-data-[state=active]:bg-primary   rounded-md flex items-center gap-2 text-black ">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-7"
              >
                <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
              </svg>

              <span className="text-lg">{videos.length}</span>
            </div>
          </TabsTrigger>
        </TabsList>
        <TabsContent className="   border-sky-700" value="photos">
          <PhotoGallery photos={photos} />
        </TabsContent>
        <TabsContent value="videos">
          <VideoGallery videos={videos} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileGallery;
