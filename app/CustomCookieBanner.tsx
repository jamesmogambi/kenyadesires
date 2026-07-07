// components/SimpleCookieBanner.tsx
"use client";

import { CookieBanner } from "@convective/gdpr-consent";

export function CustomCookieBanner() {
  return (
    <CookieBanner>
      {({ onAccept, onReject, privacyUrl }) => {
        // The CookieBanner component does not provide a `consent` prop here,
        // so always render the banner when this render prop is called.
        return (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1 text-center md:text-left">
                  <p className="text-sm text-gray-700">
                    We use cookies to improve your experience. By using our
                    site, you accept our{" "}
                    <a
                      href={privacyUrl || "/privacy"}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Privacy Policy
                    </a>
                    .
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={onReject}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={onAccept}
                    className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Accept All
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }}
    </CookieBanner>
  );
}
