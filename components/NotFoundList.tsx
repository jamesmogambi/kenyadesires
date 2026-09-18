import React from "react";
import GirlList from "./GirlList";
import { cn } from "@/lib/utils";
import { ITEMS_PER_PAGE } from "@/constants";
import { getEscortsWithCleanedImages } from "@/server-actions/cleaned-escorts.action";

interface Prop {
  className?: string;
  county?: string | null;
}

const NotFoundList = async ({ className, county }: Prop): Promise<React.ReactNode> => {
  const res = await getEscortsWithCleanedImages({
    county: county && county !== "all" ? county : undefined,
    sortBy: "createdAt",
    limit: ITEMS_PER_PAGE,
    isActive: true,
  });

  if (res.total === 0) return null;

  return (
    <section className={cn("my-6 mt-14", className)}>
      <p className="font-semibold mb-8 text-center text-xl">
        {" "}
        <span className="text-primary">
          Unfortunately, we have to disappoint you, but there are no girls
          for sex{" "}
        </span>
        {"  "}
        advertised in this region yet , try girls from other regions
        below.{" "}
      </p>
      <div><GirlList girls={res.escorts} /></div>
    </section>
  );
};

export default NotFoundList;
