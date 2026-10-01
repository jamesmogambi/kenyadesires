// components/MobileHeader.tsx
"use client";

import Link from "next/link";
import React, {
  memo,
  useCallback,
  useState,
  lazy,
  Suspense,
  useEffect,
} from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MobileNavMenu from "./MobileNavMenu";
import Logo from "./Logo";
import { useUser, useAuth } from "@clerk/nextjs";
import LoginFormSheet from "@/app/(auth)/LoginFormSheet";
import { cn } from "@/lib/utils";
import { getUserActivePackages } from "@/server-actions/payment.action";
import { BadgeCheck } from "lucide-react";

// ✅ Lazy load heavy components
const SearchSheet = lazy(() => import("./SearchSheet"));

// ✅ SVG Icons as memoized components (zero re-renders)
const MenuIcon = memo(() => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={35}
    height={35}
    viewBox="0 0 16 16"
    className="text-white flex-shrink-0"
  >
    <path
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="m2.75 12.25h10.5m-10.5-4h10.5m-10.5-4h10.5"
    />
  </svg>
));
MenuIcon.displayName = "MenuIcon";

const UserIcon = memo(() => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="size-4 flex-shrink-0"
  >
    <path
      fillRule="evenodd"
      d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z"
      clipRule="evenodd"
    />
  </svg>
));
UserIcon.displayName = "UserIcon";

const ChevronDownIcon = memo(() => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="size-4 flex-shrink-0"
  >
    <path
      fillRule="evenodd"
      d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z"
      clipRule="evenodd"
    />
  </svg>
));
ChevronDownIcon.displayName = "ChevronDownIcon";

// ✅ Credits display with live fetching
const CreditsItem = memo(({ onClose }: { onClose: () => void }) => {
  const [credits, setCredits] = useState<number>(0);
  const [creditsLoading, setCreditsLoading] = useState(true);

  async function fetchCredits() {
    try {
      const res = await fetch("/api/credits");
      if (!res.ok) {
        setCredits(0);
        return;
      }
      const data = await res.json();
      setCredits(data.credits ?? 0);
    } catch {
      setCredits(0);
    } finally {
      setCreditsLoading(false);
    }
  }

  useEffect(() => {
    fetchCredits();
    const handler = () => {
      fetchCredits();
    };
    window.addEventListener("credits-updated", handler);
    return () => window.removeEventListener("credits-updated", handler);
  }, []);

  return (
    <DropdownMenuItem
      className="text-stone-700 group cursor-pointer"
      onClick={onClose}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={384}
        height={512}
        viewBox="0 0 384 512"
        className="text-stone-400 flex-shrink-0"
      >
        <path
          fill="currentColor"
          d="M272 384c9.6-31.9 29.5-59.1 49.2-86.2c5.2-7.1 10.4-14.2 15.4-21.4c19.8-28.5 31.4-63 31.4-100.3C368 78.8 289.2 0 192 0S16 78.8 16 176c0 37.3 11.6 71.9 31.4 100.3c5 7.2 10.2 14.3 15.4 21.4c19.8 27.1 39.6 39.2 40l32.6 217.5c4.7 31.3 31.6 54.5 63.3 54.5h273.8c31.7 0 58.6-23.2 63.3-54.5L520.8 176c21.7-.4 39.2-18.2 39.2-40c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 8.4 2.6 16.3 7.1 22.7l-59.4 44.6c-14.9 11.2-36.2 7.3-46.2-8.4z"
          strokeWidth={13}
          stroke="currentColor"
        />
      </svg>
      <span className="uppercase text-base group-hover:font-bold ml-2">
        Number of Credits :{" "}
        {creditsLoading ? (
          <span className="animate-pulse">...</span>
        ) : (
          `${credits} (KSH ${(credits * 10).toLocaleString()})`
        )}
      </span>
    </DropdownMenuItem>
  );
});
CreditsItem.displayName = "CreditsItem";

