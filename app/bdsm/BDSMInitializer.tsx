"use client";

import { useEffect } from "react";
import { useBDSMStore } from "@/store/bdsmStore";
import { getBDSMsFromCleanedEscorts } from "@/server-actions/cleaned-escorts.action";

interface Props {
  initialBDSMs?: { value: string; count: number }[];
}

const BDSMInitializer = ({ initialBDSMs = [] }: Props) => {
  const { setBDSMs, setLoading, setError } = useBDSMStore();

  // Seed the store from server-side data passed as props
  useEffect(() => {
    if (initialBDSMs && initialBDSMs.length > 0) {
      const formatted = initialBDSMs.map((item, idx) => ({
        id: idx,
        name: item.value,
        value: item.value,
        count: item.count,
      }));
      setBDSMs(formatted);
    }
  }, [initialBDSMs, setBDSMs]);

  // Attempt a client-side refresh as a fallback
  useEffect(() => {
    let isMounted = true;

    async function fetchBDSMs() {
      try {
        setLoading(true);
        setError(null);

        const bdsms = await getBDSMsFromCleanedEscorts({});

        if (isMounted) {
          if (bdsms && bdsms.length > 0) {
            const formattedBDSMs = bdsms.map((item, idx) => ({
              id: idx,
              name: item.value,
              value: item.value,
              count: item.count,
            }));
            setBDSMs(formattedBDSMs);
          }
        }
      } catch (err) {
        console.error(
          "Error fetching BDSM practices from cleaned escorts:",
          err,
        );
        if (isMounted) {
          setError("Failed to load BDSM practices");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchBDSMs();

    return () => {
      isMounted = false;
    };
  }, [setBDSMs, setLoading, setError]);

  return null;
};

export default BDSMInitializer;
