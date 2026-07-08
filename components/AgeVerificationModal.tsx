"use client";

import React, { useState, useEffect } from "react";
import Logo from "./Logo";

const STORAGE_KEY = "kd_age_verified";
const EXPIRY_DAYS = 30; // Age verification expires after 30 days

interface VerificationData {
  verified: boolean;
  timestamp: string;
}

export default function AgeVerificationModal() {
  const [show, setShow] = useState(false);
  const [denied, setDenied] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const data = JSON.parse(stored) as VerificationData;

        // Check if verification is still valid
        if (data.verified && data.timestamp) {
          const expiryDate = new Date(data.timestamp);
          const now = new Date();
          const daysDiff =
            (now.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24);

          // If within expiry period, don't show modal
          if (daysDiff < EXPIRY_DAYS) {
            setShow(false);
            return;
          }
        }
      }

      // Show modal if no valid verification found
      setShow(true);
    } catch {
      // If any error (corrupted storage, etc.), show modal
      setShow(true);
    }
  }, []);

  const handleConfirm = () => {
    try {
      const data: VerificationData = {
        verified: true,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore storage errors
    }
    setShow(false);
  };

  const handleDeny = () => {
    setDenied(true);
  };

  // Don't render anything on server to avoid hydration mismatch
  if (!isClient) return null;

  // Don't show if user already verified
  if (!show) return null;

  return (
    <div className="fixed outline-0 border-0 inset-0 z-200 flex items-center justify-center bg-black/95 p-4">
      <div className="w-full max-w-md rounded-none border border-none bg-dark-slate p-6 text-center shadow-2xl">
        {!denied ? (
          <>
            {/* <h1 className="text-2xl font-bold text-white">
              Are you 18 or older?
            </h1> */}
            <div className="flex items-center justify-center mb-4">
              <Logo />
            </div>
            <p className="mt-3 text-sm font-semibold text-white/70">
              Access to the site is only allowed for over 18 years of age. The
              site contains pornographic material. By accessing the Site, you
              agree to the terms of entry.
            </p>
            <div className="mt-6 flex flex-row gap-2">
              <button
                onClick={handleConfirm}
                className="w-full text-sm cursor-pointer rounded-lg bg-lime-400/90 px-2 py-2 font-semibold text-white transition hover:bg-lime-400/80"
              >
                Yes, I am 18 or older
              </button>
              <button
                onClick={handleDeny}
                className="w-full cursor-pointer rounded-lg bg-white text-sm border border-white/20 px-4 py-3 font-semibold text-black/80 transition hover:bg-white/90"
              >
                No, I am under 18
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-5xl mt-6 font-bold text-white/20">
              Sorry! Sorry!
            </h3>
            <p className="mt-3 mb-4 text-sm text-white/60 font-semibold">
              You must be at least 18 years old to view this website. Please
              leave this site.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
