"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import SearchSheet from "./SearchSheet";
import { BadgeCheck } from "lucide-react";

interface Prop {
  isEscort?: boolean;
  escortIsVerified?: boolean;
  escortVerificationStatus?: string;
  agencyIsVerified?: boolean;
  agencyVerificationStatus?: string;
}

const NavActions = ({
  isEscort,
  escortIsVerified,
  escortVerificationStatus,
  agencyIsVerified,
  agencyVerificationStatus,
}: Prop) => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [credits, setCredits] = useState<number>(0);
  const [creditsLoading, setCreditsLoading] = useState(true);

  const handleLogout = async () => {
    await signOut();
    router.refresh();
  };

  const isBusiness = (user?.unsafeMetadata?.role as string) === "business";

  useEffect(() => {
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
    fetchCredits();
  }, []);

  return (
    <div className="flex items-center gap-4">
      <SearchSheet></SearchSheet>

      <DropdownMenu>
        <DropdownMenuTrigger className="bg-primary group text-white rounded-md flex items-center gap-2 p-3 px-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-4"
          >
            <path
              fillRule="evenodd"
              d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
              clipRule="evenodd"
            />
          </svg>

          <span className="text-base group-hover:font-bold uppercase font-semibold">
            account settings
          </span>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-6"
          >
            <path
              fillRule="evenodd"
              d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z"
              clipRule="evenodd"
            />
          </svg>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full max-w-64 space-y-2">
          {/* <DropdownM>My Account</DropdownM enuLabel> */}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-stone-700 group">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6 text-stone-400"
            >
              <path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
              <path
                fill-rule="evenodd"
                d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z"
                clip-rule="evenodd"
              />
              <path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
            </svg>

            <span className="uppercase font-normal text-base group-hover:font-bold">
              Number of Credits :{" "}
              {creditsLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                credits
              )}
            </span>
          </DropdownMenuItem>

          <DropdownMenuItem className="text-stone-800 group">
            <Link href="frequent-questions" className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={384}
                height={512}
                viewBox="0 0 384 512"
                className="text-stone-400 size-6"
              >
                <path
                  fill="currentColor"
                  d="M272 384c9.6-31.9 29.5-59.1 49.2-86.2c5.2-7.1 10.4-14.2 15.4-21.4c19.8-28.5 31.4-63 31.4-100.3C368 78.8 289.2 0 192 0S16 78.8 16 176c0 37.3 11.6 71.9 31.4 100.3c5 7.2 10.2 14.3 15.4 21.4c19.8 27.1 39.7 54.4 49.2 86.2h160zm-80 128c44.2 0 80-35.8 80-80v-16H112v16c0 44.2 35.8 80 80 80m-80-336c0 8.8-7.2 16-16 16s-16-7.2-16-16c0-61.9 50.1-112 112-112c8.8 0 16 7.2 16 16s-7.2 16-16 16c-44.2 0-80 35.8-80 80"
                  strokeWidth={13}
                  stroke="currentColor"
                ></path>
              </svg>
              <span className="uppercase font-normal text-base group-hover:font-bold">
                advice - frequently asked questions
              </span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem className="text-stone-800 group">
            <Link href="extend" className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={576}
                height={512}
                viewBox="0 0 576 512"
                className="text-stone-400 size-6 shrink-0"
              >
                <path
                  fill="currentColor"
                  d="M313 87.2c9.2-7.3 15-18.6 15-31.2c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 12.6 5.9 23.9 15 31.2l-68.4 107.6c-10 15.7-31.3 19.6-46.2 8.4l-59.5-44.5c4.5-6.4 7.1-14.3 7.1-22.7c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 21.8 17.5 39.6 39.2 40l32.6 217.5c4.7 31.3 31.6 54.5 63.3 54.5h273.8c31.7 0 58.6-23.2 63.3-54.5L520.8 176c21.7-.4 39.2-18.2 39.2-40c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 8.4 2.6 16.3 7.1 22.7l-59.4 44.6c-14.9 11.2-36.2 7.3-46.2-8.4z"
                  strokeWidth={13}
                  stroke="currentColor"
                ></path>
              </svg>
              <span className="uppercase font-normal text-base group-hover:font-bold ">
                buy credits - for advertising and topping
              </span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem className="text-stone-800 group">
            <Link
              href={isBusiness ? "/agency-profile" : "adjustment"}
              className="flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={30}
                height={30}
                viewBox="0 0 24 24"
                className="text-stone-400 size-6"
              >
                <path
                  fill="currentColor"
                  d="M14.678 3.272a3.483 3.483 0 0 1 4.928-.001l1.127 1.127a3.483 3.483 0 0 1 0 4.925L9.33 20.729a3.48 3.48 0 0 1-2.463 1.021H3a.75.75 0 0 1-.75-.75v-3.844a3.48 3.48 0 0 1 1.019-2.461zm3.867 1.06a1.983 1.983 0 0 0-2.806 0l-.896.897l3.931 3.931l.898-.898a1.983 1.983 0 0 0 0-2.804z"
                  strokeWidth={0.5}
                  stroke="currentColor"
                ></path>
              </svg>
              <span className="uppercase font-normal text-base group-hover:font-bold">
                {isBusiness ? "edit agency profile" : "edit profile"}
              </span>
            </Link>
          </DropdownMenuItem>

          {/* Escort KYC verification link or status */}
          {isEscort && !isBusiness && (
            <DropdownMenuItem className="text-stone-800 group">
              {escortIsVerified ? (
                <span className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-6 text-stone-400"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 10-9.75s10 4.365 10 9.75s-4.365 9.75-10 9.75S2.25 17.385 2.25 12zm13.5 4.5l8.25-8.25a.75.75 0 0 0-1.06-1.06L12.75 14.44l-3.69-3.69a.75.75 0 0 0-1.06 0L6.75 12.75V15a.75.75 0 0 0 .75.75h3v-3a2.25 2.25 0 0 1 2.25-2.25h.75a.75.75 0 0 1 .75.75v3h3a.75.75 0 0 0 .75-.75v-2.25z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="uppercase font-normal text-base group-hover:font-bold text-green-400">
                    Verified — {escortVerificationStatus}
                  </span>
                </span>
              ) : (
                <Link href="/verify-girl" className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-9 text-orange-500"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                      clip-rule="evenodd"
                    />
                  </svg>

                  <span className="uppercase font-semibold text-base group-hover:font-bold text-primary">
                    Verify identity
                  </span>
                </Link>
              )}
            </DropdownMenuItem>
          )}

          {/* Agency verification: verify identity or view status */}
          {isBusiness && (
            <DropdownMenuItem className="text-stone-800 group">
              {agencyIsVerified ? (
                <Link href="/agency-verification-status" className="flex items-center gap-2">
                  <BadgeCheck className="size-6 text-green-400" />
                  <span className="uppercase font-normal text-base group-hover:font-bold">
                    View verification status
                  </span>
                </Link>
              ) : (
                <Link href="/verify-agency" className="flex items-center gap-2">
                  <BadgeCheck className="size-5 text-orange-500" />
                  <span className="uppercase font-semibold text-base group-hover:font-bold text-primary">
                    Verify Agency Identity
                  </span>
                </Link>
              )}
            </DropdownMenuItem>
          )}

          {isBusiness && (
            <DropdownMenuItem className="text-stone-800 group">
              <Link href="/add-girl" className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={30}
                  height={30}
                  viewBox="0 0 24 24"
                  className="text-stone-400 size-6"
                >
                  <path
                    fill="currentColor"
                    d="M17 13h-4v4h-2v-4H7v-2h4V7h2v4h4m-5-9A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2"
                    strokeWidth={0.5}
                    stroke="currentColor"
                  ></path>
                </svg>
                <span className="uppercase font-normal text-base group-hover:font-bold">
                  add girl
                </span>
              </Link>
            </DropdownMenuItem>
          )}

          {isBusiness && (
            <DropdownMenuItem className="text-stone-800 group">
              <Link href="/administration" className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-6 text-stone-400"
                >
                  <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
                </svg>

                <span className="uppercase font-normal text-base group-hover:font-bold">
                  View Agency Girls
                </span>
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem className="text-stone-800 group">
            <Link href="invoices" className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6 text-stone-400"
              >
                <path
                  fill-rule="evenodd"
                  d="M3.75 3.375c0-1.036.84-1.875 1.875-1.875H9a3.75 3.75 0 0 1 3.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 0 1 3.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V3.375Zm10.5 1.875a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 16.5 7.5h-1.875a.375.375 0 0 1-.375-.375V5.25Zm-3.75 5.56c0-1.336-1.616-2.005-2.56-1.06l-.22.22a.75.75 0 0 0 1.06 1.06l.22-.22v1.94h-.75a.75.75 0 0 0 0 1.5H9v3c0 .671.307 1.453 1.068 1.815a4.5 4.5 0 0 0 5.993-2.123c.233-.487.14-1-.136-1.37A1.459 1.459 0 0 0 14.757 15h-.507a.75.75 0 0 0 0 1.5h.349a2.999 2.999 0 0 1-3.887 1.21c-.091-.043-.212-.186-.212-.46v-3h5.25a.75.75 0 1 0 0-1.5H10.5v-1.94Z"
                  clip-rule="evenodd"
                />
              </svg>

              <span className="uppercase font-normal text-base group-hover:font-bold">
                invoices to download
              </span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleLogout}
            className="text-stone-800 group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={30}
                height={30}
                viewBox="0 0 24 24"
                className="text-stone-400 size-6"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M7.023 5.5a9 9 0 1 0 9.953 0M12 2v8"
                ></path>
              </svg>
              <span className="uppercase font-normal text-base group-hover:font-bold">
                check out
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default NavActions;
