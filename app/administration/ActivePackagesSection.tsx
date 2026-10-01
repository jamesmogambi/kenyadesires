import React from "react";
import { Check } from "lucide-react";
import { formatExpiryDate } from "@/lib/utils";
import type { ActiveAdPackage } from "@/server-actions/payment.action";

interface ActivePackagesSectionProps {
  packages: ActiveAdPackage[];
  /** Set when the query failed, so "could not load" is not shown as "no packages". */
  error?: string | null;
}

/**
 * Minimal list of the ad packages currently running.
 *
 * Deliberately terse — name, expiry and status only. The "Current Plan" card
 * above already carries the duration, days remaining and start date, and this
 * panel previously repeated all of it, so every fact was stated twice on the
 * same screen.
 *
 * The error and empty states are kept distinct on purpose: an earlier version
 * rendered nothing for both, which made a failing SQL query look exactly like
 * having no packages.
 */
const ActivePackagesSection = ({
  packages,
  error = null,
}: ActivePackagesSectionProps) => {
  if (packages.length === 0 && !error) return null;

  return (
    <div className="bg-stone-100 rounded-lg p-4 md:p-6 shadow-md">
      <h4 className="text-xl font-bold text-red-700 mb-4">Active Ad Packages</h4>

      {error ? (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
          Could not load your ad packages right now. Please refresh in a moment.
        </p>
      ) : (
        <ul className="space-y-2">
          {packages.map((pkg) => {
            const expiresLabel = formatExpiryDate(pkg.expiresAt);

            return (
              <li
                key={pkg.id}
                className="flex items-center justify-between gap-4 bg-white p-3 rounded-md"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {pkg.name || pkg.packageId}
                  </p>
                  {/* Guarded so a malformed date degrades to readable text
                      instead of "Invalid Date". */}
                  <p className="text-sm text-gray-600">
                    {expiresLabel ? `Expires ${expiresLabel}` : "Expiry unavailable"}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-green-600 shrink-0">
                  <Check className="size-4" />
                  <span className="font-semibold">Active</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ActivePackagesSection;
