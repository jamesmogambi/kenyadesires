"use client";

import { DiditSdk } from "@didit-protocol/sdk-web";
import { useState } from "react";

export default function VerifyButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        const detail = data.detail || data.error || "Unknown error";
        console.error("Failed to create verification session:", detail);
        setError(detail);
        return;
      }

      DiditSdk.shared.onComplete = (result: {
        type: string;
        session?: unknown;
        error?: unknown;
      }) => {
        console.log("Verification flow finished:", result.type);
      };

      DiditSdk.shared.startVerification({ url: data.url });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Verification error:", msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={start}
        disabled={loading}
        className="px-5 py-3 bg-primary text-lg text-white uppercase font-semibold rounded-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Starting…" : "Verify my identity"}
      </button>
      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}
    </div>
  );
}
