"use client";
import Image from "next/image";
import React from "react";
import NavMenu from "./NavMenu";
import Link from "next/link";
import { Search } from "lucide-react";
import NavActions from "./NavActions";
import MobileHeader from "./MobileHeader";
import SearchSheet from "./SearchSheet";
import { useUser } from "@clerk/nextjs";
import LoginFormSheet from "@/app/(auth)/LoginFormSheet";
import Logo from "./Logo";
import { ICounty } from "@/server-actions/region.action";
import PopularCountiesInitializer from "./PopularCountiesInitializer";

interface Prop {
  initialCounties?: ICounty[];
}
const Header = ({ initialCounties }: Prop) => {
  const { isSignedIn } = useUser();

  // set to zustand store

  return (
    <>
      <MobileHeader />
      <PopularCountiesInitializer counties={initialCounties || []} />

      <div className="lg:flex  hidden items-center gap-12 w-full px-12 bg-dark-slate">
        {/* logo */}
        <Logo />

        <div className=" border-white flex flex-1 items-center justify-between">
          {/* menu */}

          <NavMenu />

          {/* actions */}

          {isSignedIn ? (
            <NavActions />
          ) : (
            <div className="flex gap-3 items-center">
              <SearchSheet />
              <div className="flex gap-3">
                <LoginFormSheet>
                  <span
                    className="text-white cursor-pointer font-medium p-2 px-4 rounded-sm  hover:text-primary  bg-[#343434]"
                    // href=""
                  >
                    login
                  </span>
                </LoginFormSheet>

                <Link
                  className="text-white p-2 text-nowrap   px-4 font-medium rounded-sm   bg-primary"
                  href="/private-escort-record"
                >
                  {/* register escort */}
                  register
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Header;
