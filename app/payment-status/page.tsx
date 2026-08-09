"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, ArrowRight, Download } from "lucide-react";
import Link from "next/link";
import FloatingFlowers from "./FloatingFlowers";

type Status = "pending" | "completed" | "failed" | "not_found";

export default function PaymentStatusPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const checkoutRequestId = searchParams.get("checkoutRequestId");
  const [status, setStatus] = useState<Status>("pending");
  const [transaction, setTransaction] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [plan, setPlan] = useState<string>("free");

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const res = await fetch("/api/credits");
        if (res.ok) {
          const data = await res.json();
          setCredits(data.credits ?? 0);
          setPlan(data.plan || "free");
        }
      } catch (e) {
        // ignore
      }
    }
    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (!checkoutRequestId) {
      setStatus("not_found");
      setError("Missing checkout request ID");
      return;
    }

    let interval: NodeJS.Timeout;

    const poll = async () => {
      try {
        const res = await fetch(`/api/transactions/${checkoutRequestId}`);
        if (res.ok) {
          const data = await res.json();
          setTransaction(data);
          if (data.status === "completed" || data.status === "failed") {
            setStatus(data.status as Status);
            clearInterval(interval);
          }
        } else if (res.status === 404) {
          setStatus("not_found");
          setError("Transaction not found");
          clearInterval(interval);
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    };

    poll();
    interval = setInterval(poll, 2000);

    return () => clearInterval(interval);
  }, [checkoutRequestId]);

  const handleDownloadInvoice = () => {
    if (!transaction) return;
    const csv = [
      ["Field", "Value"],
      ["Invoice ID", transaction.id],
      ["Date", transaction.createdAt?._seconds ? new Date(transaction.createdAt._seconds * 1000).toLocaleString() : ""],
      ["Status", transaction.status],
      ["Amount", transaction.amount ? `KSH ${transaction.amount}` : ""],
      ["Phone", transaction.phoneNumber || ""],
      ["Receipt", transaction.receiptNumber || ""],
      ["Result", transaction.resultDesc || ""],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${transaction.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (status === "not_found") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-stone-100 rounded-lg p-6 md:p-8 shadow-md text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl md:text-3xl font-bold text-red-700 mb-2">
            Transaction Not Found
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button asChild className="bg-red-700 hover:bg-red-800 text-white">
            <Link href="/extend">Go to Buy Credits</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-stone-100 rounded-lg p-6 md:p-8 shadow-md text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl md:text-3xl font-bold text-red-700 mb-2">
            Payment Failed
          </h1>
          <p className="text-gray-600 mb-2">
            {transaction?.resultDesc || "The payment could not be completed."}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Please try again or contact support if the amount was deducted.
          </p>
          <Button asChild className="bg-red-700 hover:bg-red-800 text-white">
            <Link href="/extend">Try Again</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div className="relative min-h-screen bg-white flex items-center justify-center p-4 overflow-hidden">
        <FloatingFlowers />
        <div className="max-w-lg w-full bg-stone-100 rounded-lg p-6 md:p-8 shadow-md text-center relative z-10">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl md:text-3xl font-bold text-green-700 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Your payment has been received and processed successfully.
          </p>

          <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm text-left space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Invoice ID</span>
              <span className="font-semibold text-gray-800">{transaction?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount</span>
              <span className="font-semibold text-gray-800">
                {transaction?.amount ? `KSH ${transaction.amount}` : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Receipt Number</span>
              <span className="font-semibold text-gray-800">
                {transaction?.receiptNumber || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone</span>
              <span className="font-semibold text-gray-800">
                {transaction?.phoneNumber || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date</span>
              <span className="font-semibold text-gray-800">
                {transaction?.transactionDate
                  ? new Date(transaction.transactionDate).toLocaleString()
                  : transaction?.completedAt?._seconds
                    ? new Date(transaction.completedAt._seconds * 1000).toLocaleString()
                    : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="font-semibold text-green-600 capitalize">
                {transaction?.status}
              </span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between">
              <span className="text-gray-600">Your Plan</span>
              <span className="font-semibold text-red-700 capitalize">{plan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Your Credits</span>
              <span className="font-semibold text-red-700">{credits}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleDownloadInvoice}
              variant="secondary"
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Invoice
            </Button>
            <Button asChild className="flex-1 bg-red-700 hover:bg-red-800 text-white">
              <Link href="/invoices">
                View All Invoices <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-stone-100 rounded-lg p-6 md:p-8 shadow-md text-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Processing Payment
        </h1>
        <p className="text-gray-600">
          Please wait while we confirm your payment...
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Do not close this page.
        </p>
      </div>
    </div>
  );
}
