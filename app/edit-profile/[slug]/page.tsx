import {Metadata} from "next";
import React from "react";
import EditEscortForm from "../EditProfileForm";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
    title: "Update Profile 💖 | EscortKE.com",
    robots: {
      index: false,
      follow: true,
    },
  };
const page = async () => {
    // const escort = await getCurrentEscort();
    const escort: any = null
    console.log("escort profile", escort);
    if (!escort) {
        return (
            <div className="flex flex-1 items-center justify-center text-primary">
                No escort profile found
            </div>
        );
    }
    return (
        <div>
            <EditEscortForm initialData={escort}/>
        </div>
    );
};

export default page;
