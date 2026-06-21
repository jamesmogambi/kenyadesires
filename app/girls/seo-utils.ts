// /lib/seo-utils.ts

interface BreadcrumbItem {
    name: string;
    url: string;
}

export function generateBreadcrumbList(items: BreadcrumbItem[]) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadivas.com"}${item.url}`,
        })),
    };
}

interface ListStructuredDataProps {
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

export function generateListStructuredData({
                                               title,
                                               description,
                                               totalItems,
                                               currentPage,
                                               totalPages,
                                               filters,
                                               items,
                                           }: ListStructuredDataProps) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadivas.com";

    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "@id": `${baseUrl}/girls${currentPage > 1 ? `?page=${currentPage}` : ""}`,
                name: title,
                description: description,
                url: `${baseUrl}/girls`,
                numberOfItems: totalItems,
                ...(currentPage > 1 && {
                    isPartOf: {
                        "@type": "CollectionPage",
                        "@id": `${baseUrl}/girls`,
                    },
                }),
                ...(currentPage < totalPages && {
                    nextPage: `${baseUrl}/girls?page=${currentPage + 1}`,
                }),
                ...(currentPage > 1 && {
                    previousPage: `${baseUrl}/girls${currentPage > 2 ? `?page=${currentPage - 1}` : ""}`,
                }),
                mainEntity: {
                    "@type": "ItemList",
                    itemListElement: items.slice(0, 10).map((item, index) => ({
                        "@type": "ListItem",
                        position: index + 1 + (currentPage - 1) * 20,
                        item: {
                            "@type": "Person",
                            name: item.name || item.username,
                            description: item.about?.substring(0, 200),
                            url: `${baseUrl}/girl/${item.id}`,
                            image: item.previewPhoto,
                            homeLocation: {
                                "@type": "Place",
                                name:
                                    item.town || item.workingAreas?.[0]?.countyName || "Kenya",
                            },
                        },
                    })),
                },
            },
            {
                "@type": "WebSite",
                "@id": `${baseUrl}/#website`,
                name: "KENYADIVAS",
                description: "Premium Escort Directory in Kenya",
                url: baseUrl,
                potentialAction: {
                    "@type": "SearchAction",
                    target: {
                        "@type": "EntryPoint",
                        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
                    },
                    "query-input": "required name=search_term_string",
                },
            },
            {
                "@type": "Organization",
                "@id": `${baseUrl}/#organization`,
                name: "KENYADIVAS",
                url: baseUrl,
                logo: {
                    "@type": "ImageObject",
                    url: `${baseUrl}/logo.png`,
                    width: 600,
                    height: 60,
                },
                sameAs: [
                    "https://twitter.com/kenyadivas",
                    "https://www.instagram.com/kenyadivas",
                    "https://www.facebook.com/kenyadivas",
                ],
                contactPoint: {
                    "@type": "ContactPoint",
                    telephone: "+254700000000",
                    contactType: "customer service",
                    email: "contact@kenyadivas.com",
                    availableLanguage: ["English", "Swahili"],
                    areaServed: "KE",
                },
            },
            {
                "@type": "ItemList",
                "@id": `${baseUrl}/girls#itemlist`,
                name: title,
                description: description,
                numberOfItems: totalItems,
                itemListOrder: "https://schema.org/ItemListOrderDescending",
                itemListElement: items.slice(0, 5).map((item, index) => ({
                    "@type": "ListItem",
                    position: index + 1,
                    item: {
                        "@type": "Person",
                        name: item.name || item.username,
                        url: `${baseUrl}/girl/${item.id}`,
                        image: item.previewPhoto,
                    },
                })),
            },
        ],
    };
}

export function generateFilterStructuredData(filters: any) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadivas.com";

    return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Escort Search Results",
        description: `Filtered escort listings based on ${Object.entries(filters)
            .filter(([_, v]) => v)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ")}`,
        url: baseUrl + "/girls",
        numberOfItems: filters.total || 0,
        itemListOrder: "https://schema.org/ItemListOrderDescending",
    };
}
