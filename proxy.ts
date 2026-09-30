import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  '/',
  '/girls',
  '/girls/(.*)',
  '/girl/(.*)',
  '/agencies',
  '/agencies/(.*)',
  '/blog',
  '/blog/(.*)',
  '/erotic-massages',
  '/bdsm',
  '/search',
  '/contact',
  '/privacy-policy',
  '/terms',
  '/withdrawal-contract',
  '/frequent-questions',
  // AEO: the About page carries the entity definition. It must be
  // publicly readable, otherwise every AI crawler gets a redirect to the
  // Clerk sign-in page and none of the structured data is retrievable.
  '/about',
  '/llms.txt',
  '/private-escort-record',
  '/private-escort-record/(.*)',
  '/register-escort',
  '/register-escort/(.*)',
  '/register-business',
  '/register-business/(.*)',
  '/verify-email',
  '/verify-email/(.*)',
  '/verify-password-reset-email',
  '/verify-password-reset-email/(.*)',
  '/api/webhooks/(.*)',
   '/api/mpesa/callback',
   '/api/pesapal/ipn',
   '/api/pesapal/ipn/(.*)',
   '/api/pesapal/callback',
   '/api/pesapal/callback/(.*)',
   '/api/pesapal/register-ipn',
   '/api/pesapal/initiate',
   '/api/mux/(.*)',
  '/api/cron/(.*)',
  '/api/sitemap-status',
  '/api/version',
  '/_next/(.*)',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/icon',
  '/spaceship-test',
  '/action',
   '/payment-status',
   '/payment/callback',
   '/payment/callback/(.*)',
   '/payment/success',
   '/payment/success/(.*)',
   '/payment/failed',
   '/payment/failed/(.*)',
   '/api/admin/images/migrate',
  '/api/admin/images/status',
  '/api/admin/images/migrate/(.*)',
  '/api/agencies/(.*)',
  '/api/escorts/(.*)',
  '/api/regions/(.*)',
  '/api/seed-(.*)',
  '/api/fix-image-tokens',
  '/api/clean-image',
  '/api/cloudinary-signature',
  '/api/cleaned-images/upload',
  '/api/firebase/migrate-images/(.*)',
  '/api/dewatermark/(.*)',
  '/api/migrate-regions',
  '/api/update-escort-primary-location',
  '/api/test-storage',
  '/api/contact',
  '/api/sms/send',
  '/api/spaceship-test',
  '/api/zoho/(.*)',
  '/api/packages',
  '/api/credits',
  '/api/transactions/(.*)',
  '/api/verify/(.*)',
]);

// Signed-out visitors hitting a protected route land on our own registration
// page instead of Clerk's hosted sign-in screen. `auth.protect()` only
// redirects page navigations (`Sec-Fetch-Dest: document` / `Accept: text/html`)
// to this URL; API and fetch requests keep returning 401/404 JSON, so client
// fetchers are unaffected. Clerk still appends `redirect_url`, so a user who
// signs in from here returns to the page they originally asked for.
const UNAUTHENTICATED_LANDING = '/private-escort-record';

export default clerkMiddleware(
  async (auth, request) => {
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
    return NextResponse.next();
  },
  { signInUrl: UNAUTHENTICATED_LANDING },
);

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};