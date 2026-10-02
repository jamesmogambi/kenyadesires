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
  const [pollExpired, setPollExpired] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const onPaymentCompleteRef = useRef(onPaymentComplete);
  // Both the postMessage fast path and the 4s poller can reach a terminal
  // state, and the poller keeps running until the navigation actually lands.
  // Without this, `settle` fires repeatedly: onPaymentComplete runs twice
  // (double dispatch of credits-updated / packages-updated) and the redirect
  // is re-issued mid-flight.
  const settledRef = useRef(false);

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
      if (settledRef.current) return;
      settledRef.current = true;
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
  //
  // The iframe navigates to NEXT_PUBLIC_APP_URL/payment/callback, which is not
  // always the app's own origin: in development the app is served from
  // localhost while the callback is reached through the ngrok tunnel, so a
  // strict `origin === location.origin` test drops the message and the modal
  // falls back to the slow poller. Both origins are ours, so allow either.
  useEffect(() => {
    const allowedOrigins = new Set<string>([window.location.origin]);
    const configured = (process.env.NEXT_PUBLIC_APP_URL || "").trim();
    if (configured) {
      try {
        allowedOrigins.add(new URL(configured).origin);
      } catch {
        /* ignore an unparseable configured URL */
      }
    }

    const handleMessage = (event: MessageEvent) => {
      if (!allowedOrigins.has(event.origin)) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
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

        // A 5xx here means *we* could not reach Pesapal, not that the customer
        // failed to pay. /api/pesapal/callback answers its catch block with
        // { status: "failed" }, so honouring the body on a non-ok response
        // would abandon a perfectly good payment on one transient timeout.
        if (!res.ok) throw new Error(`status ${res.status}`);

        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (data.status === "completed") {
          settle("completed", data.merchantReference || "");
          return;
        }
        if (data.status === "failed") {
          // Send a code, not copy. `data.paymentStatus` is Pesapal's raw
          // vocabulary ("INVALID", "FAILED", …); it used to land verbatim in
          // /payment/failed?error=INVALID and render as a bare "INVALID".
          // /payment/failed owns the wording for FAILURE_REASONS.
          settle("failed", "", "declined");
          return;
        }
      } catch {
        // Transient network or upstream failure — keep polling until the
        // timeout, then surface it rather than deciding the outcome.
      }

      if (cancelled) return;
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        setPollExpired(true);
        return;
      }
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
    setPollExpired(false);
    settledRef.current = false;
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
    // Once settling has started we are about to navigate away. Closing here
    // would unmount the dialog and strand the customer on a page whose
    // payment state is unknown.
    if (finalizing) return;
    if (iframeRef.current) {
      iframeRef.current.src = "about:blank";
    }
    setOpen(false);
    setIframeSrc(null);
    setOrderTrackingId(null);
    setPollExpired(false);
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
          onEscapeKeyDown={(e) => {
            if (finalizing) e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            if (finalizing) e.preventDefault();
          }}
          // Layout: a bottom sheet on phones, centred card from sm up.
          //
          // Phones get `top-auto` + a fixed height so the sheet is anchored to
          // the bottom edge — the app header and logo stay visible above it and
          // the form is never letterboxed. `h-[88dvh]` is definite because
          // DialogContent is a flex column now (it used to be `grid`, which
          // silently beat this component's `flex` override in Tailwind's display
          // layer and collapsed the frame to the iframe's 150px intrinsic
          // height — that collapse is what made the Pesapal inputs unusable on
          // mobile).
          //
          // `inset-0` still has to beat DialogContent's `top-[50%] left-[50%]`
          // centring. It does, via shorthand-vs-longhand: `inset` is the
          // shorthand, the base's `top`/`left` are longhands, and a longhand
          // wins over a shorthand regardless of stylesheet order.
          //
          // `w-full` rather than `w-screen`: the sheet is already pinned by
          // `inset-0`, and 100vw includes the scrollbar gutter, which pushes
          // the card off-centre on desktop.
          className="fixed inset-0 top-auto z-[100] flex h-[88dvh] max-h-[88dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-t-2xl border-0 bg-white p-0 shadow-none sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-[min(92dvh,760px)] sm:max-h-[92dvh] sm:w-[92vw] sm:max-w-[92vw] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border sm:shadow-2xl md:max-w-[760px] lg:max-w-[820px]"
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
              disabled={finalizing}
              className="shrink-0 p-2 -mr-2 rounded-lg transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              aria-label="Close payment modal"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </DialogHeader>
          {iframeSrc && (
            // `overscroll-contain` stops the Pesapal document from scroll-chaining to the
            // page behind the sheet once it reaches the end of its own content.
            //
            // The bottom inset keeps the last field of the Pesapal form clear of
            // the iOS home indicator. Without it the phone number field — the
            // one input every mobile payer needs — sits under the bar.
            <div className="relative flex min-h-0 flex-1 flex-col overscroll-contain pb-[env(safe-area-inset-bottom)] sm:pb-0">
              <iframe
                ref={iframeRef}
                src={iframeSrc}
                className="h-full min-h-0 w-full border-0"
                allow="payment *"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-top-navigation allow-payment"
                title="Pesapal Secure Payment"
              />
              {finalizing && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/80">
                  <Loader2 className="h-8 w-8 animate-spin text-red-700" />
                  <p className="text-sm text-gray-700">Confirming your payment…</p>
                </div>
              )}
              {pollExpired && !finalizing && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/95 px-6 text-center">
                  <p className="text-sm text-gray-700">
                    We could not confirm this payment within 15 minutes.
                  </p>
                  <p className="text-xs text-gray-500">
                    If you completed the payment, it will still be applied —
                    check your M-Pesa statement or your account balance shortly.
                  </p>
                  <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
                    <a
                      href={`/payment/success?orderTrackingId=${encodeURIComponent(orderTrackingId || "")}`}
                      className="text-sm font-semibold text-red-700 underline"
                    >
                      Check payment status
                    </a>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="text-sm text-gray-600 underline"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}