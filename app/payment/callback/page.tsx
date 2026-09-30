"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * /payment/callback
 *
 * Pesapal redirects the customer's browser here after payment. This is a thin
 * loading page: it forwards the OrderTrackingId to the server-side callback API
 * route (which verifies the payment with Pesapal and issues a 302 to
 * /payment/success or /payment/failed). We let the browser follow that redirect
 * so the heavy lifting + token usage stays server-side.
 */
export default function PesapalCallbackPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const orderTrackingId = searchParams.get("OrderTrackingId");
    if (!orderTrackingId) {
      setError("Missing OrderTrackingId — the payment reference was not provided.");
      return;
    }

    const params = new URLSearchParams({ OrderTrackingId: orderTrackingId });
    const ref = searchParams.get("OrderMerchantReference");
    const notif = searchParams.get("OrderNotificationType");
    if (ref) params.set("OrderMerchantReference", ref);
    if (notif) params.set("OrderNotificationType", notif);

    // Navigate to the API route which verifies the payment server-side and
    // redirects the browser to /payment/success or /payment/failed.
    window.location.href = `/api/pesapal/callback?${params.toString()}`;
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-stone-100 rounded-lg p-6 md:p-8 shadow-md text-center">
        {error ? (
          <>
            <h1 className="text-2xl md:text-3xl font-bold text-red-700 mb-2">
              Payment reference missing
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
          </>
        ) : (
          <>
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              Verifying Payment
            </h1>
            <p className="text-gray-600">
              Please wait while we confirm your payment with Pesapal…
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Do not close this page.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
