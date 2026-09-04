import { Metadata } from "next";
import PreserveParamsLink from "./_components/PreserveParamsLink";
import SectionCard from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import ProfileCardMockup from "./_components/ProfileCardMockup";
import FaqAccordion from "./_components/FaqAccordion";
import TrackedSection from "./_components/TrackedSection";
import TrackingWrapper from "./_components/TrackingWrapper";
import { PROVIDER_EVENTS, PROVIDER_OFFER, PROVIDER_ROUTES } from "./constants";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  ShieldCheck,
  Settings,
  UserPlus,
  Search,
  Lock,
  AlertTriangle,
  FileText,
  Share2,
  Globe,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Join KenyaDesires as a Provider | Get Discovered & Grow Your Opportunities",
  description:
    "Create your KenyaDesires provider profile, increase your visibility, reach more potential customers and create more opportunities to grow your earning potential.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Join KenyaDesires as a Provider | Get Discovered & Grow Your Opportunities",
    description:
      "Create your KenyaDesires provider profile, increase your visibility, reach more potential customers and create more opportunities to grow your earning potential.",
    type: "website",
    locale: "en_KE",
    url: "https://kenyadesires.com/join-provider",
    siteName: "KenyaDesires",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "KenyaDesires Provider Landing",
      },
    ],
  },
};

