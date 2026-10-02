import Link from "next/link";
import { XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FailedPageProps {
  searchParams: Promise<{ orderTrackingId?: string; error?: string }>;
}

/**
 * The `error` query param is untrusted display input: every producer either
 * passes one of these codes, and everything else falls through to the generic
 * message. That is what stops raw upstream tokens ("INVALID") and upstream
 * error prose from reaching the page.
 */
const FAILURE_COPY: Record<string, string> = {
  declined:
    "Your payment was declined. No money has been taken from your account.",
  reversed:
    "This payment was reversed by your payment provider. Any amount deducted will be refunded.",
  unverified:
    "We could not confirm this payment with Pesapal. If you completed it, the amount will still be applied — check your M-Pesa statement or your account balance shortly.",
  settling:
    "Your payment is still being confirmed, which can take a few minutes. Check your M-Pesa statement or your account balance shortly.",
};

const GENERIC_FAILURE =
  "The payment could not be completed. Your details have not been charged.";

export default async function PaymentFailedPage({ searchParams }: FailedPageProps) {
  const params = await searchParams;
  const orderTrackingId = params.orderTrackingId;
  const message = params.error ? FAILURE_COPY[params.error] : undefined;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-stone-100 rounded-lg p-6 md:p-8 shadow-md text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold text-red-700 mb-2">
          Payment Failed
        </h1>
        <p className="text-gray-600 mb-2">{message || GENERIC_FAILURE}</p>
        {orderTrackingId && (
          <p className="text-sm text-gray-500 mb-4 break-all">
            Reference: {orderTrackingId}
          </p>
        )}
        <p className="text-sm text-gray-500 mb-6">
          Please try again or contact support if the amount was deducted.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1 bg-red-700 hover:bg-red-800 text-white">
            <Link href="/extend">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Link>
          </Button>
          <Button asChild variant="secondary" className="flex-1">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
