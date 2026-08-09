"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Transaction = {
  id: string;
  type: string;
  packageId?: string | null;
  phoneNumber?: string;
  amount?: number;
  accountReference?: string;
  transactionDesc?: string;
  status: string;
  resultCode?: number;
  resultDesc?: string;
  receiptNumber?: string;
  transactionDate?: number;
  createdAt?: any;
  completedAt?: any;
};

export default function InvoicesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const res = await fetch("/api/transactions");
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error === "unauthorized" ? "Please log in to view invoices" : data.detail || data.error || "Failed to load invoices");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setTransactions(data.transactions || []);
      } catch (e) {
        setError("Failed to load invoices");
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
  }, []);

  const handleDownload = (tx: Transaction) => {
    const rows = [
      ["Field", "Value"],
      ["Invoice ID", tx.id],
      ["Date", tx.createdAt?._seconds ? new Date(tx.createdAt._seconds * 1000).toLocaleString() : ""],
      ["Type", tx.type],
      ["Status", tx.status],
      ["Description", tx.transactionDesc || tx.accountReference || ""],
      ["Amount", tx.amount ? `KSH ${tx.amount}` : ""],
      ["Phone", tx.phoneNumber || ""],
      ["Receipt", tx.receiptNumber || ""],
      ["Result", tx.resultDesc || ""],
    ]
      .map((row) => `"${row[0]}","${row[1]}"`)
      .join("\n");

    const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${tx.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "—";
    if (timestamp._seconds) {
      return new Date(timestamp._seconds * 1000).toLocaleDateString();
    }
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-stone-100 rounded-lg p-6 md:p-8 shadow-md text-center">
          <p className="text-red-700 text-lg mb-4">{error}</p>
          <Button asChild className="bg-red-700 hover:bg-red-800 text-white">
            <Link href="/extend">Buy Credits</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-red-700 text-center mb-8">
          Invoices
        </h1>

        {transactions.length === 0 ? (
          <div className="bg-stone-100 rounded-lg p-8 shadow-md text-center">
            <p className="text-gray-600 text-lg mb-4">No invoices yet.</p>
            <Button asChild className="bg-red-700 hover:bg-red-800 text-white">
              <Link href="/extend">Purchase Your First Package</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-stone-100 rounded-lg p-4 md:p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Invoice</span>
                      <span className="text-xs font-mono bg-white px-2 py-1 rounded text-gray-700">
                        {tx.id}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-semibold px-2 py-1 rounded-full",
                          tx.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : tx.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700",
                        )}
                      >
                        {tx.status}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-800">
                      {tx.transactionDesc || tx.accountReference || "Payment"}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span>Date: {formatDate(tx.createdAt)}</span>
                      <span>Amount: {tx.amount ? `KSH ${tx.amount}` : "—"}</span>
                      <span>Receipt: {tx.receiptNumber || "—"}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleDownload(tx)}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                    <Button asChild className="bg-red-700 hover:bg-red-800 text-white">
                      <Link
                        href={`/payment-status?checkoutRequestId=${encodeURIComponent(tx.id)}`}
                        className="flex items-center gap-2"
                      >
                        View <ChevronRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}