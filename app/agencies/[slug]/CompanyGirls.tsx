import GirlList from "@/components/GirlList";
import {Escort} from "@/server-actions/escort.action";
import {notFound} from "next/navigation";
import React from "react";

interface Prop {
    agencyId: string;
}

// Function to fetch agency escorts
async function getAgencyEscorts(agencyId: any, page = 1, limit = 20) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

    // Fallback for development
    const apiUrl =
        baseUrl ||
        (process.env.NODE_ENV === "development" ? "http://localhost:4000" : "");

    if (!apiUrl) {
        console.error("API_URL is not defined");
        throw new Error("API_URL environment variable is not configured");
    }

    // Construct URL with query parameters
    const url = `${apiUrl}/api/agencies/${agencyId}/escorts?page=${page}&limit=${limit}`;
    console.log("Fetching escorts from:", url);

    try {
        const response = await fetch(url, {
            next: {
                revalidate: 60, // Revalidate every 60 seconds
            },
        });

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            throw new Error(`Failed to fetch: ${response.status}`);
        }

        const result = await response.json();
        console.log("API Response success:", result.success);

        if (!result.success) {
            throw new Error(result.message || "Failed to fetch escorts");
        }

        return result.data;
    } catch (error) {
        console.error("Error fetching agency escorts:", error);
        throw error;
    }
}

const CompanyGirls = async ({agencyId}: Prop) => {
    if (!agencyId) {
        notFound();
    }

    const {agency, escorts, total} = await getAgencyEscorts(agencyId, 1, 20);

    console.log("Fetched Agency Escorts:", escorts);

    return (
        <section className="">
            <h4 className="text-center mt-12  font-bold text-white text-2xl my-6">
                Girls from our company
            </h4>

            {/* render the employees */}
            <GirlList girls={escorts as Escort[]}/>
        </section>
    );
};

export default CompanyGirls;
