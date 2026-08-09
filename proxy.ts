import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  ignoredRoutes: ["/api/mpesa/callback"],
});

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
