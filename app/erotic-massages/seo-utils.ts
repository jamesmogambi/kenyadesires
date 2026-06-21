// Add to /lib/seo-utils.ts

import {ITEMS_PER_PAGE} from "@/constants";

interface MassageStructuredDataProps {
    title: string;
    description: string;
    totalItems: number;
    currentPage: number;
    totalPages: number;
    filters: {
        county?: string | null;
        region?: string | null;
        massageType?: string | null;
    };
    items: any[];
}

export function generateMassageStructuredData({
                                                  title,
                                                  description,
                                                  totalItems,
                                                  currentPage,
                                                  totalPages,
                                                  filters,
                                                  items,
                                              }: MassageStructuredDataProps) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadivas.com";
    const massageType = filters.massageType?.toLowerCase() || "erotic";

    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "@id": `${baseUrl}/massage-escorts${currentPage > 1 ? `?page=${currentPage}` : ""}`,
                name: title,
                description: description,
                url: `${baseUrl}/massage-escorts`,
                numberOfItems: totalItems,
                ...(currentPage > 1 && {
                    isPartOf: {
                        "@type": "CollectionPage",
                        "@id": `${baseUrl}/massage-escorts`,
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
                            hasOfferCatalog: {
                                "@type": "OfferCatalog",
                                name: "Massage Services",
                                itemListElement: [
                                    {
                                        "@type": "Offer",
                                        itemOffered: {
                                            "@type": "Service",
                                            name: `${massageType} Massage`,
                                            description: `Professional ${massageType} massage therapy`,
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
                "@id": `${baseUrl}/massage-escorts#business`,
                name: "KENYADIVAS Massage",
                description: "Premium massage therapy directory in Kenya",
                url: `${baseUrl}/massage-escorts`,
                telephone: "+254700000000",
                email: "massage@kenyadivas.com",
                priceRange: "$$",
                areaServed: filters.county || filters.region || "Kenya",
                hasOfferCatalog: {
                    "@type": "OfferCatalog",
                    name: "Massage Services",
                    itemListElement: [
                        {
                            "@type": "Offer",
                            itemOffered: {
                                "@type": "Service",
                                name: "Erotic Massage",
                                description: "Sensual and erotic massage experiences",
                            },
                        },
                        {
                            "@type": "Offer",
                            itemOffered: {
                                "@type": "Service",
                                name: "Tantric Massage",
                                description: "Sacred tantric massage therapy",
                            },
                        },
                        {
                            "@type": "Offer",
                            itemOffered: {
                                "@type": "Service",
                                name: "Nuru Massage",
                                description: "Authentic Japanese nuru massage",
                            },
                        },
                    ],
                },
            },
        ],
    };
}
