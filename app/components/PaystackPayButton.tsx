"use client";

import React from "react";
import { usePaystack } from "@makozi/paystack-react-pay";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaystackPayButtonProps {
  /** Paystack public key is read from NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY. */
  email: string;
  /** Amount in the smallest currency unit (KES cents; 1 KES = 100). */
  amount: number;
  currency?: string;
  reference?: string;
  metadata?: Record<string, any>;
  className?: string;
  children?: React.ReactNode;
  onTrigger?: () => void;
  onSuccess?: (reference: string) => void;
  onClose?: () => void;
}

export function PaystackPayButton({
  email,
  amount,
  currency = "KES",
  reference,
  metadata,
  className,
  children,
  onTrigger,
  onSuccess,
  onClose,
}: PaystackPayButtonProps) {
  const { initializePayment } = usePaystack({
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
    email,
    amount,
    reference,
    currency,
    metadata,
    // channels are not configurable via this library's PaystackConfig; Paystack
    // dashboard defaults apply. Requested: mobile_money, card, bank_transfer.
    onSuccess: async (response: any) => {
      const ref = response?.reference;
      try {
        const res = await fetch("/api/paystack/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: ref }),
        });
        const data = await res.json();
        if (data?.verified) {
          onSuccess?.(ref);
          window.location.href = `/payment/success?reference=${encodeURIComponent(ref || "")}&type=paystack`;
        } else {
          console.error("Paystack verification failed", data);
        }
      } catch (err) {
        console.error("Paystack verify request failed", err);
      }
    },
    onClose: () => {
      console.log("Paystack payment closed/cancelled");
      onClose?.();
    },
  });

  return (
    <Button
      type="button"
      onClick={() => { onTrigger?.(); initializePayment(); }}
      className={cn("w-full bg-red-700 hover:bg-red-800 text-white font-semibold", className)}
    >
      <CreditCard className="mr-2 h-4 w-4" />
      {children || "Pay with Paystack (M-Pesa / Card)"}
    </Button>
  );
}

export default PaystackPayButton;
