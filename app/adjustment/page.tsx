import React from "react";

import NewEscortForm from "@/app/new-profile/NewEscortForm";
import { auth } from "@clerk/nextjs/server";
import { getEscortByClerkUserId } from "@/server-actions/girl.action";

const page = async () => {
  const { userId } = await auth();
  const escort = userId ? await getEscortByClerkUserId(userId) : null;

  return (
    <div>
      {escort ? (
        <NewEscortForm mode="edit" initialData={escort} />
      ) : (
        <div>No escort profile found</div>
      )}
    </div>
  );
};

export default page;
