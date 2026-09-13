// app/config/structured-data.ts
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.xyz";
const SITE_NAME = "KenyaDesires";

export const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    // ---- WebSite ----
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      alternateName: "Kenya Desires",
      description:
        "Kenya's premier escort directory connecting clients with verified, high-quality companions across all counties.",
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
      publisher: {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
      },
    },

    // ---- Organization ----
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      alternateName: "Kenya Desires",
      description:
        "KenyaDesires is the leading escort directory in Kenya, offering verified, high-class companions.",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
        width: 600,
        height: 60,
      },
      sameAs: [
        "https://twitter.com/kenyadesires",
        "https://www.instagram.com/kenyadesires",
        "https://www.facebook.com/kenyadesires",
      ],
      email: "support@kenyadesires.com",
      telephone: "+254701694004",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Nairobi",
        addressRegion: "Nairobi",
        addressCountry: "KE",
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+254701694004",
        contactType: "customer service",
        availableLanguage: ["English", "Swahili"],
        areaServed: "KE",
      },
    },

    // ---- LocalBusiness (core) ----
    {
      "@type": "LocalBusiness",
      "@id": `${SITE_URL}/#business`,
      name: SITE_NAME,
      alternateName: "Kenya Desires",
      description:
        "Premium escort directory connecting clients with verified companions across all counties in Kenya.",
      url: SITE_URL,
      telephone: "+254701694004",
      email: "support@kenyadesires.com",
      areaServed: [
        { "@type": "Country", name: "Kenya" },
        { "@type": "City", name: "Nairobi" },
        { "@type": "City", name: "Mombasa" },
        { "@type": "City", name: "Kisumu" },
        { "@type": "City", name: "Nakuru" },
        { "@type": "City", name: "Eldoret" },
        { "@type": "City", name: "Kiambu" },
        { "@type": "City", name: "Thika" },
        { "@type": "City", name: "Malindi" },
        { "@type": "City", name: "Kitale" },
        { "@type": "City", name: "Kakamega" },
        { "@type": "City", name: "Bungoma" },
        { "@type": "City", name: "Meru" },
        { "@type": "City", name: "Nyeri" },
        { "@type": "City", name: "Embu" },
        { "@type": "City", name: "Machakos" },
        { "@type": "City", name: "Kisii" },
        { "@type": "City", name: "Vihiga" },
        { "@type": "City", name: "Busia" },
        { "@type": "City", name: "Homa Bay" },
        { "@type": "City", name: "Migori" },
        { "@type": "City", name: "Siaya" },
        { "@type": "City", name: "Turkana" },
        { "@type": "City", name: "Garissa" },
        { "@type": "City", name: "Wajir" },
        { "@type": "City", name: "Mandera" },
      ],
      address: {
        "@type": "PostalAddress",
        addressCountry: "KE",
        addressRegion: "Nairobi",
        addressLocality: "Nairobi",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: -1.286389,
        longitude: 36.817223,
      },
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "00:00",
        closes: "23:59",
      },
      priceRange: "$$$",
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: 4.8,
        reviewCount: 1250,
        bestRating: 5,
        worstRating: 1,
      },
    },

    // ---- BreadcrumbList ----
    {
      "@type": "BreadcrumbList",
      "@id": `${SITE_URL}/#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Escorts in Kenya",
          item: `${SITE_URL}/escorts`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "All Escorts",
          item: `${SITE_URL}/girls`,
        },
      ],
    },

    // ---- FAQPage (common questions) ----
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "What is KenyaDesires?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "KenyaDesires is Kenya's premier escort directory connecting clients with verified, high-quality companions across all major cities and counties.",
          },
        },
        {
          "@type": "Question",
          name: "Are the escorts on KenyaDesires verified?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, all escorts featured on KenyaDesires undergo a strict verification process to ensure authenticity and quality.",
          },
        },
        {
          "@type": "Question",
          name: "What cities in Kenya does KenyaDesires cover?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "KenyaDesires covers all major cities and counties including Nairobi, Mombasa, Kisumu, Nakuru, Eldoret, Kiambu, Thika, Malindi, Kitale, and many more.",
          },
        },
        {
          "@type": "Question",
          name: "How do I book an escort on KenyaDesires?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Browse our verified listings, view real photos and reviews, and contact escorts directly through their preferred contact method on their profile.",
          },
        },
        {
          "@type": "Question",
          name: "Is KenyaDesires discreet?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, we prioritize client and escort privacy with discreet booking processes and secure communication channels.",
          },
        },
      ],
    },
  ],
};

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  alternateName: "Kenya Desires",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+254701694004",
    contactType: "customer service",
    email: "support@kenyadesires.com",
    availableLanguage: ["English", "Swahili"],
    areaServed: "KE",
  },
  sameAs: [
    "https://twitter.com/kenyadesires",
    "https://www.instagram.com/kenyadesires",
    "https://www.facebook.com/kenyadesires",
  ],
};
