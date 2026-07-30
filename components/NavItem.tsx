"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
  path: string;
  text: string;
}
const NavItem = ({ children, path, className, text = "Item" }: Props) => {
  const pathname = usePathname();
  return (
    <li className={cn("group border border-green-600", className)}>
      <Link href={`${path}`} className="flex gap-3  items-center">
        {/* icon */}
        {children}

        <div
          className={cn(
            "border-b-[6px] border-transparent h-28 justify-between flex flex-col items-center pb-10 group-hover:border-primary box-border",
            pathname.includes(path) && "border-b-[6px] border-primary",
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={26}
            height={26}
            viewBox="0 0 24 24"
            className={cn(
              "group-hover:text-primary text-dark-slate",
              pathname.includes(path) && "text-primary",
            )}
          >
            <path
              fill="currentColor"
              d="M11.178 19.569a.998.998 0 0 0 1.644 0l9-13A.999.999 0 0 0 21 5H3a1.002 1.002 0 0 0-.822 1.569z"
            ></path>
          </svg>

          <span
            className={cn(
              "uppercase text-nowrap   group-hover:text-primary text-white text-lg font-semibold ",
              pathname.includes(path) && "text-primary",
            )}
          >
            {text}
          </span>
        </div>

        {/* text */}

        <div className="flex items-center gap-2"></div>

        {/* bottom-border */}
      </Link>
    </li>
  );
};

export default NavItem;
