"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

/**
 * /payment/callback
 *
 * Pesapal redirects the customer's browser here after payment.
 * Handles both:
 *   - Full-page redirect (normal flow): forwards to server-side API for verification
 *   - Iframe embed (iframe flow): posts message to parent window with result
 */
export default function PesapalCallbackPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "completed" | "failed">("loading");
  const [orderTrackingId, setOrderTrackingId] = useState<string | null>(null);

  const isInIframe = window.self !== window.top;

  useEffect(() => {
    const orderTrackingIdParam = searchParams.get("OrderTrackingId");
    if (!orderTrackingIdParam) {
      setError("Missing OrderTrackingId — the payment reference was not provided.");
      setStatus("failed");
      return;
    }

    setOrderTrackingId(orderTrackingIdParam);

    const params = new URLSearchParams({ OrderTrackingId: orderTrackingIdParam });
    const ref = searchParams.get("OrderMerchantReference");
    const notif = searchParams.get("OrderNotificationType");
    if (ref) params.set("OrderMerchantReference", ref);
    if (notif) params.set("OrderNotificationType", notif);

    if (isInIframe) {
      // Iframe flow: call API with iframe=true, then postMessage to parent
      fetch(`/api/pesapal/callback?${params.toString()}&iframe=true`, {
        method: "GET",
        credentials: "same-origin",
      })
        .then((res) => res.json())
        .then((data) => {
          const finalStatus = data.status === "completed" ? "completed" : "failed";
          setStatus(finalStatus);
          window.parent.postMessage(
            {
              type: "PESAPAL_CLOSE",
              status: finalStatus,
              orderTrackingId: orderTrackingIdParam,
            },
            window.location.origin
          );
        })
        .catch(() => {
          setStatus("failed");
          window.parent.postMessage(
            {
              type: "PESAPAL_CLOSE",
              status: "failed",
              orderTrackingId: orderTrackingIdParam,
            },
            window.location.origin
          );
        });
    } else {
      // Full-page flow: redirect to server-side API which handles verification + redirect
      window.location.href = `/api/pesapal/callback?${params.toString()}`;
    }
  }, [searchParams, isInIframe]);

  if (isInIframe) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-stone-100 rounded-lg p-6 md:p-8 shadow-md text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                Verifying Payment
              </h1>
              <p className="text-gray-600">Please wait while we confirm your payment…</p>
            </>
          )}
          {status === "completed" && (
            <>
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl md:text-3xl font-bold text-green-700 mb-2">
                Payment Successful
              </h1>
              <p className="text-gray-600">Redirecting…</p>
            </>
          )}
          {status === "failed" && (
            <>
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl md:text-3xl font-bold text-red-700 mb-2">
                Payment Failed
              </h1>
              <p className="text-gray-600">{error || "Payment verification failed."}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Full-page flow shows loading then redirects
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
            <p className="text-sm text-gray-500 mt-2">Do not close this page.</p>
          </>
        )}
      </div>
    </div>
  );
}