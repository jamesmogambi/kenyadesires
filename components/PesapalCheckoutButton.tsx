"use client";

import { useState, useEffect, useRef } from "react";
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
 * The iframe checkout only works reliably on larger viewports.
 *
 * /api/pesapal/initiate submits the order with redirect_mode "PARENT_WINDOW",
 * so after payment Pesapal navigates the TOP window from inside the iframe.
 * That requires the sandbox to allow top-level navigation, which is
 * inconsistently supported on mobile browsers — the payment completes but the
 * redirect never lands, leaving the dialog spinning forever.
 *
 * So on small screens we skip the iframe and do a full-page navigation to
 * Pesapal instead. /payment/callback already handles the non-iframe case
 * (`isInIframe === false`) and forwards to /api/pesapal/callback, which
 * verifies the payment server-side and redirects to the success/failed page.
 */
const MOBILE_BREAKPOINT = 768;

function prefersFullPageCheckout(): boolean {
  if (typeof window === "undefined") return false;
  const isSmallViewport = window.innerWidth < MOBILE_BREAKPOINT;
  // Coarse pointer covers phones and tablets; desktop browsers never match.
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
  return isSmallViewport || isTouchDevice;
}

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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "PESAPAL_CLOSE") {
        setOpen(false);
        setIframeSrc(null);
        setOrderTrackingId(null);
        const status = event.data.status as "completed" | "failed";
        const orderTrackingId = event.data.orderTrackingId;
        onPaymentComplete?.(status, orderTrackingId);
        if (status === "completed") {
          window.location.href = `/payment/success?orderTrackingId=${orderTrackingId}&reference=${event.data.merchantReference || ""}`;
        } else {
          window.location.href = `/payment/failed?orderTrackingId=${orderTrackingId}&error=${event.data.error || "Payment failed"}`;
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onPaymentComplete]);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
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

      // Mobile: full-page navigation. The iframe sandbox cannot reliably
      // perform the PARENT_WINDOW redirect Pesapal needs, which is what left
      // phones stuck on a spinner.
      if (prefersFullPageCheckout()) {
        window.location.href = data.redirect_url;
        return;
      }

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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[800px] lg:max-w-[900px] w-full max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b bg-white sticky top-0 z-10 flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">Complete Payment</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Secure payment via Pesapal (M-Pesa, Airtel Money, Card)
              </DialogDescription>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close payment modal"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </DialogHeader>
          {iframeSrc && (
            <div className="relative h-[calc(90vh-140px)] min-h-[400px]">
              <iframe
                ref={iframeRef}
                src={iframeSrc}
                className="w-full h-full border-0"
                allow="payment *"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-top-navigation allow-payment"
                title="Pesapal Secure Payment"
              />
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center pointer-events-none" style={{ display: "none" }}>
                <Loader2 className="h-8 w-8 animate-spin text-red-700" />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}