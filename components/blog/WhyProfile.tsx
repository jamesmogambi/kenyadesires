import { cn } from "@/lib/utils";
import React from "react";
import SectionCard from "../SectionCard";
import Image from "next/image";

interface Prop {
  className?: string;
}
const WhyProfile = ({ className }: Prop) => {
  return (
    <article className={cn("", className)}>
      <SectionCard>
        <h4 className="text-center text-2xl lg:text-3xl  mb-14 font-semibold  text-white">
          Why have a profile on{" "}
          <span className="text-primary">kenyadesires.xyz?</span>
        </h4>

        <div className=" flex justify-center">
          <Image
            src={"/separator.png"}
            alt="separetor"
            priority
            width={60}
            height={20}
            style={{ width: "auto", height: "auto" }}
          />
        </div>

        <div className="flex gap-4  mt-8 flex-col lg:flex-row ">
          {/* 1 */}
          <div className="w-full flex items-center gap-3 lg:w-1/4">
            {/* <div className="bg-primary/25 rounded-full p-4"> */}
            <Image
              src={"/home1.png"}
              alt="home"
              height={90}
              width={90}
              priority
              quality={90}
            />

            <p className="text-white/50 text-lg font-light max-w-1/2 ">
              We are the organic number one in Google searches for sex
              classifieds.
            </p>
            {/* </div >  */}
          </div>

          {/* 2 */}

          <div className="w-full flex items-center gap-3 lg:w-1/4">
            {/* <div className="bg-primary/25 rounded-full p-4"> */}
            <Image
              src={"/home2.png"}
              alt="number of daily users"
              height={90}
              width={90}
              priority
              quality={90}
            />

            <p className="text-white/50 text-lg font-light max-w-1/2 ">
              About 30,000 users visit our website every day, view 270,000 pages
              and spend an average of 7 minutes with us.
            </p>
            {/* </div >  */}
          </div>

          {/* 3 */}

          <div className="w-full flex items-center gap-3 lg:w-1/4">
            {/* <div className="bg-primary/25 rounded-full p-4"> */}
            <Image
              src={"/home3.png"}
              alt="customer satisfication"
              height={90}
              width={90}
              priority
              quality={90}
            />

            <p className="text-white/50 text-lg font-light max-w-1/2 ">
              Satisfaction guarantee, we have countless positive feedback from
              advertisers.
            </p>
            {/* </div >  */}
          </div>

          {/* 4 */}
          <div className="w-full flex items-center gap-3 lg:w-1/4">
            {/* <div className="bg-primary/25 rounded-full p-4"> */}
            <Image
              src={"/home4.png"}
              alt="customer satisfication"
              height={90}
              width={90}
              priority
              quality={90}
            />

            <p className="text-white/50 text-lg font-light max-w-1/2 ">
              Simple administration for editing your profile.
            </p>
            {/* </div >  */}
          </div>
        </div>
      </SectionCard>
    </article>
  );
};

export default WhyProfile;
