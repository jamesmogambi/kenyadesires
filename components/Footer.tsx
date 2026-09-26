"use client";

import React from "react";
import Logo from "./Logo";
import Link from "next/link";
import FooterBottom from "./FooterBottom";
import { useUser } from "@clerk/nextjs";

const Footer = () => {
  const { isSignedIn } = useUser();
  const isLoggedIn = Boolean(isSignedIn);

  return (
    <footer className="w-full">
      {/* // section 1 */}
      <div className="bg-dark-slate py-4  w-full ">
        <div className="w-full pl-5 lg:p-0 lg:items-center justify-between lg:max-w-[1400] flex flex-col lg:flex-row mx-auto  border-white ">
          <Logo />

          <div className="flex flex-col lg:flex-row gap-2 lg:gap-4 mt-4 lg:mt-0">
            <Link
              href={"/girls"}
              className="uppercase hover:text-primary group lg:py-5 font-medium text-base lg:text-lg "
            >
              girls for sex
            </Link>

            {/* A <span>, not a <Link>: this used to be a <Link href="#">
                wrapping the real link, which nested one <a> inside another
                and threw a hydration error. The outer element only carried
                layout and the `group` hook, so a span is the correct
                element — and the dead `href="#"` is gone. */}
            <span className="uppercase group text-base flex font-medium items-center  gap-2 lg:py-5 lg:text-lg   ">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={20}
                height={20}
                viewBox="0 0 48 48"
                className="text-gray-500 hidden lg:block"
              >
                <path
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth={4}
                  d="M24 33a9 9 0 1 0 0-18a9 9 0 0 0 0 18Z"
                ></path>
              </svg>{" "}
              <Link
                href="/blog/erectile-dysfunction-treatment"
                className="text-[#e33bb3] group-hover:font-bold font-medium"
              >
                erection support
              </Link>
            </span>

            <Link
              href={
                isLoggedIn
                  ? "/private-apartment-girl-listing"
                  : "/private-escort-record"
              }
              className="uppercase group  font-medium flex items-center  gap-2 lg:py-5 lg:text-lg text-base"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={20}
                height={20}
                viewBox="0 0 48 48"
                className="text-gray-500 hidden lg:block"
              >
                <path
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth={4}
                  d="M24 33a9 9 0 1 0 0-18a9 9 0 0 0 0 18Z"
                ></path>
              </svg>{" "}
              <span className=" group-hover:text-primary">
                create an advertisement
              </span>
            </Link>

            <Link
              href="/contact"
              className="uppercase group font-medium flex items-center  gap-2 lg:py-5 text-base lg:text-lg  "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={20}
                height={20}
                viewBox="0 0 48 48"
                className="text-gray-500 hidden lg:block"
              >
                <path
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth={4}
                  d="M24 33a9 9 0 1 0 0-18a9 9 0 0 0 0 18Z"
                ></path>
              </svg>{" "}
              <span className="group-hover:text-primary ">contact</span>
            </Link>

            {/* AEO: /about and /frequent-questions carry the entity
                definition and the brand/trust answers. They need a
                site-wide internal link or answer engines treat them as
                orphaned and skip them. */}
            <Link
              href="/about"
              className="uppercase group font-medium flex items-center  gap-2 lg:py-5 text-base lg:text-lg  "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={20}
                height={20}
                viewBox="0 0 48 48"
                className="text-gray-500 hidden lg:block"
              >
                <path
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth={4}
                  d="M24 33a9 9 0 1 0 0-18a9 9 0 0 0 0 18Z"
                ></path>
              </svg>{" "}
              <span className="group-hover:text-primary">about</span>
            </Link>

            <Link
              href="/frequent-questions"
              className="uppercase group font-medium flex items-center  gap-2 lg:py-5 text-base lg:text-lg  "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={20}
                height={20}
                viewBox="0 0 48 48"
                className="text-gray-500 hidden lg:block"
              >
                <path
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth={4}
                  d="M24 33a9 9 0 1 0 0-18a9 9 0 0 0 0 18Z"
                ></path>
              </svg>{" "}
              <span className="group-hover:text-primary">faq</span>
            </Link>


            <Link
              href={"/privacy-policy"}
              className="uppercase group font-medium flex items-center  gap-2 lg:py-5 text-base lg:text-lg   "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={20}
                height={20}
                viewBox="0 0 48 48"
                className="text-gray-500 hidden lg:block"
              >
                <path
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth={4}
                  d="M24 33a9 9 0 1 0 0-18a9 9 0 0 0 0 18Z"
                ></path>
              </svg>{" "}
              <span className=" group-hover:text-primary">privacy policy</span>
            </Link>
          </div>
        </div>
      </div>

      {/* section 2 */}

      <FooterBottom />
    </footer>
  );
};

export default Footer;
