// import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";

interface Prop {
  title: string;
  category?: string;
}

const BreadCrumbHeader = ({
  title = "Blog Title",
  category = "Uncategorized",
}: Prop) => {
  // Truncate function for very long titles
  const truncateTitle = (str: string, maxLength: number = 30) => {
    if (str.length <= maxLength) return str;
    return `${str.substring(0, maxLength)}...`;
  };

  return (
    <header className="lg:max-w-[85%] w-full mx-auto">
      <Breadcrumb className="p-4">
        <BreadcrumbList className="items-center overflow-hidden flex-nowrap whitespace-nowrap">
          {/* Home */}
          <BreadcrumbItem className="flex-shrink-0">
            <Link
              className="text-primary hover:text-primary bg-transparent text-sm lg:text-lg font-bold"
              href="/"
            >
              Introduction
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-lg text-white flex-shrink-0">
            -
          </BreadcrumbSeparator>

          {/* Blog */}
          <BreadcrumbItem className="cursor-default flex-shrink-0">
            <Link
              className="text-primary cursor-pointer bg-transparent text-sm lg:text-lg font-bold"
              href="/blog"
            >
              Blog
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-lg text-white flex-shrink-0">
            -
          </BreadcrumbSeparator>

          {/* Category */}
          <BreadcrumbItem className="cursor-default flex-shrink-0">
            <Link
              className="text-primary cursor-pointer bg-transparent text-sm lg:text-lg font-bold"
              href={`/blog/category/${category || "uncategorized"}`}
            >
              {category}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-lg text-white flex-shrink-0">
            -
          </BreadcrumbSeparator>

          {/* Title with truncation and tooltip */}
          <BreadcrumbItem className="cursor-pointer max-w-[120px] sm:max-w-[200px] md:max-w-[300px] lg:max-w-[400px] xl:max-w-[500px]">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    className="text-white cursor-default bg-transparent text-sm lg:text-lg font-bold block truncate w-full"
                    href="#"
                  >
                    {title}
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs wrap-break-word">{title}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
};

export default BreadCrumbHeader;