const PackagesItem = memo(({ onClose }: { onClose: () => void }) => {
  const [packages, setPackages] = useState<any[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);

  async function fetchPackages() {
    try {
      const result = await getUserActivePackages();
      if (result.success) {
        setPackages(result.packages || []);
      }
    } catch {
      // keep previous packages on transient error
    } finally {
      setPackagesLoading(false);
    }
  }

  useEffect(() => {
    fetchPackages();
    const handler = () => {
      fetchPackages();
    };
    window.addEventListener("packages-updated", handler);
    return () => window.removeEventListener("packages-updated", handler);
  }, []);

  if (packagesLoading) {
    return (
      <DropdownMenuItem className="text-stone-700 group cursor-pointer">
        <span className="uppercase text-base group-hover:font-bold ml-2">
          Packages: <span className="animate-pulse">...</span>
        </span>
      </DropdownMenuItem>
    );
  }

  if (packages.length === 0) {
    return null;
  }

  return (
    <DropdownMenuItem
      className="text-stone-700 group cursor-pointer"
      onClick={onClose}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="text-stone-400 flex-shrink-0 size-6"
      >
        <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h21V6.375C22.5 5.34 21.661 4.5 20.625 4.5H3.375ZM1.5 15.75v4.875c0 .621.504 1.125 1.125 1.125h20.25c.621 0 1.125-.504 1.125-1.125V15.75H1.5Z" />
      </svg>
      <span className="uppercase text-base group-hover:font-bold ml-2">
        Packages:{" "}
        <span className="font-bold text-red-700">
          {packages.map((pkg) => pkg.name).join(", ")}
        </span>
      </span>
    </DropdownMenuItem>
  );
});
PackagesItem.displayName = "PackagesItem";

// ✅ Memoized menu items with onClose
const AdviceItem = memo(({ onClose }: { onClose: () => void }) => (
  <DropdownMenuItem className="text-stone-800 group cursor-pointer">
    <Link
      href="frequent-questions"
      className="flex items-center gap-2 w-full"
      onClick={onClose}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={384}
        height={512}
        viewBox="0 0 384 512"
        className="text-stone-400 flex-shrink-0"
      >
        <path
          fill="currentColor"
          d="M272 384c9.6-31.9 29.5-59.1 49.2-86.2c5.2-7.1 10.4-14.2 15.4-21.4c19.8-28.5 31.4-63 31.4-100.3C368 78.8 289.2 0 192 0S16 78.8 16 176c0 37.3 11.6 71.9 31.4 100.3c5 7.2 10.2 14.3 15.4 21.4c19.8 27.1 39.6 39.2 40l32.6 217.5c4.7 31.3 31.6 54.5 63.3 54.5h273.8c31.7 0 58.6-23.2 63.3-54.5L520.8 176c21.7-.4 39.2-18.2 39.2-40c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 8.4 2.6 16.3 7.1 22.7l-59.4 44.6c-14.9 11.2-36.2 7.3-46.2-8.4z"
          strokeWidth={13}
          stroke="currentColor"
        />
      </svg>
      <span className="uppercase text-base group-hover:font-bold">
        advice - frequently asked questions
      </span>
    </Link>
  </DropdownMenuItem>
));
AdviceItem.displayName = "AdviceItem";

const BuyCreditsItem = memo(({ onClose }: { onClose: () => void }) => (
  <DropdownMenuItem className="text-stone-800 group cursor-pointer">
    <Link
      href="extend"
      className="flex items-center gap-2 w-full"
      onClick={onClose}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={576}
        height={512}
        viewBox="0 0 576 512"
        className="text-stone-400 flex-shrink-0"
      >
        <path
          fill="currentColor"
          d="M313 87.2c9.2-7.3 15-18.6 15-31.2c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 12.6 5.9 23.9 15 31.2l-68.4 107.6c-10 15.7-31.3 19.6-46.2 8.4l-59.5-44.5c4.5-6.4 7.1-14.3 7.1-22.7c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 21.8 17.5 39.6 39.2 40l32.6 217.5c4.7 31.3 31.6 54.5 63.3 54.5h273.8c31.7 0 58.6-23.2 63.3-54.5L520.8 176c21.7-.4 39.2-18.2 39.2-40c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 8.4 2.6 16.3 7.1 22.7l-59.4 44.6c-14.9 11.2-36.2 7.3-46.2-8.4z"
          strokeWidth={13}
          stroke="currentColor"
        />
      </svg>
      <span className="uppercase text-base group-hover:font-bold">
        buy credits - for advertising and topping
      </span>
    </Link>
  </DropdownMenuItem>
));
BuyCreditsItem.displayName = "BuyCreditsItem";

