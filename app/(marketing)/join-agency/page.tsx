import { Metadata } from "next";
import React from "react";
import PreserveParamsLink from "./_components/PreserveParamsLink";
import SectionCard from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import AgencyDashboardMockup from "./_components/AgencyDashboardMockup";
import FaqAccordion from "./_components/FaqAccordion";
import TrackedSection from "./_components/TrackedSection";
import {
  AGENCY_CTA_LOCATIONS,
  AGENCY_EVENTS,
  AGENCY_OFFER,
  AGENCY_ROUTES,
} from "./constants";
import {
  ArrowRight,
  CheckCircle2,
  Users,
  Search,
  TrendingUp,
  Settings,
  BarChart3,
  ShieldCheck,
  Globe,
  Lock,
  AlertTriangle,
  FileText,
  Eye,
  Zap,
  Target,
  Building2,
  ChevronDown,
  Star,
  CreditCard,
} from "lucide-react";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: "Join KenyaDesires as an Agency | Grow Your Agency",
  description:
    "Create a KenyaDesires agency account, manage multiple provider profiles, increase visibility and create more opportunities to grow your agency and earning potential.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Join KenyaDesires as an Agency | Grow Your Agency",
    description:
      "Create a KenyaDesires agency account, manage multiple provider profiles, increase visibility and create more opportunities to grow your agency and earning potential.",
    type: "website",
    locale: "en_KE",
    url: "https://kenyadesires.xyz/join-agency",
    siteName: "KenyaDesires",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "KenyaDesires Agency Landing",
      },
    ],
  },
};

