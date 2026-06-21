import React from "react";
import {Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator,} from "@/components/ui/breadcrumb";

import Link from "next/link";

interface HeaderProps {
    county?: string;
    region?: string;
    name: string;
}

const Header = ({county, region, name = "Agency"}: HeaderProps) => {
    return (
        <header>
            <Breadcrumb className="p-4">
                <BreadcrumbList className="items-center flex-nowrap ">
                    <BreadcrumbItem>
                        <Link
                            className="text-primary hover:text-primary bg-transparent text-sm lg:text-lg font-bold"
                            href="/"
                        >
                            Introduction
                        </Link>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="text-lg text-white">
                        -
                    </BreadcrumbSeparator>
                    <BreadcrumbItem>
                        <Link
                            className="text-primary hover:text-primary bg-transparent text-sm lg:text-lg font-bold"
                            href={`/girls?region=${region}`}
                        >
                            sex <span className="capitalize">{region}</span>
                        </Link>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="text-white text-lg">
                        -
                    </BreadcrumbSeparator>
                    <BreadcrumbItem className="cursor-default">
                        <Link
                            className=" hover:text-white text-white cursor-default bg-transparent text-sm lg:text-lg font-bold"
                            href="#"
                        >
                            {name} {county}
                        </Link>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        </header>
    );
};

export default Header;