const EditProfileItem = memo(
  ({ onClose, label }: { onClose: () => void; label: string }) => (
    <DropdownMenuItem className="text-stone-800 group cursor-pointer">
      <Link
        href="adjustment"
        className="flex items-center gap-2 w-full"
        onClick={onClose}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={30}
          height={30}
          viewBox="0 0 24 24"
          className="text-stone-400 flex-shrink-0"
        >
          <path
            fill="currentColor"
            d="M14.678 3.272a3.483 3.483 0 0 1 4.928-.001l1.127 1.127a3.483 3.483 0 0 1 0 4.925L9.33 20.729a3.48 3.48 0 0 1-2.463 1.021H3a.75.75 0 0 1-.75-.75v-3.844a3.48 3.48 0 0 1 1.019-2.461zm3.867 1.06a1.983 1.983 0 0 0-2.806 0l-.896.897l3.931 3.931l.898-.898a1.983 1.983 0 0 0 0-2.804z"
            strokeWidth={0.5}
            stroke="currentColor"
          />
        </svg>
        <span className="uppercase text-base group-hover:font-bold">
          {label}
        </span>
      </Link>
    </DropdownMenuItem>
  ),
);
EditProfileItem.displayName = "EditProfileItem";

const AddGirlItem = memo(({ onClose }: { onClose: () => void }) => (
  <DropdownMenuItem className="text-stone-800 group cursor-pointer">
    <Link
      href="add-girl"
      className="flex items-center gap-2 w-full"
      onClick={onClose}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={30}
        height={30}
        viewBox="0 0 24 24"
        className="text-stone-400 flex-shrink-0"
      >
        <path
          fill="currentColor"
          d="M17 13h-4v4h-2v-4H7v-2h4V7h2v4h4m-5-9A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2"
          strokeWidth={0.5}
          stroke="currentColor"
        />
      </svg>
      <span className="uppercase text-base group-hover:font-bold">
        add girl
      </span>
    </Link>
  </DropdownMenuItem>
));
AddGirlItem.displayName = "AddGirlItem";

const ViewAgencyGirlsItem = memo(({ onClose }: { onClose: () => void }) => (
  <DropdownMenuItem className="text-stone-800 group cursor-pointer">
    <Link
      href="administration"
      className="flex items-center gap-2 w-full"
      onClick={onClose}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={30}
        height={30}
        viewBox="0 0 24 24"
        className="text-stone-400 flex-shrink-0"
      >
        <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
      </svg>
      <span className="uppercase text-base group-hover:font-bold">
        View Agency Girls
      </span>
    </Link>
  </DropdownMenuItem>
));
ViewAgencyGirlsItem.displayName = "ViewAgencyGirlsItem";

