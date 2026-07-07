// middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)", // exclude static files
    "/", // root
    "/(api|trpc)(.*)", // API routes
  ],
};
