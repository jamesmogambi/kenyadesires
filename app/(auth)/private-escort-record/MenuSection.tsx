import WhyProfile from "@/components/blog/WhyProfile";
import SectionCard from "@/components/SectionCard";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import React from "react";

const MenuSection = () => {
  return (
    <SectionCard>
      <>
        <div className="w-full flex justify-end">
          <p className="text-xl font-light">
            Do you need advice? Call
            <span className="font-bold text-primary"> 0743 129 621</span>
          </p>
        </div>

        <div className="flex flex-col items-start gap-8 lg:gap-6 lg:flex-row my-6">
          {/* section 1 */}
          <div className="basis-full border border-primary  lg:basis-1/2">
            <h4 className="text-white bg-primary text-xl lg:text-2xl py-4 font-bold text-center">
              Girl Registration
            </h4>
            <div className="p-8 ">
              <h4 className="text-white font-bold text-xl lg:text-2xl">
                Contains :
              </h4>
              <ul className="pl-4 mt-6">
                <li className="flex items-center gap-3">
                  <Check className="text-primary" strokeWidth={4} />
                  <span className="font-bold text-lg text-white/50">
                    Complete profile on KenyaDesires.com
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-primary hover:bg-primary/70 cursor-pointer flex justify-center py-7">
              <Link
                className="text-center flex items-center  text-white text-xl lg:text-2xl font-bold"
                href="/register-escort"
              >
                <p>Register</p>

                <ArrowRight
                  className="text-white h-10 w-14 mt-2 "
                  strokeWidth={4}
                />
              </Link>
            </div>
          </div>
          {/* section 2 */}
          <div className="basis-full lg:basis-1/2 border border-black">
            <h4 className="text-white bg-black text-xl lg:text-2xl py-4 font-bold text-center">
              Business Registration
            </h4>

            <div className="p-8 ">
              <h4 className="text-white font-bold text-xl lg:text-2xl">
                Contains :
              </h4>
              <ul className="pl-4 mt-6 space-y-4">
                <li className="flex items-center gap-3">
                  <Check className="text-primary" strokeWidth={4} />
                  <span className="font-bold text-lg text-white/50">
                    unlimited number of girls
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="text-primary" strokeWidth={4} />
                  <span className="font-bold text-lg text-white/50">
                    Complete profile on KenyaDesires.com
                  </span>
                </li>
              </ul>
            </div>

            <p className="text-white px-3 bg-black text-base py-4 font-semibold text-center">
              * This registration is only for private who has at least 2 girls
              under them, not for the girl herself.
            </p>
            <div className="bg-gray-800/80 hover:bg-gray-800/60 cursor-pointer  flex justify-center py-7">
              <Link
                className="text-center flex items-center  text-white text-xl lg:text-2xl font-bold"
                href="/register-business"
              >
                <p>Register</p>
                <ArrowRight
                  className="text-white h-10 w-14 mt-2 "
                  strokeWidth={4}
                />
              </Link>
            </div>
          </div>
        </div>
      </>

      <WhyProfile className="my-8 mt-14" />
    </SectionCard>
  );
};

export default MenuSection;