const page = () => {
  const faqs = [
    {
      question: "What is a KenyaDesires agency account?",
      answer:
        "An agency account is designed for businesses or teams managing multiple provider profiles on KenyaDesires. It provides a centralized way to manage your portfolio from one account.",
    },
    {
      question: "Can I manage multiple profiles?",
      answer:
        "Yes, agency accounts are designed around managing multiple profiles. Agency accounts include profile management features to help you organize and maintain your portfolio.",
    },
    {
      question: "Can a small agency join?",
      answer:
        "Yes. Agencies can start with their initial portfolio and grow as their business develops. Whether you are managing a few profiles or building a larger agency, KenyaDesires provides a platform to support your growth.",
    },
    {
      question: "How can KenyaDesires help my agency earn more?",
      answer:
        "KenyaDesires can help agencies establish an online presence, manage multiple profiles and create opportunities to reach potential customers. Increased visibility and portfolio growth may increase earning potential, but earnings are not guaranteed.",
    },
    {
      question: "Do agencies need verification?",
      answer:
        "Agencies should follow the platform's verification process where required. Verification helps establish a trusted presence on the platform.",
    },
    {
      question: "How do I add profiles?",
      answer:
        "After completing the required agency setup, agencies can use the agency dashboard to add and manage profiles.",
    },
    {
      question: "Is creating an agency account free?",
      answer:
        "Creating an agency account is free. Additional platform features and services may have associated costs.",
    },
    {
      question: "How do I get started?",
      answer:
        "Click Create Agency Account, complete registration, complete any required verification and add your first profile.",
    },
  ];

  return (
    <TrackedSection events={[AGENCY_EVENTS.LANDING_VIEW]}>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <SectionCard className="pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Grow Your Agency's Online Presence.{" "}
                <span className="text-primary">Manage Multiple Profiles.</span>
              </h1>
              <p className="text-lg md:text-xl text-white/70 mb-8 leading-relaxed">
                Manage multiple profiles from one KenyaDesires agency account.
                Build your portfolio, improve your online presence and create
                more opportunities to grow your agency and increase your earning
                potential.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  asChild
                  size="lg"
                  className="h-14 px-8 text-lg font-semibold rounded-md"
                >
                  <PreserveParamsLink
                    href={AGENCY_ROUTES.REGISTER}
                    trackEvent={AGENCY_EVENTS.CTA_CLICK}
                    trackEventProperties={{
                      cta_location: AGENCY_CTA_LOCATIONS.HERO,
                      cta_text: "JOIN AS AN AGENCY",
                    }}
                  >
                    JOIN AS AN AGENCY
                    <ArrowRight className="ml-2 size-5" />
                  </PreserveParamsLink>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="h-14 px-8 text-lg font-semibold rounded-md border border-white/20 text-white bg-white/5 hover:bg-white/10"
                >
                  <PreserveParamsLink
                    href="#how-it-works"
                    trackEvent={AGENCY_EVENTS.HOW_IT_WORKS_CLICK}
                    trackEventProperties={{
                      cta_location: AGENCY_CTA_LOCATIONS.HERO,
                      cta_text: "LEARN HOW IT WORKS",
                    }}
                  >
                    LEARN HOW IT WORKS
                  </PreserveParamsLink>
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/60">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" />
                  Multiple profiles
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" />
                  Centralized management
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" />
                  Profile verification
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" />
                  Portfolio growth
                </span>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <AgencyDashboardMockup />
            </div>
          </div>
        </SectionCard>
      </section>

      {/* Trust / Value Strip */}
      <section className="bg-black/40">
        <SectionCard className="py-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Built for Agencies</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/70">
            {[
              "Multiple Profile Management",
              "Centralized Account",
              "Profile Verification",
              "Portfolio Growth",
              "Increased Visibility",
              "More Business Opportunities",
            ].map((item, index) => (
              <span
                key={index}
                className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2"
              >
                <CheckCircle2 className="size-4 text-primary" />
                {item}
              </span>
            ))}
          </div>
        </SectionCard>
      </section>

      {/* Problem Section */}
      <section className="bg-dark-slate">
        <SectionCard className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Managing Multiple Profiles Shouldn't Hold Your Agency Back
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Common challenges agencies face when managing multiple provider
              profiles.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Users,
                title: "Multiple Profiles",
                description:
                  "Managing several profiles individually can become difficult and time-consuming.",
              },
              {
                icon: Search,
                title: "Limited Visibility",
                description:
                  "Profiles need a dedicated online presence where potential customers can discover them.",
              },
              {
                icon: Settings,
                title: "Manual Management",
                description:
                  "Agencies need a simpler way to organize and maintain their portfolio.",
              },
              {
                icon: TrendingUp,
                title: "Growth Challenges",
                description:
                  "As an agency grows, managing more profiles requires a scalable workflow.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:border-primary/50 transition-colors duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="size-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      {/* Agency Benefits */}
      <section className="bg-black/40">
        <SectionCard className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything Your Agency Needs to Grow
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Tools and features designed to help agencies manage their portfolio
              and grow their business.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: "Manage Multiple Profiles",
                description:
                  "Manage your provider portfolio from a centralized agency account.",
              },
              {
                icon: Globe,
                title: "Increase Visibility",
                description:
                  "Give your agency profiles a dedicated presence on KenyaDesires.",
              },
              {
                icon: Target,
                title: "Reach More Potential Customers",
                description:
                  "Make your profiles easier for relevant visitors to discover.",
              },
              {
                icon: TrendingUp,
                title: "Grow Your Portfolio",
                description:
                  "Build and manage an expanding collection of profiles.",
              },
              {
                icon: BarChart3,
                title: "Increase Earning Potential",
                description:
                  "A larger, well-managed and visible portfolio can create more opportunities to generate business and increase your agency's earning potential.",
              },
              {
                icon: Settings,
                title: "Centralized Management",
                description:
                  "Keep your agency activity organized from one account.",
              },
            ].map((benefit, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-primary/50 transition-colors duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <benefit.icon className="size-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      {/* Earning Potential Section */}
      <section className="bg-dark-slate relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 pointer-events-none" />
        <SectionCard className="py-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <TrendingUp className="size-4" />
              Business Growth
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Grow Your Portfolio. Increase Your Earning Potential.
            </h2>
            <p className="text-white/70 mb-8 max-w-2xl mx-auto leading-relaxed">
              Your agency's growth depends on the opportunities you create.
              KenyaDesires helps you establish a professional online presence,
              manage your portfolio and make your profiles discoverable to
              potential customers. As your portfolio grows and your profiles gain
              visibility, you can create more opportunities to generate business
              and increase your earning potential.
            </p>
            <div className="grid sm:grid-cols-3 gap-6 mb-10">
              {[
                {
                  icon: Users,
                  title: "More Profiles",
                  description:
                    "Build a larger portfolio and create more opportunities for your agency.",
                },
                {
                  icon: Globe,
                  title: "More Visibility",
                  description:
                    "Give your profiles a dedicated presence where potential customers can discover them.",
                },
                {
                  icon: Zap,
                  title: "More Opportunities",
                  description:
                    "A well-managed and visible portfolio can help create additional opportunities for your business.",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-white/5 border border-white/10 rounded-xl p-6 text-center"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="size-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
            <Button
              asChild
              size="lg"
              className="h-14 px-10 text-lg font-semibold rounded-md"
            >
              <PreserveParamsLink
                href={AGENCY_ROUTES.REGISTER}
                trackEvent={AGENCY_EVENTS.CTA_CLICK}
                trackEventProperties={{
                  cta_location: AGENCY_CTA_LOCATIONS.EARNING_POTENTIAL,
                  cta_text: "Start Growing Your Agency",
                }}
              >
                Start Growing Your Agency
                <ArrowRight className="ml-2 size-5" />
              </PreserveParamsLink>
            </Button>
          </div>
        </SectionCard>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-black/40">
        <SectionCard className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start Growing Your Agency in 3 Simple Steps
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              From registration to managing your first profile, the process is
              designed to be straightforward.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create Your Agency Account",
                description:
                  "Register your agency and provide the required information.",
              },
              {
                step: "02",
                title: "Complete Verification",
                description:
                  "Complete the applicable agency verification process.",
              },
              {
                step: "03",
                title: "Add Your Profiles",
                description:
                  "Start creating and managing provider profiles from your agency account.",
              },
            ].map((item, index) => (
              <div key={index} className="relative text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-primary">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {item.description}
                </p>
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-white/10" />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button
              asChild
              size="lg"
              className="h-14 px-10 text-lg font-semibold rounded-md"
            >
              <PreserveParamsLink
                href={AGENCY_ROUTES.REGISTER}
                trackEvent={AGENCY_EVENTS.CTA_CLICK}
                trackEventProperties={{
                  cta_location: AGENCY_CTA_LOCATIONS.HOW_IT_WORKS,
                  cta_text: "Create Agency Account",
                }}
              >
                Create Agency Account
                <ArrowRight className="ml-2 size-5" />
              </PreserveParamsLink>
            </Button>
          </div>
        </SectionCard>
      </section>

      {/* Agency Growth Journey */}
      <section className="bg-dark-slate">
        <SectionCard className="py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start Small. Build Your Portfolio. Grow Your Agency.
            </h2>
            <p className="text-white/70 mb-10 leading-relaxed">
              Whether you're managing a few profiles or building a larger agency
              portfolio, KenyaDesires gives you a centralized place to manage
              your presence and create opportunities for growth.
            </p>
            <div className="flex flex-col items-center gap-2 text-sm">
              {[
                "Create Agency Account",
                "Add Your First Profile",
                "Build Your Portfolio",
                "Increase Visibility",
                "Reach More Potential Customers",
                "Create More Business Opportunities",
                "Increase Earning Potential",
              ].map((step, index, arr) => (
                <React.Fragment key={index}>
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-5 py-3 w-full max-w-md">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <span className="text-white/80 text-left">{step}</span>
                  </div>
                  {index < arr.length - 1 && (
                    <ChevronDown className="size-5 text-primary/60" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </SectionCard>
      </section>

      {/* Dashboard Preview */}
      <section className="bg-black/40">
        <SectionCard className="py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Agency Dashboard Preview
              </h2>
              <p className="text-white/70 mb-6 leading-relaxed">
                Manage your entire agency portfolio from one centralized
                dashboard. Monitor profile status, track verification progress
                and keep your agency presence current.
              </p>
              <ul className="space-y-3">
                {[
                  "Centralized portfolio management",
                  "Profile status and verification tracking",
                  "Add and edit profiles from one place",
                  "Portfolio overview and metrics",
                ].map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-white/70"
                  >
                    <CheckCircle2 className="size-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 lg:order-2 flex justify-center">
              <AgencyDashboardMockup />
            </div>
          </div>
        </SectionCard>
      </section>

      {/* Why KenyaDesires */}
      <section className="bg-dark-slate">
        <SectionCard className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for the Kenyan Market
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              A platform designed around the needs of Kenyan agencies and the
              local marketplace.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Globe,
                title: "Kenya-Focused",
                description:
                  "Designed around the Kenyan marketplace and local audience.",
              },
              {
                icon: Search,
                title: "Local Discovery",
                description:
                  "Help profiles become discoverable to visitors browsing the platform.",
              },
              {
                icon: Settings,
                title: "Centralized Management",
                description:
                  "Manage your agency presence and profile portfolio from one account.",
              },
              {
                icon: TrendingUp,
                title: "Growth-Oriented",
                description:
                  "Build your portfolio, improve visibility and create more opportunities for business growth.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:border-primary/50 transition-colors duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="size-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      {/* Agency Growth Personas */}
      <section className="bg-black/40">
        <SectionCard className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Wherever You Are, We Can Help You Grow
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Whether you are just starting or scaling operations, KenyaDesires
              supports agencies at every stage.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: Building2,
                title: "Small Agency",
                subtitle: "Getting Started",
                description:
                  "Start building your agency's online presence and manage your first profiles.",
                cta: "Get Started",
              },
              {
                icon: TrendingUp,
                title: "Growing Agency",
                subtitle: "Building a Portfolio",
                description:
                  "Manage an expanding portfolio and create more opportunities for your agency.",
                cta: "Grow Your Portfolio",
              },
              {
                icon: BarChart3,
                title: "Established Agency",
                subtitle: "Scaling Operations",
                description:
                  "Organize and manage a larger portfolio through a centralized agency presence.",
                cta: "Scale Your Agency",
              },
            ].map((persona, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-primary/50 transition-colors duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <persona.icon className="size-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-1">{persona.title}</h3>
                <p className="text-primary text-sm font-medium mb-3">
                  {persona.subtitle}
                </p>
                <p className="text-white/60 text-sm leading-relaxed mb-4">
                  {persona.description}
                </p>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full border border-white/20 text-white bg-white/5 hover:bg-white/10"
                >
                  <PreserveParamsLink
                    href={AGENCY_ROUTES.REGISTER}
                    trackEvent={AGENCY_EVENTS.CTA_CLICK}
                    trackEventProperties={{
                      cta_location: AGENCY_CTA_LOCATIONS.BENEFITS,
                      cta_text: persona.cta,
                    }}
                  >
                    {persona.cta}
                  </PreserveParamsLink>
                </Button>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      {/* Verification & Trust */}
      <section className="bg-dark-slate">
        <SectionCard className="py-16">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Build a More Trusted Agency Presence
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                Trust and transparency are important for agencies operating on
                KenyaDesires.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 mb-10">
              {[
                {
                  icon: ShieldCheck,
                  title: "Accurate Information",
                  description:
                    "Provide accurate agency information to help build trust with platform visitors.",
                },
                {
                  icon: Lock,
                  title: "Account Security",
                  description:
                    "Protect your agency account with strong credentials and secure practices.",
                },
                {
                  icon: FileText,
                  title: "Responsible Use",
                  description:
                    "Use the platform responsibly and in accordance with platform rules and applicable laws.",
                },
                {
                  icon: Eye,
                  title: "Profile Accuracy",
                  description:
                    "Maintain accurate and up-to-date profile information across your portfolio.",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl p-6"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="size-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                    <p className="text-white/60 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <PreserveParamsLink
                href={AGENCY_ROUTES.TERMS}
                className="text-primary hover:underline"
              >
                Terms of Service
              </PreserveParamsLink>
              <PreserveParamsLink
                href={AGENCY_ROUTES.PRIVACY}
                className="text-primary hover:underline"
              >
                Privacy Policy
              </PreserveParamsLink>
              <PreserveParamsLink
                href={AGENCY_ROUTES.SAFETY}
                className="text-primary hover:underline"
              >
                Safety Guidelines
              </PreserveParamsLink>
            </div>
          </div>
        </SectionCard>
      </section>

      {/* FAQ */}
      <section className="bg-black/40">
        <SectionCard className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Everything you need to know about creating a KenyaDesires agency
              account.
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <FaqAccordion items={faqs} />
          </div>
        </SectionCard>
      </section>

      {/* Final CTA */}
      <section className="bg-dark-slate relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
        <SectionCard className="py-20 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Ready to Grow Your Agency and Increase Your Earning Potential?
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto text-lg">
            Create your KenyaDesires agency account, build your profile portfolio
            and start creating more opportunities for your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="h-14 px-10 text-lg font-semibold rounded-md"
            >
              <PreserveParamsLink
                href={AGENCY_ROUTES.REGISTER}
                trackEvent={AGENCY_EVENTS.CTA_CLICK}
                trackEventProperties={{
                  cta_location: AGENCY_CTA_LOCATIONS.FINAL_CTA,
                  cta_text: "Create Agency Account",
                }}
              >
                Create Agency Account
                <ArrowRight className="ml-2 size-5" />
              </PreserveParamsLink>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="h-14 px-10 text-lg font-semibold rounded-md text-white hover:bg-white/10"
            >
              <PreserveParamsLink
                href={AGENCY_ROUTES.LOGIN}
                trackEvent={AGENCY_EVENTS.CTA_CLICK}
                trackEventProperties={{
                  cta_location: AGENCY_CTA_LOCATIONS.FINAL_CTA,
                  cta_text: "Already Have an Account? Log In",
                }}
              >
                Already Have an Account? Log In
              </PreserveParamsLink>
            </Button>
          </div>
        </SectionCard>
      </section>
    </TrackedSection>
  );
};

export default page;
