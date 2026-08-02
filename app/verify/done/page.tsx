import Link from "next/link";

export const metadata = {
  title: "KYC Verification Complete | KenyaDesires",
  description: "Your identity verification is being processed.",
};

export default function VerifyDonePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="max-w-md mx-auto p-8 text-center">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-8 h-8 text-primary"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15l3-3m-6 6h12"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">
          Verification Submitted
        </h1>
        <p className="text-white/70 mb-6">
          Your identity verification has been submitted. You will receive an
          email once it is approved. This usually takes up to 24 hours.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-primary text-white font-semibold rounded-md hover:bg-primary/80 transition-colors"
        >
          Back to KenyaDesires
        </Link>
      </div>
    </div>
  );
}
