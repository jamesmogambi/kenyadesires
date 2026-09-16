// app/privacy/page.tsx
import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: "Privacy Policy | KenyaDesires",
  description:
    "Read our privacy policy to understand how we collect, use, and protect your personal data when using KenyaDesires - Kenya's premier escort directory.",
  robots: {
    index: true,
    follow: true,
  },
};

export default async function PrivacyPage() {
  await connection();
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            Privacy Policy
          </h1>
          <p className="text-gray-500 text-sm">Processing of Personal Data</p>
          <div className="w-24 h-1 bg-primary mx-auto mt-4" />
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 lg:p-10 shadow-sm space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-gray-600 leading-relaxed">
              These privacy policies (hereinafter referred to as the
              &quot;Policies&quot;) describe the method of obtaining, using and
              further handling of personal data obtained through the web
              interface{" "}
              <a
                href="https://kenyadesires.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                kenyadesires.xyz
              </a>{" "}
              (hereinafter referred to as the &quot;Web Interface&quot;).
            </p>
          </section>

          {/* Controller Info */}
          {/* TODO:// ADD REAL DATA CONTROLLER INFO */}
          {/* <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>🏢</span>
              Personal Data Controller
            </h2>
            <div className="space-y-2 text-gray-600">
              <p>
                <span className="text-gray-500">Company:</span>{" "}
                <span className="text-gray-700">Suprextime sro</span>
              </p>
              <p>
                <span className="text-gray-500">Address:</span>{" "}
                <span className="text-gray-700">
                  nám. TG Masaryka 1281, 76001 Zlín
                </span>
              </p>
              <p>
                <span className="text-gray-500">Company ID:</span>{" "}
                <span className="text-gray-700">08325600</span>
              </p>
              <p>
                <span className="text-gray-500">VAT No.:</span>{" "}
                <span className="text-gray-700">CZ08325600</span>
              </p>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">
              Contact Details
            </h3>
            <div className="space-y-2 text-gray-600">
              <p>
                <span className="text-gray-500">Delivery Address:</span>{" "}
                <span className="text-gray-700">
                  nám. TG Masaryka 1281, 76001 Zlín
                </span>
              </p>
              <p>
                <span className="text-gray-500">Phone:</span>{" "}
                <a
                  href="tel:+420773923336"
                  className="text-primary hover:underline"
                >
                  +420 773 923 336
                </a>
                <span className="text-gray-400 text-sm">
                  {" "}
                  (Mon-Fri 7:00 a.m.-3:30 p.m.)
                </span>
              </p>
              <p>
                <span className="text-gray-500">Email:</span>{" "}
                <a
                  href="mailto:info@dobryprivat.cz"
                  className="text-primary hover:underline"
                >
                  info@dobryprivat.cz
                </a>
              </p>
            </div>
          </section> */}

          {/* Important Note */}
          <section className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-1">🔒</span>
              <div>
                <p className="text-gray-700 leading-relaxed">
                  The protection of personal data is very important to us. We
                  ask that you carefully read this Policy, which contains
                  important information regarding the handling of your personal
                  data and related rights and obligations.
                </p>
              </div>
            </div>
          </section>

          {/* Introductory Provisions */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>📋</span>
              Introductory Provisions
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  What are our guidelines for handling personal data?
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  When handling personal data, we proceed in accordance with the
                  legal order of the Czech Republic and directly applicable
                  regulations of the European Union, in particular Regulation
                  (EU) 2016/679 of the European Parliament and of the Council of
                  27 April 2016 on the protection of natural persons with regard
                  to the processing of personal data and on the free movement of
                  such data, and repealing Directive 95/46/EC (hereinafter
                  referred to as the &quot;Regulation&quot;), Act No. 110/2019
                  Coll., on the processing of personal data, as amended, Act No.
                  480/2004 Coll., on certain information society services and on
                  amending certain acts, as amended, and Act No. 127/2005 Coll.,
                  on electronic communications and on amending certain related
                  acts (Electronic Communications Act), as amended.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  What is personal data?
                </h3>
                <p className="text-gray-600 leading-relaxed mb-3">
                  Personal data means any information that identifies or can
                  identify a specific natural person. Personal data includes, in
                  particular (but not exclusively):
                </p>
                <ul className="space-y-2 text-gray-600 list-disc list-inside">
                  <li>
                    <span className="font-medium">identification data</span>,
                    such as first and last name, user account login, user photo,
                    age, city, region;
                  </li>
                  <li>
                    <span className="font-medium">contact information</span>,
                    such as residential address, telephone number, e-mail
                    address;
                  </li>
                  <li>
                    <span className="font-medium">other data</span>, such as
                    information obtained using cookies, IP address (network
                    identifier) including browser type, device and operating
                    system, time and number of accesses to the web interface and
                    other similar information.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Collection and Use */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>📊</span>
              Collection and Use of Personal Data
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  How do we obtain your personal data?
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  You provide us with your personal data, especially when
                  creating a user account (possibly within the contact form).
                </p>
                <p className="text-gray-600 leading-relaxed mt-2">
                  When visiting and using the web interface, some personal data
                  may also be collected and stored via cookies. You can read
                  more about cookies in Article 5 of these Policies.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  On what basis and for what purposes do we process your
                  personal data?
                </h3>
                <ul className="space-y-3 text-gray-600 list-disc list-inside">
                  <li>
                    Personal data entered for the purpose of creating a user
                    account, which is necessary to create a profile on the web
                    interface (username, e-mail address), must be completed for
                    the full publication of the account on our website (name,
                    region, city, telephone, photo).
                  </li>
                  <li>
                    We do not collect or require any other personal data about
                    users unless the users themselves voluntarily provide it.
                  </li>
                  <li>
                    Users can change or delete all their personal data at any
                    time after logging into the web interface.
                  </li>
                  <li>
                    The administrator is not responsible for or verifies the
                    veracity of the personal data provided by registered users
                    on the web interface.
                  </li>
                  <li>
                    The administrator does not collect or process personal data
                    from minors, including children. Access to the site is from
                    18 years of age, including registration and creating a
                    profile on the web interface.
                  </li>
                  <li>
                    We may process personal data entered when contacting you
                    (especially via the contact form) without your explicit
                    consent for the purpose of answering your question. In this
                    case, only your e-mail address and name are considered
                    personal data.
                  </li>
                  <li>
                    If a company (private individual) registers on the web
                    interface and will present multiple individuals on its
                    profile, it must have written consent to the processing of
                    personal data from all presented individuals and is
                    responsible for the personal data entered on our website;
                    we, as the administrator, only process it.
                  </li>
                  <li>
                    We are entitled to use your e-mail address without your
                    explicit consent based on our legitimate interest to send
                    you commercial communications regarding our own services.
                    You can refuse to receive commercial communications at any
                    time.
                  </li>
                  <li>
                    We may use your personal data for a purpose other than that
                    for which it was collected only with your consent.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  How long do we use the data for?
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  We use personal data entered during registration and profile
                  creation only for the duration of the valid registration. The
                  user can completely delete their entire profile at any time,
                  immediately after logging into their account, or they can
                  contact us (e-mail, phone) and we will delete the account,
                  including all personal data entered. The account deletion
                  process is irreversible.
                </p>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>⚖️</span>
              Your Rights in Relation to Personal Data
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Right to withdraw consent to the processing of personal data
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  If we process your personal data only on the basis of your
                  consent (i.e. without any other lawful reason), you can
                  withdraw this consent at any time.
                </p>
                <p className="text-gray-600 leading-relaxed mt-2">
                  You can withdraw your consent to the processing of your
                  personal data at any time, namely:
                </p>
                <ul className="space-y-1 text-gray-600 list-disc list-inside mt-2">
                  <li>via email sent to our contact email address;</li>
                  <li>by phone on our contact phone number;</li>
                  <li>in writing by letter sent to our delivery address;</li>
                  <li>
                    for the relevant cookies – in the web interface settings or
                    in the settings of your internet browser;
                  </li>
                  <li>
                    in the case of commercial communications – in the manner
                    specified in each e-mail containing commercial
                    communications (by clicking on the unsubscribe link or in
                    another manner).
                  </li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-2">
                  The withdrawal of consent does not affect the lawfulness of
                  data processing carried out until the withdrawal of consent to
                  processing.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Right to access personal data
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  You have the right to ask us for information about whether we
                  are processing your personal data. If we are processing your
                  data, you have the right to access this personal data and in
                  particular the following information:
                </p>
                <ul className="space-y-1 text-gray-600 list-disc list-inside mt-2">
                  <li>purpose of processing;</li>
                  <li>the categories of personal data processed;</li>
                  <li>
                    the recipients or categories of recipients to whom the
                    personal data will be disclosed;
                  </li>
                  <li>the period for which personal data will be stored.</li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-2">
                  We will provide you with a copy of the data we process upon
                  your request. For additional copies, we may charge you an
                  administrative fee not exceeding the costs associated with
                  making and providing such additional copies.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Right to correction
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  If your personal data is inaccurate or incomplete, you have
                  the right to request immediate rectification, i.e. correction
                  of inaccurate data and/or completion of incomplete data.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Right to object to processing
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  You have the right to object at any time to the processing of
                  your personal data, if we process them for direct marketing
                  purposes, including any automated processing of personal data.
                  After you have objected, we will no longer process your
                  personal data for these purposes.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Right to erasure (&quot;right to be forgotten&quot;)
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  You have the right to request that we delete your personal
                  data if:
                </p>
                <ul className="space-y-1 text-gray-600 list-disc list-inside mt-2">
                  <li>
                    the personal data are no longer necessary for the purposes
                    for which they were collected or processed;
                  </li>
                  <li>you have withdrawn your consent to the processing;</li>
                  <li>you have objected to the processing of personal data;</li>
                  <li>personal data was processed unlawfully.</li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-2">
                  Unless there are legal grounds for refusing deletion, we are
                  obliged to comply with your request.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Right to restriction of processing
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  You have the right to request that we restrict the processing
                  of your personal data if:
                </p>
                <ul className="space-y-1 text-gray-600 list-disc list-inside mt-2">
                  <li>you dispute the accuracy of your personal data;</li>
                  <li>
                    the processing is unlawful and you request restriction of
                    processing of personal data instead of erasure;
                  </li>
                  <li>
                    we no longer need your personal data for the purposes of
                    processing, but you require it for the establishment,
                    exercise or defence of legal claims;
                  </li>
                  <li>you object to the processing.</li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-2">
                  When processing is restricted, we are only entitled to store
                  your personal data; further processing is only possible with
                  your consent or for legal reasons.
                </p>
                <p className="text-gray-600 leading-relaxed mt-2">
                  If the processing of personal data is restricted due to an
                  objection to the processing, the restriction lasts for the
                  period necessary to determine whether we are obliged to comply
                  with your objection.
                </p>
                <p className="text-gray-600 leading-relaxed mt-2">
                  If the processing of personal data is restricted due to a
                  dispute over the accuracy of the data, the restriction lasts
                  for the duration of the verification of the accuracy of the
                  data.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Right to data portability
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  You have the right to receive your personal data, which you
                  have provided to us, in a structured, commonly used and
                  machine-readable format and to transmit it to another personal
                  data controller.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  How can you exercise your rights?
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  You can exercise your rights in relation to personal data via
                  our contact details. All information and actions will be
                  provided to you without undue delay.
                </p>
                <p className="text-gray-600 leading-relaxed mt-2">
                  We will do our utmost to protect your personal data. However,
                  if you are not satisfied with the handling, you have the right
                  to contact the relevant authorities, in particular the Office
                  for Personal Data Protection (
                  <a
                    href="http://www.uoou.cz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    http://www.uoou.cz
                  </a>
                  ), which supervises the protection of personal data. This
                  provision does not affect your right to contact the Office for
                  Personal Data Protection directly with your complaint.
                </p>
                <p className="text-gray-600 leading-relaxed mt-2">
                  In particular, if your place of residence, place of employment
                  or place of alleged personal data protection violation is
                  located outside the Czech Republic in another Member State of
                  the European Union, you can contact the competent supervisory
                  authority in that Member State.
                </p>
              </div>
            </div>
          </section>

          {/* Management and Processing */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>🔐</span>
              Management and Processing of Personal Data
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Who processes your personal data?
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  We are a personal data controller within the meaning of the
                  regulation.
                </p>
                <p className="text-gray-600 leading-relaxed mt-2">
                  To the extent necessary to fulfill other obligations, we are
                  authorized to transfer your personal data to other persons,
                  such as cloud storage providers, email campaign administrators
                  or other persons involved in fulfilling our obligations. We
                  may also authorize other processors and recipients of personal
                  data. We will also inform you on the basis of your inquiry who
                  specifically processes your personal data.
                </p>
                <p className="text-gray-600 leading-relaxed mt-2">
                  Your personal data will not be transferred to countries
                  outside the European Union, unless this is necessary for the
                  performance of a contract or for another reason in accordance
                  with the rules for such transfer set out in the regulation.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  How do we process personal data?
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Personal and other collected data are fully secured against
                  misuse. Personal data will be processed in electronic form in
                  an automated manner or in printed form in a non-automated
                  manner.
                </p>
              </div>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>🍪</span>
              Cookies
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  What are cookies?
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Cookies are text files stored on the computer or other
                  electronic device of each visitor to the web interface, which
                  enable the web interface to function.
                </p>
                <p className="text-gray-600 leading-relaxed mt-2">
                  Not all cookies collect personal data; some only allow the
                  website interface to function properly. You can refuse the use
                  of cookies by selecting the appropriate settings in your
                  internet browser.
                </p>
                <p className="text-gray-600 leading-relaxed mt-2">
                  Please note that if you refuse the use of cookies, you may not
                  be able to fully use all the functions of the web interface.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  What cookies and for what purposes does the web interface use
                  them?
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  The web interface uses{" "}
                  <span className="font-medium">
                    session (temporary) cookies
                  </span>
                  , which are automatically deleted after you finish browsing
                  the web interface. It also uses{" "}
                  <span className="font-medium">persistent cookies</span>, which
                  remain on your device until they expire or until you delete
                  them.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  The cookies used by the web interface are as follows:
                </h3>
                <ul className="space-y-3 text-gray-600 list-disc list-inside">
                  <li>
                    <span className="font-medium">First-party cookies</span> –
                    these cookies are assigned to the domain of our website;
                    these are necessary cookies and performance cookies that we
                    use for the conclusion and performance of the contract (in
                    particular necessary cookies), or based on the consent
                    mentioned above. These cookies can be temporary or
                    permanent;
                  </li>
                  <li>
                    <span className="font-medium">essential cookies</span> –
                    enable navigation on the web interface and use of basic
                    functions, they usually do not identify you in any way and
                    are not personal data;
                  </li>
                  <li>
                    <span className="font-medium">performance cookies</span> –
                    used to analyze how the web interface is used (number of
                    visits, time spent on the web interface, etc.); data
                    obtained by these cookies is usually anonymous, these
                    cookies are collected based on your consent (which you grant
                    in the relevant bar located on the web interface, and
                    without this consent these cookies cannot be collected);
                  </li>
                  <li>
                    <span className="font-medium">third-party cookies</span> –
                    these cookies are assigned to a domain other than the domain
                    of our website, even when you are on our website; these
                    cookies, based on your consent (which you grant in the
                    relevant bar located on the web interface, without which it
                    is not possible to collect these cookies), allow us in
                    particular to analyze our website and display tailored
                    advertising for you; these are functional cookies and
                    targeted and advertising cookies;
                  </li>
                  <li>
                    <span className="font-medium">functional cookies</span> –
                    used to personalize content by remembering login details,
                    geolocation, etc.; they may be used to obtain and process
                    personal data;
                  </li>
                  <li>
                    <span className="font-medium">
                      Targeted and advertising cookies
                    </span>{" "}
                    – used to display targeted advertisements on and off the web
                    interface; they may collect and process personal data. We
                    may also share information about how you use our website
                    with our social media, advertising and analytics partners.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Services used that work with cookies
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  The web interface uses the Google Analytics service and
                  possibly other services provided by Google LLC (hereinafter
                  referred to as &quot;Google&quot;), the Facebook Pixel service
                  provided by Facebook Inc. and the Sklik service provided by
                  Seznam.cz, as. These services work with information obtained
                  through cookies.
                </p>
                <p className="text-gray-600 leading-relaxed mt-2">
                  Google Analytics is used to obtain statistical information
                  about your use of the web interface. Cookies obtained by this
                  service expire, depending on your browser settings, after a
                  maximum of 2 years, or until they are manually deleted by you.
                </p>
                <p className="text-gray-600 leading-relaxed mt-2">
                  If you are interested in how Google uses the data it collects
                  from us and how to modify or opt-out of the processing, you
                  can learn this information by clicking on the following link:{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    How Google uses data when you use our partners' websites or
                    apps
                  </a>
                  .
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  How to set and possibly refuse the processing of cookies
                </h3>
                <p className="text-gray-600 leading-relaxed mb-2">
                  Instructions on how to properly set up and manage the
                  processing of cookies in your internet browser can be found
                  here:
                </p>
                <ul className="space-y-1 text-gray-600 list-disc list-inside">
                  <li>
                    <a
                      href="https://support.google.com/accounts/answer/61416?hl=en"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Google Chrome
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://support.microsoft.com/cs-cz/help/17442/windows-internet-explorer-delete-manage-cookies"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Internet Explorer
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://support.microsoft.com/cs-cz/help/4468242/microsoft-edge-browsing-data-and-privacy-microsoft-privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Microsoft Edge
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://support.mozilla.org/cs/kb/vymazani-cookies-dat-stranek?redirectlocale=cs&redirectslug=vymazani-cookies"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Mozilla Firefox
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://help.opera.com/cs/latest/web-preferences/#cookies"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Opera
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://support.apple.com/cs-cz/guide/safari/sfri11471/mac"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Safari
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <p className="text-gray-500 text-sm">
                These Policies are valid and effective from{" "}
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
