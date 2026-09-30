import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessPageProps {
  searchParams: Promise<{ orderTrackingId?: string; reference?: string; type?: string }>;
}

export default async function PaymentSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const orderTrackingId = params.orderTrackingId;
  const reference = params.reference;
  const type = params.type;

  // Notify the rest of the app that credits / packages may have changed.
  return (
    <>
      <ScriptTriggerEvents />
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-stone-100 rounded-lg p-6 md:p-8 shadow-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl md:text-3xl font-bold text-green-700 mb-2">
            {type === "credits" ? "Purchase Successful!" : "Payment Successful!"}
          </h1>
          <p className="text-gray-600 mb-6">
            {type === "credits"
              ? "Your boost package has been purchased successfully with credits and activated."
              : "Your payment has been received and processed successfully. The boost package will be activated shortly."}
          </p>

          <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm text-left space-y-2 mb-6">
            {reference && (
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID</span>
                <span className="font-semibold text-gray-800 break-all">
                  {reference}
                </span>
              </div>
            )}
            {orderTrackingId && (
              <div className="flex justify-between">
                <span className="text-gray-600">Order Tracking ID</span>
                <span className="font-semibold text-gray-800 break-all">
                  {orderTrackingId}
                </span>
              </div>
            )}
          </div>

          <Button asChild className="w-full bg-red-700 hover:bg-red-800 text-white">
            <Link href="/extend">Back to My Listings</Link>
          </Button>
        </div>
      </div>
    </>
  );
}

/**
 * Client boundary that fires storage/Clerk refresh events so the rest of the
 * app (credits balance, packages, listing boost) picks up the new payment.
 */
function ScriptTriggerEvents() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('credits-updated'));
            window.dispatchEvent(new Event('packages-updated'));
          }
        `,
      }}
    />
  );
}