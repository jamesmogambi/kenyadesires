import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  if (request.nextUrl.pathname === "/api/mpesa/callback") {
    return NextResponse.next();
  }

  const protectedRoutes = [
    "/extend",
    "/invoices",
    "/payment-status",
    "/adjustment",
    "/add-girl",
    "/admin",
    "/administration",
    "/agency-admin-profile",
    "/agency-documents-verification",
    "/agency-profile",
    "/edit-girl",
    "/edit-profile",
    "/girl-documents-verification",
    "/new-profile",
    "/private-apartment-girl-listing",
    "/verify",
    "/verification",
    "/verify-girl",
    "/verify-agency",
    "/verify/done",
    "/agency-verification-status",
  ];

  const isProtected = protectedRoutes.some((route) => {
    const pathname = request.nextUrl.pathname;
    return pathname === route || pathname.startsWith(route + "/");
  });

  if (isProtected && !userId) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