const page = () => {
  const faqs = [
    {
      question: "What is KenyaDesires?",
      answer:
        "KenyaDesires is a Kenya-focused online profile marketplace. It provides a platform where adults can create and manage professional profiles.",
    },
    {
      question: "How do I create a profile?",
      answer:
        "Register using the platform signup process, complete your profile information, follow the verification process where required, and once approved, your profile can become available on the marketplace according to platform requirements.",
    },
    {
      question: "Do I need to verify my profile?",
      answer:
        "Verification requirements vary. Follow the platform's verification process where required to establish a verified profile where applicable.",
    },
    {
      question: "What are credits?",
      answer:
        "Credits are platform credits used for supported features on KenyaDesires. 1 credit currently equals KSh 10 in platform value.",
    },
    {
      question: "How do I receive the welcome credits?",
      answer:
        "Create your profile and receive 50 credits. Complete verification and receive an additional 100 credits. Total: 150 credits. Eligibility, verification requirements, credit usage and promotional terms apply.",
    },
    {
      question: "Can I edit my profile later?",
      answer:
        "Yes. Once registered, you can update your profile information and keep your marketplace presence current through your account.",
    },
    {
      question: "How do I keep my account secure?",
      answer:
        "Protect your login credentials, avoid sharing your password, and only publish information you are comfortable sharing on your profile.",
    },
    {
      question: "How can I contact support?",
      answer:
        "You can reach the KenyaDesires support team through the contact page on the website.",
    },
    {
      question: "Can KenyaDesires help me earn more?",
      answer:
        "KenyaDesires can help you build an online presence, increase your visibility and create opportunities to reach potential customers. Greater visibility may create more opportunities to earn, but earnings and customer activity are not guaranteed.",
    },
  ];

  return (
    <TrackingWrapper>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <SectionCard className="pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Get Discovered.{" "}
                <span className="text-primary">Grow Your Opportunities</span>.
                Earn More.
              </h1>
              <p className="text-lg md:text-xl text-white/70 mb-8 leading-relaxed">
                Create your KenyaDesires profile, increase your visibility and
                reach more potential customers. Build your online presence and
                create more opportunities to increase your earning potential.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  asChild
                  size="lg"
                  className="h-14 px-8 text-lg font-semibold rounded-md"
                >
                  <PreserveParamsLink
                    href={PROVIDER_ROUTES.REGISTER}
                    trackEvent={PROVIDER_EVENTS.CLICK_CREATE_PROFILE}
                  >
                    Create Your Profile
                    <ArrowRight className="ml-2 size-5" />
                  </PreserveParamsLink>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="h-14 px-8 text-lg font-semibold rounded-md border hover:text-primary border-white/20 text-white bg-white/5 hover:bg-white/10"
                >
                  <PreserveParamsLink
                    href="#how-it-works"
                    trackEvent={PROVIDER_EVENTS.VIEW_HOW_IT_WORKS}
                  >
                    See How It Works
                  </PreserveParamsLink>
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/60">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" />
                  Simple setup
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" />
                  Profile management
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" />
                  Verification
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" />
                  Mobile friendly
                </span>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <ProfileCardMockup />
            </div>
          </div>
        </SectionCard>
      </section>

      {/* Value Proposition */}
      <section className="bg-black/40">
        <SectionCard className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Build Your Profile
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Create, manage, and grow your presence on KenyaDesires with the
              tools designed for professionals.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: UserPlus,
                title: "Create Your Profile",
                description:
                  "Create a professional profile with the information you want visitors to see.",
              },
              {
                icon: Search,
                title: "Get Discovered",
                description:
                  "Make your profile available to people browsing the KenyaDesires marketplace.",
              },
              {
                icon: ShieldCheck,
                title: "Verification",
                description:
                  "Complete the platform's verification process to establish a verified profile where applicable.",
              },
              {
                icon: Settings,
                title: "Manage Your Profile",
                description:
                  "Update your profile information and keep your marketplace presence current.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-primary/50 transition-colors duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="size-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-dark-slate">
        <SectionCard className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get Started in Four Simple Steps
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              From registration to going live, the process is designed to be
              straightforward.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Create Your Account",
                description: "Register using the platform's signup process.",
              },
              {
                step: "02",
                title: "Complete Your Profile",
                description:
                  "Add your profile information and relevant details.",
              },
              {
                step: "03",
                title: "Complete Verification",
                description:
                  "Follow the platform's verification process where required.",
              },
              {
                step: "04",
                title: "Go Live",
                description:
                  "Once approved, your profile can become available on the marketplace according to platform requirements.",
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
                {index < 3 && (
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
              <PreserveParamsLink href={PROVIDER_ROUTES.REGISTER}>
                Start Creating My Profile
                <ArrowRight className="ml-2 size-5" />
              </PreserveParamsLink>
            </Button>
          </div>
        </SectionCard>
      </section>

      {/* Provider Benefits */}
      <section className="bg-black/40">
        <SectionCard className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Create a KenyaDesires Profile?
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Building a dedicated presence gives you control and
              professionalism.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Globe,
                title: "Professional Online Presence",
                description:
                  "Create a dedicated profile that represents you professionally.",
              },
              {
                icon: Search,
                title: "Local Discovery",
                description:
                  "Make your profile discoverable to people browsing KenyaDesires in Kenya.",
              },
              {
                icon: Eye,
                title: "Increased Visibility",
                description:
                  "Build a stronger online presence and improve your chances of being discovered.",
              },
              {
                icon: Settings,
                title: "Profile Management",
                description:
                  "Keep your information, photos and profile details up to date.",
              },
              {
                icon: Users,
                title: "More Opportunities",
                description:
                  "Create additional opportunities to connect with potential customers.",
              },
              {
                icon: TrendingUp,
                title: "Increased Earning Potential",
                description:
                  "Use your visibility and online presence to create more opportunities to grow your earnings.",
              },
              {
                icon: ShieldCheck,
                title: "Verification",
                description:
                  "Where applicable, verification can help communicate account status clearly.",
              },
              {
                icon: Share2,
                title: "Shareable Profile",
                description:
                  "Allow your profile to be shared using the platform's supported sharing functionality.",
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

      {/* Earning Potential */}
      <TrackedSection
        events={[PROVIDER_EVENTS.EARNING_SECTION_VIEW]}
      >
        <section className="bg-black/40">
          <SectionCard className="py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                More Visibility. More Opportunities. More Earning Potential.
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                Your profile is your opportunity to be discovered. KenyaDesires
                helps you build a professional online presence where potential
                customers can find and learn more about you. The more effectively
                you present and manage your profile, the more opportunities you
                can create to grow your earnings.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Search,
                  title: "Get Discovered",
                  description:
                    "Create a profile that can be discovered by people browsing KenyaDesires.",
                },
                {
                  icon: Eye,
                  title: "Increase Your Visibility",
                  description:
                    "Build a stronger online presence and make it easier for potential customers to discover you.",
                },
                {
                  icon: TrendingUp,
                  title: "Create More Earning Opportunities",
                  description:
                    "Greater visibility can create more opportunities to connect with potential customers and increase your earning potential.",
                },
              ].map((card, index) => (
                <div
                  key={index}
                  className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-primary/50 transition-colors duration-300"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <card.icon className="size-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {card.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Button
                asChild
                size="lg"
                className="h-14 px-10 text-lg font-semibold rounded-md"
              >
                <PreserveParamsLink
                  href={PROVIDER_ROUTES.REGISTER}
                  trackEvent={PROVIDER_EVENTS.EARNING_CTA_CLICK}
                  trackEventProperties={{ cta_location: "earning_potential" }}
                >
                  Create My Profile
                  <ArrowRight className="ml-2 size-5" />
                </PreserveParamsLink>
              </Button>
            </div>
          </SectionCard>
        </section>
      </TrackedSection>

      {/* Provider Growth Journey */}
      <section className="bg-dark-slate">
        <SectionCard className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Turn Your Profile Into More Opportunities
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              A complete and well-managed profile gives you a stronger foundation for being discovered. Build your presence on KenyaDesires and create more opportunities to grow your income.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { step: "01", title: "Create Your Profile", description: "Register and set up your basic profile on KenyaDesires." },
              { step: "02", title: "Complete Your Profile", description: "Add detailed information, photos and preferences to showcase what you offer." },
              { step: "03", title: "Increase Your Visibility", description: "A complete profile helps you stand out and be discovered more easily." },
              { step: "04", title: "Get Discovered", description: "People browsing KenyaDesires can find and learn about your profile." },
              { step: "05", title: "Reach More Customers", description: "Greater visibility means more people can discover and connect with you." },
              { step: "06", title: "Create More Opportunities", description: "More connections can lead to additional opportunities to engage with customers." },
              { step: "07", title: "Increase Your Earning Potential", description: "More opportunities may help you grow your presence and earnings on the platform." },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center mx-auto mb-3">
                  <span className="text-sm font-bold text-primary">{item.step}</span>
                </div>
                <h3 className="text-base font-semibold mb-1">{item.title}</h3>
                <p className="text-white/60 text-xs leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      {/* Welcome Offer */}
      <TrackedSection>
        <section className="bg-dark-slate relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 pointer-events-none" />
          <SectionCard className="py-16">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Star className="size-4" />
                Limited Welcome Offer
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Start With 150 Credits
              </h2>
              <p className="text-white/70 mb-8 max-w-xl mx-auto">
                Create your profile and receive 50 credits. Complete
                verification and receive an additional 100 credits.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-8 max-w-lg mx-auto">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-2xl font-bold text-primary">50</p>
                  <p className="text-xs text-white/60 mt-1">Profile creation</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-2xl font-bold text-primary">+100</p>
                  <p className="text-xs text-white/60 mt-1">
                    After verification
                  </p>
                </div>
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
                  <p className="text-2xl font-bold text-primary">150</p>
                  <p className="text-xs text-white/60 mt-1">Total credits</p>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                <p className="text-white/80 text-sm mb-2">
                  <span className="font-semibold text-white">
                    Platform value:
                  </span>{" "}
                  KSh 1,500
                </p>
                <p className="text-white/50 text-xs">
                  1 credit = KSh 10 in platform value
                </p>
              </div>
              <p className="text-white/40 text-xs mb-8 max-w-md mx-auto">
                Eligibility, verification requirements, credit usage and
                promotional terms apply. Credits are platform credits and are
                not cash. Offer terms are subject to change.
              </p>
              <Button
                asChild
                size="lg"
                className="h-14 px-10 text-lg font-semibold rounded-md"
              >
                <PreserveParamsLink href={PROVIDER_ROUTES.REGISTER}>
                  Claim Your Credits
                  <ArrowRight className="ml-2 size-5" />
                </PreserveParamsLink>
              </Button>
            </div>
          </SectionCard>
        </section>
      </TrackedSection>

      {/* Profile Preview */}
      <section className="bg-black/40">
        <SectionCard className="py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Your Profile, Your Presence
              </h2>
              <p className="text-white/70 mb-6 leading-relaxed">
                Create a profile that gives visitors a clear and professional
                way to discover your presence on KenyaDesires.
              </p>
              <ul className="space-y-3">
                {[
                  "Professional profile card with your preferred information",
                  "Verification status displayed to build trust",
                  "Profile completeness indicator to guide setup",
                  "Easy updates from your account dashboard",
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
              <ProfileCardMockup />
            </div>
          </div>
        </SectionCard>
      </section>

      {/* Safety & Privacy */}
      <section className="bg-dark-slate">
        <SectionCard className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Your Privacy Matters
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              We provide tools and guidance to help you manage your privacy and
              security.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              {
                icon: Lock,
                title: "Account Security",
                description:
                  "Protect your login credentials and use strong passwords.",
              },
              {
                icon: Eye,
                title: "Profile Control",
                description:
                  "Only publish information you are comfortable sharing.",
              },
              {
                icon: AlertTriangle,
                title: "Reporting",
                description:
                  "Report suspicious or inappropriate activity through the platform's supported channels.",
              },
              {
                icon: FileText,
                title: "Privacy",
                description:
                  "Avoid publishing sensitive personal information unnecessarily.",
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
          <div className="text-center">
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="h-12 px-8 font-semibold rounded-md border border-white/20 text-white bg-white/5 hover:bg-white/10"
            >
              <PreserveParamsLink
                href={PROVIDER_ROUTES.SAFETY}
                trackEvent={PROVIDER_EVENTS.VIEW_SAFETY}
              >
                Learn About Safety & Privacy
              </PreserveParamsLink>
            </Button>
          </div>
        </SectionCard>
      </section>

      {/* Who Can Join */}
      <section className="bg-black/40">
        <SectionCard className="py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Who Is KenyaDesires For?
            </h2>
            <p className="text-white/70 mb-8 leading-relaxed">
              KenyaDesires is intended for adults who are legally eligible to
              use the platform and want to create a profile on the marketplace.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 text-left">
              {[
                "Must be an adult",
                "Must provide accurate information",
                "Must comply with platform rules",
                "Must comply with applicable laws",
                "Must complete verification requirements where applicable",
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-5 py-4"
                >
                  <CheckCircle2 className="size-5 text-primary shrink-0" />
                  <span className="text-sm text-white/80">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </section>

      {/* FAQ */}
      <section className="bg-dark-slate">
        <SectionCard className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Everything you need to know about creating a profile on
              KenyaDesires.
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <FaqAccordion items={faqs} />
          </div>
        </SectionCard>
      </section>

      {/* Final CTA */}
      <section className="bg-black/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
        <SectionCard className="py-20 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Ready to Increase Your Visibility and Earning Potential?
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto text-lg">
            Create your KenyaDesires profile today and start building your online presence. Get discovered, reach more potential customers and create more opportunities to grow your earnings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="h-14 px-10 text-lg font-semibold rounded-md"
            >
              <PreserveParamsLink
                href={PROVIDER_ROUTES.REGISTER}
                trackEvent={PROVIDER_EVENTS.CLICK_CREATE_PROFILE}
                trackEventProperties={{ cta_location: "final_cta" }}
              >
                Create My Profile
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
                href={PROVIDER_ROUTES.LOGIN}
                trackEvent={PROVIDER_EVENTS.CLICK_LOGIN}
              >
                Already have an account? Log In
              </PreserveParamsLink>
            </Button>
          </div>
        </SectionCard>
      </section>
    </TrackingWrapper>
  );
};

export default page;
