// app/terms/page.tsx
import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: "Terms of Use | KenyaDesires",
  description:
    "Read the terms of use for KenyaDesires - Kenya's premier escort directory. Understand your rights and obligations when using our platform.",
  robots: {
    index: true,
    follow: true,
  },
};

export default async function TermsPage() {
  await connection();
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
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
            Terms of Use
          </h1>
          <p className="text-gray-500 text-sm">
            Last updated: <span className="text-gray-600">Jan 1, 2026</span>
          </p>
          <div className="w-24 h-1 bg-primary mx-auto mt-4" />
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 lg:p-10 shadow-sm space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-primary">📄</span>
              Terms of Use of the Web Interface for Users
            </h2>
            <p className="text-gray-600 leading-relaxed">
              These terms of use of the web interface for users (hereinafter
              referred to as the &quot;Terms&quot;) apply to the use of the web
              interfaces{" "}
              <a
                href="https://kenyadesires.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                kenyadesires.xyz
              </a>
              ,{" "}
              <a
                href="https://www.kenyadivas.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                www.kenyadivas.com
              </a>{" "}
              and{" "}
              <a
                href="https://xxx.kenyadesires.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                xxx.kenyadesires.xyz
              </a>{" "}
              (hereinafter referred to collectively as the &quot;Web
              Interface&quot;). The operator of both of these web interfaces is
              our company:
            </p>
          </section>

          {/* Company Info */}
          {/* TODO: // Update Company Info Section with actual company details. */}
          {/* <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>🏢</span>
              Operator Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-gray-600">
              <div>
                <span className="text-gray-500">Company:</span>{" "}
                <span className="text-gray-700">Suprextime sro.</span>
              </div>
              <div>
                <span className="text-gray-500">ID:</span>{" "}
                <span className="text-gray-700">08325600</span>
              </div>
              <div>
                <span className="text-gray-500">VAT Number:</span>{" "}
                <span className="text-gray-700">CZ08325600</span>
              </div>
              <div>
                <span className="text-gray-500">Sp. Zn.:</span>{" "}
                <span className="text-gray-700">
                  C 113099/KSBR Regional Court in Brno
                </span>
              </div>
              <div className="col-span-full">
                <span className="text-gray-500">Registered Office:</span>{" "}
                <span className="text-gray-700">
                  nám. TG Masaryka 1281, 76001 Zlín
                </span>
              </div>
              <div>
                <span className="text-gray-500">Contact Phone:</span>{" "}
                <a
                  href="tel:+420773923336"
                  className="text-primary hover:underline"
                >
                  +420 773 923 336
                </a>
              </div>
              <div>
                <span className="text-gray-500">Contact Email:</span>{" "}
                <a
                  href="mailto:info@dobryprivat.cz"
                  className="text-primary hover:underline"
                >
                  info@dobryprivat.cz
                </a>
              </div>
              <div>
                <span className="text-gray-500">Delivery Address:</span>{" "}
                <span className="text-gray-700">
                  nám. TG Masaryka 1281, 76001 Zlín
                </span>
              </div>
              <div>
                <span className="text-gray-500">Communication Language:</span>{" "}
                <span className="text-gray-700">Czech</span>
              </div>
            </div>
          </section> */}

          {/* Terms Sections */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>📋</span>
              Terms of Use of the Web Interface
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                The web interface is used to present services offered by
                registered users of the web interface (advertisers).
              </p>
              <p>
                The Terms and Conditions define and specify the basic rights and
                obligations of us as the operator arising from the Terms and
                Conditions, as well as our relationship with you as the user.
              </p>
              <p>
                The rights and obligations of the parties are further governed
                by the terms and conditions and instructions stated on the web
                interface. In matters not regulated here, the relations between
                us are governed by legal regulations, in particular the Civil
                Code.
              </p>
            </div>
          </section>

          {/* Important Notice */}
          <section className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-1">⚠️</span>
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                  Important Notice
                </h3>
                <div className="space-y-4 text-gray-600 leading-relaxed">
                  <p>
                    Please note that if you respond to a service presentation
                    published on the web interface, you are subsequently
                    entering into a potential contract directly with the{" "}
                    <span className="text-yellow-700 font-medium">
                      advertiser
                    </span>
                    . You negotiate the content of the contract and all its
                    requirements exclusively with the advertiser.
                  </p>
                  <p className="text-yellow-700 font-medium bg-yellow-100/50 p-4 rounded-lg border border-yellow-200">
                    Please note that in no case do we enter into legal
                    relationships between you and the advertiser and we are not
                    responsible for the proper performance of the advertiser.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Age Restriction */}
          <section className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-1">🚫</span>
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-3">
                  Age Restriction
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  The web interface is intended only for persons over the age of
                  18. By confirming on the web interface, you confirm that you
                  are over the age of 18 and that you have read and agree to
                  these terms and conditions.
                </p>
              </div>
            </div>
          </section>

          {/* Privacy & Reporting */}
          <section className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Privacy Protection
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Personal data protection is governed by the{" "}
                    <Link
                      href="/privacy"
                      className="text-primary hover:underline font-medium"
                    >
                      Privacy Policy
                    </Link>{" "}
                    located on the web interface.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🚨</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Report Illegal Content
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    You can report illegal content to our contact email:{" "}
                    <a
                      href="mailto:support@kenyadesires.xyz"
                      className="text-primary hover:underline font-medium"
                    >
                      support@kenyadesires.xyz
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <p className="text-gray-500 text-sm">
                These terms and conditions are valid and effective from{" "}
                <span className="text-gray-700 font-medium">Jan 1, 2026</span>.
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
