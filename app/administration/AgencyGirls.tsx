import React from "react";
import { getCachedAgencyEscorts } from "@/server-actions/agency.action";
import GirlItem from "@/components/GirlItem";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { Escort } from "@/server-actions/escort.action";

interface AgencyGirlsProps {
  agencyId: string;
}

const AgencyGirls = async ({ agencyId }: AgencyGirlsProps) => {
  const result = await getCachedAgencyEscorts(agencyId, 1, 50);
  const escorts = result.success ? result.data : [];

  if (!escorts.length) {
    return (
      <div className="text-white/60 text-center py-8">
        No girls added yet. Use &quot;Add Girl&quot; to create your first
        profile.
      </div>
    );
  }

  return (
    <div className="border-t-2 py-8 my-4 mt-8 border-white ">
      <h5 className="text-center text-2xl font-bold mb-8">Agency Girls</h5>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {escorts.map((girl: Escort) => (
          <div key={girl.id} className="relative group">
            <GirlItem girl={girl} />

            <Link
              href={`/edit-girl/${girl.id}`}
              className="absolute top-2 right-2 z-20 bg-green-400 hover:bg-green-400 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Edit girl"
            >
              <Pencil className="size-4" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgencyGirls;
