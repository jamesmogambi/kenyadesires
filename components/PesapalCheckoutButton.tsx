"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CreditCard, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/**
 * Checkout happens in a modal on every viewport.
 *
 * /api/pesapal/initiate submits the order with redirect_mode "PARENT_WINDOW",
 * so after payment Pesapal tries to navigate out of the embedded page. Mobile
 * browsers do not apply the iframe sandbox's allow-top-navigation rules
 * consistently, so that redirect is the part we cannot rely on — phones used
 * to abandon the modal entirely (full-page navigation to Pesapal) and, when
 * they stayed, froze on the "payment processing" screen because the redirect
 * never landed.
 *
 * So the redirect is treated as an optimisation, not the contract. The parent
 * window knows the order_tracking_id from the initiate response and polls
 * /api/pesapal/callback (which verifies server-side with Pesapal) until it
 * reaches a terminal state. That works identically on desktop and mobile,
 * keeps the customer inside the app, and still closes promptly when Pesapal's
 * redirect does land via postMessage.
 */
const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 15 * 60 * 1000;

export interface PesapalCheckoutButtonProps {
  orderId: string;
  amount: number;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  description: string;
  packageId?: string;
  packageName?: string;
  idType?: "escort" | "agency";
  className?: string;
  children?: ReactNode;
  onPaymentComplete?: (status: "completed" | "failed", orderTrackingId: string) => void;
}

export function PesapalCheckoutButton({
  orderId,
  amount,
  email,
  phone,
  firstName,
  lastName,
  description,
  packageId,
  packageName,
  idType,
  className,
  children,
  onPaymentComplete,
}: PesapalCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [orderTrackingId, setOrderTrackingId] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const onPaymentCompleteRef = useRef(onPaymentComplete);

  useEffect(() => {
    onPaymentCompleteRef.current = onPaymentComplete;
  }, [onPaymentComplete]);

  /**
   * Settle the payment: tell the caller, then leave for our own result page.
   * Shared by the postMessage fast path and the poller so both behave the same.
   * The modal stays mounted behind the finalising overlay until the navigation
   * lands, so the customer never sees a dead payment form.
   */
  const settle = useCallback(
    (status: "completed" | "failed", reference?: string, reason?: string) => {
      setFinalizing(true);
      onPaymentCompleteRef.current?.(status, orderTrackingId || "");
      const params = new URLSearchParams();
      if (orderTrackingId) params.set("orderTrackingId", orderTrackingId);
      if (status === "completed") {
        if (reference) params.set("reference", reference);
        window.location.href = `/payment/success?${params.toString()}`;
      } else {
        params.set("error", reason || "Payment failed");
        window.location.href = `/payment/failed?${params.toString()}`;
      }
    },
    [orderTrackingId],
  );

  // Fast path: /payment/callback posts this when Pesapal's redirect does land
  // inside the iframe. Stays pending-aware so a slow settlement is not read as
  // a failure.
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "PESAPAL_CLOSE") return;
      const status = event.data.status as "completed" | "failed";
      if (status !== "completed" && status !== "failed") return;
      settle(
        status,
        event.data.merchantReference || "",
        event.data.error || "",
      );
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [settle]);

  // Reliable path: poll Pesapal's real status through our own API. Independent
  // of whether the iframe redirect works, which is what unsticks mobile.
  useEffect(() => {
    if (!open || !orderTrackingId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const startedAt = Date.now();

    const check = async () => {
      try {
        const res = await fetch(
          `/api/pesapal/callback?OrderTrackingId=${encodeURIComponent(orderTrackingId)}&iframe=true`,
          { method: "GET", credentials: "same-origin", cache: "no-store" },
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (data.status === "completed") {
          settle("completed", data.merchantReference || "");
          return;
        }
        if (data.status === "failed") {
          settle("failed", "", data.paymentStatus || "Payment failed");
          return;
        }
      } catch {
        // Transient network failure — keep polling until the timeout.
      }

      if (cancelled) return;
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) return;
      timer = setTimeout(check, POLL_INTERVAL_MS);
    };

    timer = setTimeout(check, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, orderTrackingId, settle]);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    setFinalizing(false);
    try {
      const res = await fetch("/api/pesapal/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          orderId,
          amount,
          email,
          phone,
          firstName,
          lastName,
          description,
          packageId,
          packageName,
          idType,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.redirect_url) {
        throw new Error(data.error || data.detail || "Failed to initiate payment");
      }

      setOrderTrackingId(data.order_tracking_id);
      setIframeSrc(data.redirect_url);
      setOpen(true);
    } catch (e: any) {
      setError(e?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (iframeRef.current) {
      iframeRef.current.src = "about:blank";
    }
    setOpen(false);
    setIframeSrc(null);
    setOrderTrackingId(null);
    setFinalizing(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className={cn("w-full bg-red-700 hover:bg-red-800 text-white font-semibold", className)}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            {children || "Pay with Pesapal (M-Pesa / Card)"}
          </>
        )}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : handleClose())}>
        <DialogContent
          showCloseButton={false}
          // Full-bleed on phones (dvh, so mobile browser chrome can't crop the
          // form), centred card from sm up. The frame area is flex-1/min-h-0
          // rather than a fixed vh-minus-header math so it always fits the
          // space it actually has, including landscape.
          className="fixed inset-0 z-[100] flex h-[100dvh] max-h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-white p-0 shadow-none sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[90dvh] sm:w-[90vw] sm:max-w-[90vw] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border md:max-w-[800px] lg:max-w-[900px]"
        >
          <DialogHeader className="shrink-0 border-b bg-white px-4 py-3 sm:px-4 sm:py-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-lg font-semibold">
                Complete Payment
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-gray-500">
                Secure payment via Pesapal (M-Pesa, Airtel Money, Card)
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="shrink-0 p-2 -mr-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close payment modal"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </DialogHeader>
          {iframeSrc && (
            <div className="relative flex-1 min-h-0">
              <iframe
                ref={iframeRef}
                src={iframeSrc}
                className="w-full h-full border-0"
                allow="payment *"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-top-navigation allow-payment"
                title="Pesapal Secure Payment"
              />
              {finalizing && (
                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-red-700" />
                  <p className="text-sm text-gray-700">Confirming your payment…</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}