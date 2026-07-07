"use client";

import React from "react";

const STORAGE_KEY = "kd_age_verified";

export default function AgeVerificationModal() {
  const [show, setShow] = React.useState(false);
  const [denied, setDenied] = React.useState(false);

  React.useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "true") {
        setShow(true);
      }
    } catch {
      setShow(true);
    }
  }, []);

  const handleConfirm = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore storage errors
    }
    setShow(false);
  };

  const handleDeny = () => {
    setDenied(true);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-dark-slate p-6 text-center shadow-2xl">
        {!denied ? (
          <>
            <h1 className="text-2xl font-bold text-white">
              Are you 18 or older?
            </h1>
            <p className="mt-3 text-sm text-white/70">
              KenyaDesires contains adult content intended for mature audiences
              only. By entering, you confirm that you are at least 18 years of
              age and consent to viewing such material.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={handleConfirm}
                className="w-full rounded-lg bg-amber-500 px-4 py-3 font-semibold text-black transition hover:bg-amber-400"
              >
                Yes, I am 18 or older
              </button>
              <button
                onClick={handleDeny}
                className="w-full rounded-lg border border-white/20 px-4 py-3 font-semibold text-white/80 transition hover:bg-white/5"
              >
                No, I am under 18
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white">Access Denied</h1>
            <p className="mt-3 text-sm text-white/70">
              You must be at least 18 years old to view this website. Please
              leave this site.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
