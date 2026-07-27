// app/withdrawal/page.tsx (Print-Friendly Version)
import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Withdrawal from Contract | KenyaDesires",
  description:
    "Fill out the withdrawal form for distance contracts. Submit your withdrawal request for services purchased through our platform.",
};

export default function WithdrawalPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-white py-12 print:py-4">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 print:px-2">
        {/* Header */}
        <div className="text-center mb-10 print:mb-6">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-4 print:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            Withdrawal from Contract
          </h1>
          <p className="text-gray-500 text-sm">
            Form for withdrawal from a distance contract
          </p>
          <div className="w-24 h-1 bg-primary mx-auto mt-4 print:hidden" />
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 lg:p-10 shadow-sm space-y-8 print:border-0 print:shadow-none print:p-0">
          {/* Form Header */}
          <section>
            <p className="text-gray-600 text-sm italic">
              (Fill out this form and send it back only if you wish to withdraw
              from the contract)
            </p>
          </section>

          {/* Notice of Withdrawal */}
          <section className="bg-gray-50 rounded-xl p-6 border border-gray-200 print:border print:border-gray-300">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>📄</span>
              Notice of Withdrawal from the Contract
            </h2>
            {/* TODO: Add address field if needed. Currently commented out. */}

            {/* <div className="space-y-4 text-gray-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm font-medium">
                    Addressee:
                  </p>
                  <p className="text-gray-700">
                    Suprextime s.r.o.
                    <br />
                    ID: 08325600
                    <br />
                    VAT number: CZ08325600
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">
                    Delivery Address:
                  </p>
                  <p className="text-gray-700">
                    nám. TG Masaryka 1281
                    <br />
                    76001 Zlín
                  </p>
                  <p className="mt-2">
                    <span className="text-gray-500 text-sm font-medium">
                      Email:
                    </span>{" "}
                    <a
                      href="mailto:info@dobryprivat.cz"
                      className="text-primary hover:underline"
                    >
                      info@dobryprivat.cz
                    </a>
                  </p>
                  <p>
                    <span className="text-gray-500 text-sm font-medium">
                      Contact Phone:
                    </span>{" "}
                    <a
                      href="tel:+420773923336"
                      className="text-primary hover:underline"
                    >
                      +420 773 923 336
                    </a>
                  </p>
                </div>
              </div>
            </div> */}
          </section>

          {/* Withdrawal Form - Printable */}
          <section className="print:mt-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>✍️</span>
              Withdrawal Form
            </h2>

            <div className="space-y-6">
              {/* Statement */}
              <div className="bg-white border border-gray-300 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed">
                  I/we hereby declare (*) that I/we hereby withdraw (*) from the
                  contract for the purchase of these goods/the provision of
                  these services (*):
                </p>
                <div className="mt-3 border-b-2 border-gray-300 py-2 px-3 min-h-10">
                  <span className="text-gray-400 text-sm">
                    (Describe the goods/services you are withdrawing from)
                  </span>
                </div>
              </div>

              {/* Order Date */}
              <div className="bg-white border border-gray-300 rounded-lg p-4">
                <p className="text-gray-700 font-medium mb-2">
                  Order date (*)/ receipt date (*)
                </p>
                <div className="border-b-2 border-gray-300 py-2 px-3 min-h-10">
                  <span className="text-gray-400 text-sm">
                    (Enter the date)
                  </span>
                </div>
              </div>

              {/* Consumer Name */}
              <div className="bg-white border border-gray-300 rounded-lg p-4">
                <p className="text-gray-700 font-medium mb-2">
                  Name and surname of the consumer/consumers
                </p>
                <div className="border-b-2 border-gray-300 py-2 px-3 min-h-10">
                  <span className="text-gray-400 text-sm">
                    (Enter your full name)
                  </span>
                </div>
              </div>

              {/* Consumer Address */}
              <div className="bg-white border border-gray-300 rounded-lg p-4">
                <p className="text-gray-700 font-medium mb-2">
                  Address of the consumer/consumers
                </p>
                <div className="border-b-2 border-gray-300 py-2 px-3 min-h-[40px]">
                  <span className="text-gray-400 text-sm">
                    (Enter your full address)
                  </span>
                </div>
              </div>

              {/* Date */}
              <div className="bg-white border border-gray-300 rounded-lg p-4">
                <p className="text-gray-700 font-medium mb-2">Date</p>
                <div className="border-b-2 border-gray-300 py-2 px-3 min-h-10">
                  <span className="text-gray-400 text-sm">
                    (Enter today's date)
                  </span>
                </div>
              </div>

              {/* Signature */}
              <div className="bg-white border border-gray-300 rounded-lg p-4">
                <p className="text-gray-700 font-medium mb-2">
                  Signature of the consumer(s)
                </p>
                <p className="text-gray-500 text-sm">
                  (only if this form is sent on paper)
                </p>
                <div className="border-b-2 border-gray-300 py-2 px-3 min-h-15 mt-2">
                  <span className="text-gray-400 text-sm">
                    (Sign here if sending on paper)
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Important Notes */}
          <section className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 print:border print:border-gray-300">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-1">⚠️</span>
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                  Important Notes
                </h3>
                <ul className="space-y-2 text-gray-600 list-disc list-inside">
                  <li>
                    Fields marked with{" "}
                    <span className="text-yellow-700 font-medium">(*)</span> are
                    required
                  </li>
                  <li>
                    Please fill out this form completely and send it back to the
                    provided address
                  </li>
                  <li>Keep a copy of this form for your records</li>
                    <li>
                      For any questions, contact us at{" "}
                      <a
                        href="mailto:hello@kenyadesires.com"
                        className="text-primary hover:underline font-medium"
                      >
                        hello@kenyadesires.com
                      </a>
                    </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="pt-6 border-t border-gray-200 print:border-t print:border-gray-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <p className="text-gray-500 text-sm">
                Please submit this form to withdraw from your contract.
              </p>
              <p className="text-gray-400 text-xs">
                &copy; {currentYear} KenyaDesires. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
