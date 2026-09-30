"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CreditCard, Loader2 } from "lucide-react";

export interface PesapalCheckoutButtonProps {
  orderId: string;
  amount: number;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  description: string;
  packageId?: string;
  packageName?: string;
  idType?: "escort" | "agency";
  className?: string;
  children?: ReactNode;
}

/**
 * Reusable Pesapal checkout button.
 *
 * POSTs the order details to /api/pesapal/initiate (server-side — secrets are
 * never exposed to the client), then navigates the browser to Pesapal's hosted
 * payment page via `window.location.href`.
 */
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
        throw new Error(
          data.error || data.detail || "Failed to initiate payment",
        );
      }

      // Hand the customer off to Pesapal's hosted checkout. After payment they
      // are returned to /payment/callback (callback_url) which verifies + redirects.
      window.location.href = data.redirect_url;
    } catch (e: any) {
      setError(e?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className={cn(
          "w-full bg-red-700 hover:bg-red-800 text-white font-semibold",
          className,
        )}
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
    </div>
  );
}
