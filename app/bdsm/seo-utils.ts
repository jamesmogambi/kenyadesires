// Add to /lib/seo-utils.ts

import {ITEMS_PER_PAGE} from "@/constants";

interface BDSMStructuredDataProps {
    title: string;
    description: string;
    totalItems: number;
    currentPage: number;
    totalPages: number;
    filters: {
        county?: string | null;
        region?: string | null;
        practice?: string | null;
    };
    items: any[];
}

export function generateBDSMStructuredData({
                                               title,
                                               description,
                                               totalItems,
                                               currentPage,
                                               totalPages,
                                               filters,
                                               items,
                                           }: BDSMStructuredDataProps) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadivas.com";
    const practice = filters.practice?.toLowerCase() || "bdsm";

    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "@id": `${baseUrl}/bdsm-escorts${currentPage > 1 ? `?page=${currentPage}` : ""}`,
                name: title,
                description: description,
                url: `${baseUrl}/bdsm-escorts`,
                numberOfItems: totalItems,
                ...(currentPage > 1 && {
                    isPartOf: {
                        "@type": "CollectionPage",
                        "@id": `${baseUrl}/bdsm-escorts`,
                    },
                }),
                mainEntity: {
                    "@type": "ItemList",
                    itemListElement: items.map((item, index) => ({
                        "@type": "ListItem",
                        position: index + 1 + (currentPage - 1) * ITEMS_PER_PAGE,
                        item: {
                            "@type": "Person",
                            name: item.name || item.username,
                            description: item.about?.substring(0, 200),
                            url: `${baseUrl}/girl/${item.id}`,
                            image: item.previewPhoto,
                            knowsAbout: [`BDSM`, practice, ...(item.categories || [])],
                            hasOfferCatalog: {
                                "@type": "OfferCatalog",
                                name: "BDSM Services",
                                itemListElement: [
                                    {
                                        "@type": "Offer",
                                        itemOffered: {
                                            "@type": "Service",
                                            name: `${practice} Sessions`,
                                            description: `Professional ${practice} BDSM services`,
                                        },
                                    },
                                ],
                            },
                        },
                    })),
                },
            },
            {
                "@type": "LocalBusiness",
                "@id": `${baseUrl}/bdsm-escorts#business`,
                name: "KENYADIVAS BDSM",
                description: "Premier BDSM and kink-friendly escort directory in Kenya",
                url: `${baseUrl}/bdsm-escorts`,
                telephone: "+254700000000",
                email: "bdsm@kenyadivas.com",
                priceRange: "$$$",
                areaServed: filters.county || filters.region || "Kenya",
                hasOfferCatalog: {
                    "@type": "OfferCatalog",
                    name: "BDSM Services",
                    itemListElement: [
                        {
                            "@type": "Offer",
                            itemOffered: {
                                "@type": "Service",
                                name: "Domination",
                                description: "Professional domination sessions",
                            },
                        },
                        {
                            "@type": "Offer",
                            itemOffered: {
                                "@type": "Service",
                                name: "Submission",
                                description: "Guided submission experiences",
                            },
                        },
                        {
                            "@type": "Offer",
                            itemOffered: {
                                "@type": "Service",
                                name: "Bondage",
                                description: "Rope bondage and shibari",
                            },
                        },
                        {
                            "@type": "Offer",
                            itemOffered: {
                                "@type": "Service",
                                name: "Impact Play",
                                description: "Safe impact play sessions",
                            },
                        },
                    ],
                },
            },
        ],
    };
}