const InvoicesItem = memo(({ onClose }: { onClose: () => void }) => (
  <DropdownMenuItem className="text-stone-800 group cursor-pointer">
    <Link
      href="invoices"
      className="flex items-center gap-2 w-full"
      onClick={onClose}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={30}
        height={30}
        viewBox="0 0 24 24"
        className="text-stone-400 flex-shrink-0"
      >
        <path
          fill="currentColor"
          d="M14.678 3.272a3.483 3.483 0 0 1 4.928-.001l1.127 1.127a3.483 3.483 0 0 1 0 4.925L9.33 20.729a3.48 3.48 0 0 1-2.463 1.021H3a.75.75 0 0 1-.75-.75v-3.844a3.48 3.48 0 0 1 1.019-2.461zm3.867 1.06a1.983 1.983 0 0 0-2.806 0l-.896.897l3.931 3.931l.898-.898a1.983 1.983 0 0 0 0-2.804z"
          strokeWidth={0.5}
          stroke="currentColor"
        />
      </svg>
      <span className="uppercase text-base group-hover:font-bold">
        invoices to download
      </span>
    </Link>
  </DropdownMenuItem>
));
InvoicesItem.displayName = "InvoicesItem";

const SignOutItem = memo(({ onSignOut }: { onSignOut: () => void }) => (
  <DropdownMenuItem className="text-stone-800 group cursor-pointer">
    <button className="flex items-center gap-2 w-full" onClick={onSignOut}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={30}
        height={30}
        viewBox="0 0 24 24"
        className="text-stone-400 flex-shrink-0"
      >
        <path
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
          d="M7.023 5.5a9 9 0 1 0 9.953 0M12 2v8"
        />
      </svg>
      <span className="uppercase text-base group-hover:font-bold">
        check out
      </span>
    </button>
  </DropdownMenuItem>
));
SignOutItem.displayName = "SignOutItem";

interface Prop {
  className?: string;
  isEscort?: boolean;
  escortIsVerified?: boolean;
  escortVerificationStatus?: string;
  agencyIsVerified?: boolean;
  agencyVerificationStatus?: string;
}

