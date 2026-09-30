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
        if (event.data.status === "completed") {
          window.location.href = `/payment/success?orderTrackingId=${event.data.orderTrackingId}&reference=${event.data.merchantReference || ""}`;
        } else {
          window.location.href = `/payment/failed?orderTrackingId=${event.data.orderTrackingId}&error=${event.data.error || "Payment failed"}`;
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

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
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
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