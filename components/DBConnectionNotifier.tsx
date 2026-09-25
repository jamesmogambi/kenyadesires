"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function DBConnectionNotifier() {
  useEffect(() => {
    let dismissed = false;

    async function checkDB() {
      try {
        const res = await fetch("/api/db-status", { cache: "no-store" });
        const data = await res.json();

        if (!dismissed && data.overall === "healthy") {
          toast.success("Database connected", {
            description: `MySQL (${data.databases.mysql.latency}ms) · Sanity (${data.databases.sanity.latency}ms)`,
            duration: 5000,
          });
        } else if (!dismissed && data.overall === "degraded") {
          toast.warning("Database degraded", {
            description: `MySQL: ${data.databases.mysql.ok ? "OK" : data.databases.mysql.error} · Sanity: ${data.databases.sanity.ok ? "OK" : data.databases.sanity.error}`,
            duration: 8000,
          });
        }
      } catch {
        if (!dismissed) {
          toast.error("Database check failed", {
            description: "Could not reach /api/db-status",
            duration: 8000,
          });
        }
      }
    }

    checkDB();

    return () => {
      dismissed = true;
    };
  }, []);

  return null;
}