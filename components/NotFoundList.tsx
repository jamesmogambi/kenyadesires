import React from "react";
import GirlList from "./GirlList";
import { cn } from "@/lib/utils";
import { ITEMS_PER_PAGE } from "@/constants";
import { getEscorts } from "@/server-actions/escort.action";
import { getCachedEscorts } from "@/lib/cache";

interface Prop {
  className?: string;
}
const NotFoundList = async ({ className }: Prop) => {
  const res = await getCachedEscorts({
    sortBy: "createdAt",
    limit: ITEMS_PER_PAGE,
  });

  return (
    <>
      {res.total > 0 && (
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
          <div>{res.total > 0 && <GirlList girls={res.escorts} />}</div>
        </section>
      )}
    </>
  );
};

export default NotFoundList;