const MobileHeader = memo(
  ({
    className,
    isEscort,
    escortIsVerified,
    escortVerificationStatus,
    agencyIsVerified,
    agencyVerificationStatus,
  }: Prop) => {
    const [open, setOpen] = useState<boolean>(false);
    const { isLoaded: userLoaded, isSignedIn, user } = useUser();
    const { signOut } = useAuth();

    const onClose = useCallback(() => {
      setOpen(false);
    }, []);

    const isBusiness = (user?.unsafeMetadata?.role as string) === "business";
    const isEscortUser = isEscort && !isBusiness;

    const getEscortVerificationLink = () => {
      if (escortIsVerified) {
        return {
          href: "#",
          label: `Verified — ${escortVerificationStatus || "verified"}`,
          textColor: "text-green-400",
          isStatus: true,
        };
      }

      const submittedStatuses = ["pending", "under_review", "rejected"];
      if (submittedStatuses.includes(escortVerificationStatus || "")) {
        return {
          href: "/verify/done",
          label:
            escortVerificationStatus === "rejected"
              ? "Re-submit verification"
              : "Check verification status",
          textColor: "text-orange-400",
          isStatus: false,
        };
      }

      return {
        href: "/verify-girl",
        label: "Verify identity",
        textColor: "text-primary",
        isStatus: false,
      };
    };

    const escortVerification = getEscortVerificationLink();

    const verificationInitiated =
      agencyVerificationStatus === "under_review" ||
      agencyVerificationStatus === "rejected";

    // ✅ Show loading state instead of null
    if (!userLoaded) {
      return (
        <div
          className={cn(
            "flex bg-dark-slate lg:hidden items-center w-full justify-between p-4 py-6",
            className,
          )}
        >
          <Logo />
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse flex-shrink-0" />
            <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse flex-shrink-0" />
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn(
          "flex bg-dark-slate lg:hidden items-center w-full justify-between p-4 py-6",
          className,
        )}
      >
        <Logo />

        <div className="flex items-center gap-4">
          {/* ✅ Lazy loaded with Suspense for code splitting */}
          <Suspense
            fallback={
              <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse flex-shrink-0" />
            }
          >
            <SearchSheet />
          </Suspense>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="text-white hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded p-1"
                aria-label="Open menu"
              >
                <MenuIcon />
              </button>
            </SheetTrigger>
            <SheetContent className="text-white border-none pl-2.5 bg-dark-slate">
              <SheetHeader className="mt-8">
                {!isSignedIn ? (
                  <div className="w-full flex mt-6 justify-between items-center">
                    <LoginFormSheet>
                      <span className="text-white font-medium p-4 px-6 rounded-lg hover:text-primary bg-[#343434] cursor-pointer transition-colors">
                        log in
                      </span>
                    </LoginFormSheet>

                    <Link
                      className="text-white p-4 px-4 font-medium rounded-lg bg-primary hover:bg-primary/80 transition-colors"
                      href="/private-escort-record"
                      onClick={onClose}
                    >
                      register escort
                    </Link>
                  </div>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="bg-primary mt-6 w-auto group text-white rounded-md flex items-center gap-2 p-3 px-2 hover:bg-primary/80 transition-colors">
                      <UserIcon />
                      <span className="text-sm text-nowrap group-hover:font-bold uppercase font-medium">
                        account settings
                      </span>
                      <ChevronDownIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full max-w-[250px] space-y-2">
                      <DropdownMenuSeparator />
                      <PackagesItem onClose={onClose} />
                      <CreditsItem onClose={onClose} />
                      <AdviceItem onClose={onClose} />
                      <BuyCreditsItem onClose={onClose} />
                      <EditProfileItem
                        onClose={onClose}
                        label={
                          isBusiness ? "edit agency profile" : "edit profile"
                        }
                      />
                      {isEscortUser &&
                        (escortVerification?.isStatus ? (
                          <DropdownMenuItem className="text-stone-700 group cursor-pointer">
                            <span className="flex items-center gap-2">
                              <BadgeCheck
                                className={`size-5 ${escortVerification.textColor}`}
                              />
                              <span
                                className={`uppercase text-base group-hover:font-bold ${escortVerification.textColor}`}
                              >
                                {escortVerification.label}
                              </span>
                            </span>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-stone-800 group cursor-pointer">
                            <Link
                              href={escortVerification?.href || "/verify-girl"}
                              className="flex items-center gap-2 w-full"
                              onClick={onClose}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="text-stone-400 flex-shrink-0 size-6"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="uppercase text-base group-hover:font-bold">
                                {escortVerification?.label || "Verify identity"}
                              </span>
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      {isBusiness && agencyIsVerified && (
                        <DropdownMenuItem className="text-stone-800 group cursor-pointer">
                          <Link
                            href="/agency-verification-status"
                            className="flex items-center gap-2 w-full"
                            onClick={onClose}
                          >
                            <BadgeCheck className="size-5 text-green-400" />
                            <span className="uppercase text-base group-hover:font-bold">
                              View verification status
                            </span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {isBusiness && verificationInitiated && (
                        <DropdownMenuItem className="text-stone-800 group cursor-pointer">
                          <Link
                            href="/agency-verification-status"
                            className="flex items-center gap-2 w-full"
                            onClick={onClose}
                          >
                            <BadgeCheck className="size-5 text-orange-400" />
                            <span className="uppercase text-base group-hover:font-bold">
                              Check verification status
                            </span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {isBusiness &&
                        !agencyIsVerified &&
                        !verificationInitiated && (
                          <DropdownMenuItem className="text-stone-800 group cursor-pointer">
                            <Link
                              href="/verify-agency"
                              className="flex items-center gap-2 w-full"
                              onClick={onClose}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="text-stone-400 flex-shrink-0 size-6"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="uppercase text-base group-hover:font-bold text-primary">
                                Verify Agency Identity
                              </span>
                            </Link>
                          </DropdownMenuItem>
                        )}
                      {isBusiness && <AddGirlItem onClose={onClose} />}
                      {isBusiness && <ViewAgencyGirlsItem onClose={onClose} />}
                      <InvoicesItem onClose={onClose} />
                      <SignOutItem onSignOut={signOut} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </SheetHeader>

              <MobileNavMenu onClose={onClose} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    );
  },
);

MobileHeader.displayName = "MobileHeader";

export default MobileHeader;
