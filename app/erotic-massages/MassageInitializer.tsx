"use client";

import { useEffect } from "react";
import { useMassageStore } from "@/store/massageStore";
import { getMassagesFromCleanedEscorts } from "@/server-actions/cleaned-escorts.action";

interface Props {
  initialMassages?: { value: string; count: number }[];
}

const MassageInitializer = ({ initialMassages = [] }: Props) => {
  const { setMassages, setLoading, setError } = useMassageStore();

  // Seed the store from server-side data passed as props
  useEffect(() => {
    if (initialMassages && initialMassages.length > 0) {
      const formatted = initialMassages.map((item, idx) => ({
        id: idx,
        name: item.value,
        value: item.value,
        count: item.count,
      }));
      setMassages(formatted);
    }
  }, [initialMassages, setMassages]);

  // Attempt a client-side refresh as a fallback
  useEffect(() => {
    let isMounted = true;

    async function fetchMassages() {
      try {
        setLoading(true);
        setError(null);

        const massages = await getMassagesFromCleanedEscorts({});

        if (isMounted) {
          if (massages && massages.length > 0) {
            const formattedMassages = massages.map((item, idx) => ({
              id: idx,
              name: item.value,
              value: item.value,
              count: item.count,
            }));
            setMassages(formattedMassages);
          }
        }
      } catch (err) {
        console.error("Error fetching massages from cleaned escorts:", err);
        if (isMounted) {
          setError("Failed to load massage types");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchMassages();

    return () => {
      isMounted = false;
    };
  }, [setMassages, setLoading, setError]);

  return null;
};

export default MassageInitializer;
