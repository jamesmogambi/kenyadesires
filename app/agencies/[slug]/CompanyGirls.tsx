import GirlList from "@/components/GirlList";
import { Escort } from "@/server-actions/escort.action";
import { getCachedAgencyEscorts } from "@/server-actions/agency.action";
import { notFound } from "next/navigation";
import React from "react";

interface Prop {
    agencyId: string;
}

const CompanyGirls = async ({ agencyId }: Prop) => {
    if (!agencyId) {
        notFound();
    }

    const result = await getCachedAgencyEscorts(agencyId, 1, 20);

    if (!result.success) {
        console.error("Failed to fetch agency escorts:", result.error);
        return null;
    }

    const escorts = result.data;

    return (
        <section className="">
            <h4 className="text-center mt-12  font-bold text-white text-2xl my-6">
                Girls from our company
            </h4>

            {/* render the employees */}
            <GirlList girls={escorts as Escort[]} />
        </section>
    );
};

export default CompanyGirls;
