"use client";

import { DiditSdk } from "@didit-protocol/sdk-web";
import { useState } from "react";

export default function VerifyButton() {
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        console.error("Failed to create verification session:", data.error);
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
      console.error("Verification error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={start}
      disabled={loading}
      className="px-5 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Starting…" : "Verify my identity"}
    </button>
  );
}
