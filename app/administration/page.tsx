import SectionCard from "@/components/SectionCard";
import React from "react";
import TextSection from "./TextSection";
import InfoSection from "./InfoSection";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import UserForm from "./UserForm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getEscortByClerkUserId } from "@/server-actions/girl.action";
import { getAgencyByOwnerId } from "@/server-actions/agency.action";
import Link from "next/link";
import Image from "next/image";
import AgencyGirls from "./AgencyGirls";
import {
  getUserActivePackages,
  getUserCredits,
  type ActiveAdPackage,
} from "@/server-actions/payment.action";
import { Button } from "@/components/ui/button";
import { CreditCard, Package } from "lucide-react";
import ActivePackagesSection from "./ActivePackagesSection";
import { PLAN_DETAILS } from "@/lib/constants/packages";
import { formatExpiryDate } from "@/lib/utils";
import { canonicalDashboardUrl, resolveView, type AccountView } from "./view";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: "Update Profile 💖 | kenyadesires.xyz",
  robots: {
    index: false,
    follow: true,
  },
};

interface PageProps {
  searchParams: Promise<{ type?: string | string[] }>;
}

const page = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const requestedView = resolveView(params.type);

  const { userId } = await auth();
  // currentUser() calls the Clerk Backend API on every render; a failed call
  // throws ClerkAPIResponseError ("no message was provided") and took the whole
  // page down with a 500. The role only selects which profile to load, so a
  // failed lookup degrades to "no role" instead of crashing the route.
  const user = await currentUser().catch(() => null);

  const role = user?.unsafeMetadata?.role as string;

  const isBusiness = role === "business";

  // An explicit ?type= wins over the Clerk role. The role is a single value on
  // the account, so a user who is both an agency and a provider had no way to
  // reach the other half of their own dashboard — the param is what makes the
  // two views selectable.
  const view: AccountView =
    requestedView ?? (isBusiness ? "agency" : "provider");

  // Put the resolved view in the address bar, so the URL is always the source of
  // truth for which dashboard is open. Without this the bare /administration
  // depends on a server-side role lookup that no client can see or reproduce:
  // the switcher's "active" tab could not be derived from the URL, a bookmark of
  // the page did not carry the view, and refreshing an inherited value looked
  // arbitrary. Redirecting rather than rendering keeps one canonical URL per
  // view instead of two URLs for the same screen.
  //
  // Fires only when `type` is missing or unrecognised (resolveView returned
  // null), so a canonical URL is left alone and this cannot loop.
  if (!requestedView) {
    redirect(canonicalDashboardUrl(view, params));
  }

  // Load only the profile this view is about. Gating on the role as well used
  // to mean the param could not load its own profile, so the provider tab was
  // empty for a business-role account.
  const agency = view === "agency" && userId ? await getAgencyByOwnerId(userId) : null;
  const escort = view === "provider" && userId ? await getEscortByClerkUserId(userId) : null;

  // Only the profile this view is about is loaded. The other tab stays a plain
  // link: whether a profile of that type exists is answered the moment it is
  // opened, by that view's own empty state. Probing for it here would mean two
  // extra profile queries per render to decorate a tab label, which is not worth
  // it on a route that renders on every dashboard visit.

  let editProfileLink = "/adjustment";
  let buttonText = "Edit profile";

  if (view === "agency") {
    editProfileLink = "/agency-profile";
    buttonText = agency ? "Edit agency" : "Create agency";
  } else if (!escort) {
    editProfileLink = "/adjustment";
    buttonText = "Create profile";
  } else {
    editProfileLink = "/adjustment";
    buttonText = "Edit profile";
  }

  const creditsResult = userId
    ? await getUserCredits()
    : { success: true, credits: 0 };
  const packagesResult = userId
    ? await getUserActivePackages()
    : { success: true, packages: [] };

  const credits = creditsResult.success ? creditsResult.credits : 0;
  // The failure branch of the server action carries `error` and no `packages`,
  // so this union needs a nullish fallback rather than a truthy check alone.
  const activePackages: ActiveAdPackage[] = packagesResult.success
    ? (packagesResult.packages ?? [])
    : [];

  // Kept separate from the list because a failed query and "you have no active
  // package" both produced zero rows, so the panel disappeared silently in both
  // cases. That is how a SQL error in `getUserActivePackages` presented as
  // "the packages stopped rendering" rather than as an error.
  const packagesError = packagesResult.success
    ? null
    : "error" in packagesResult
      ? packagesResult.error
      : "Could not load your packages.";

  const planType = escort?.plan?.type || agency?.plan?.type || "free";
  const plan =
    PLAN_DETAILS[planType as keyof typeof PLAN_DETAILS] || PLAN_DETAILS.free;

  // The card is titled "Current Plan", so it should reflect the boost that is
  // actually running, not just the account tier. `plan` comes from
  // `escorts.plan.type` / `agencies.plan.type`, which a boost purchase does not
  // touch — so a user mid-boost was shown their old tier here while the real
  // package sat unexplained further down the page.
  //
  // A user can hold a boost on an escort profile and an agency profile at once,
  // so pick the one that dominates: the longest-running, then the latest expiry.
  const currentPackage = [...activePackages].sort((a, b) => {
    if (b.durationDays !== a.durationDays)
      return b.durationDays - a.durationDays;
    return b.expiresAt.getTime() - a.expiresAt.getTime();
  })[0];

  const otherPackageCount = activePackages.length - (currentPackage ? 1 : 0);

  return (
    <div className="text-4xl ">
      <SectionCard>
        <TextSection />

        <div className="my-4 space-y-10 mt-8">
          {/* View switcher. The Clerk role is a single value on the account, so
              without this an account that is both an agency and a provider could
              only ever see one of its two dashboards. Each link carries the param
              explicitly rather than relying on the default, so the two states are
              shareable/bookmarkable. */}
          <div
            role="tablist"
            aria-label="Account type"
            className="flex justify-center"
          >
            <div className="inline-flex rounded-lg bg-stone-100 p-1 gap-1">
              {(["provider", "agency"] as const).map((tab) => {
                const active = view === tab;
                return (
                  <Link
                    key={tab}
                    role="tab"
                    aria-selected={active}
                    href={`/administration?type=${tab}`}
                    className={
                      active
                        ? "bg-red-700 text-white font-semibold uppercase px-6 py-2 rounded-md text-sm transition-colors"
                        : "text-gray-700 hover:bg-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
                    }
                  >
                    {tab === "provider" ? "Provider" : "Agency"}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* `items-stretch` rather than `items-center`: with `items-center` each
              card takes its own content height, so once the Current Plan card
              grew a sub-line the Credits card sat visibly shorter beside it.
              Stretch makes both fill the row's tallest height, and each card
              keeps its own `items-center` so the icon stays vertically centred
              in the taller box. It also gives the two cards one shared width on
              mobile instead of each sizing to its own text. */}
          <div className="flex flex-col md:flex-row gap-4 justify-center items-stretch">
            <div className="bg-stone-100 rounded-lg p-4 md:p-6 flex items-center gap-3 shadow-md flex-1  max-w-md">
              <CreditCard className="size-6 md:size-8 text-red-700" />
              <div>
                <p className="text-sm text-gray-600">Your Credits</p>
                <p className="text-2xl md:text-3xl font-bold text-red-700">
                  {credits}
                </p>
              </div>
            </div>
            <div className="bg-stone-100 rounded-lg p-4 md:p-6 flex items-center gap-3 shadow-md flex-1 max-w-md">
              <Package className="size-6 md:size-8 text-red-700" />
              <div>
                <p className="text-sm text-gray-600">Current Plan</p>
                {/* The running ad package when there is one, otherwise the
                    account tier. Both are labelled so the value is never
                    ambiguous. */}
                <p className="text-2xl md:text-3xl font-bold text-red-700 capitalize">
                  {currentPackage ? currentPackage.name : plan.name}
                </p>
                {currentPackage ? (
                  <p className="text-xs text-gray-600">
                    {currentPackage.durationDays}-day package
                    {currentPackage.expiresAt
                      ? ` · expires ${formatExpiryDate(currentPackage.expiresAt)}`
                      : ""}
                    {` · ${currentPackage.daysRemaining} day${currentPackage.daysRemaining === 1 ? "" : "s"} left`}
                    {otherPackageCount > 0
                      ? ` · +${otherPackageCount} more active`
                      : ""}
                  </p>
                ) : (
                  <p className="text-xs text-gray-600">No active ad package</p>
                )}
              </div>
            </div>
          </div>

          <ActivePackagesSection
            packages={activePackages}
            error={packagesError}
          />

          <InfoSection
            title="How to extend your listing?"
            description="If you have enough credits, simply click below at the specific girl: 'EXTEND LISTING BY 30 DAYS'. The system will automatically deduct the credits and extend the membership by another 30 days."
          />

          <InfoSection
            title="How to boost a listing?"
            description="Each girl has a 'BOOST LISTING' button. After clicking this button, choose how many credits per day you want to use to boost the girl and until when the boosting should be active. During this process you can purchase more credits at any time so that the listing appears higher among others if the added credits are not enough for first place. You can find more information in the help"
          />

          <InfoSection
            title="How to top up credits?"
            description={`To purchase credits, simply go to your account settings and select "BUY MORE CREDITS". Then order a credit package and send the corresponding amount with the correct variable symbol (VS). Within one hour of receiving the payment, the system will automatically add the credits to your account. There's no need to contact us; everything is automatic. If the credits do not appear within one hour, please contact us.`}
          />

          <div className=" flex justify-center items-center">
            <Link
              className="bg-primary p-3 px-4 font-semibold text-white uppercase text-lg "
              href={editProfileLink}
            >
              {buttonText}
            </Link>
          </div>

          {/* Provider view has no equivalent of the agency's girls grid — the
              provider *is* the profile — so it gets the profile's own state
              instead. Without this the provider tab rendered credits and plans
              for an account with nothing on it identifying the profile. */}
          {view === "provider" &&
            (escort ? (
              <div className="border-t-2 border-white py-8 my-4">
                <h5 className="text-center text-2xl font-bold mb-6">
                  Your Provider Profile
                </h5>
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                  {escort.previewPhoto && (
                    <Image
                      src={escort.previewPhoto}
                      alt={escort.name || "Your profile"}
                      width={96}
                      height={96}
                      className="size-24 rounded-full object-cover border-2 border-red-700"
                    />
                  )}
                  <div className="text-center sm:text-left">
                    <p className="text-xl font-bold text-gray-800">
                      {escort.name || "Unnamed profile"}
                    </p>
                    <p className="text-sm text-gray-600 capitalize">
                      {escort.isActive === false ? "Inactive" : "Active"}
                      {escort.primaryRegion ? ` · ${escort.primaryRegion}` : ""}
                    </p>
                  </div>
                  <Button asChild variant="secondary">
                    <Link href={`/girl/${escort.slug || escort.id}`}>
                      View public listing
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-t-2 border-white py-8 my-4 text-center text-white/70">
                You have not created a provider profile yet.
              </div>
            ))}
        </div>

        {view === "agency" && agency && <AgencyGirls agencyId={agency.id} />}
        {view === "agency" && !agency && (
          <div className="py-8 text-center text-white/70">
            You have not created an agency yet. Use &quot;Create agency&quot; above
            to set one up.
          </div>
        )}
        <div className="mt-6">
          <UserForm />
        </div>
      </SectionCard>
    </div>
  );
};

export default page;
