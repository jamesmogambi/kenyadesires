// /lib/seo-utils.ts
//
// AEO note: this file previously hard-coded a second, conflicting set of
// entity facts (`kenyadivas` social handles and a placeholder
// `+254700000000` phone). Answer engines treat a site that names different
// social profiles and phone numbers on different pages as having weak
// entity identity, so all identity facts now come from the single source
// in `lib/aeo/entity.ts` and all identity nodes are referenced by `@id`
// from the site-wide graph emitted in the root layout.

import { SITE_URL, absoluteUrl } from "@/lib/aeo/entity";
import { NODE_IDS } from "@/lib/aeo/schema";

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
            item: absoluteUrl(item.url),
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
    const baseUrl = SITE_URL;

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
                inLanguage: "en-KE",
                // Links this collection to the site-wide WebSite and
                // Organization nodes emitted in the root layout.
                isPartOf: { "@id": NODE_IDS.website },
                about: { "@id": NODE_IDS.organization },
                ...(currentPage > 1 && {
                    breadcrumb: { "@id": `${baseUrl}/girls#breadcrumb` },
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
                            // Links each listing back to the one Organization
                            // node, so the person entities inherit the site's
                            // verified identity instead of floating free.
                            subjectOf: {
                                "@type": "WebPage",
                                url: `${baseUrl}/girl/${item.id}`,
                                isPartOf: { "@id": NODE_IDS.website },
                            },
                        },
                    })),
                },
            },
        ],
    };
}

export function generateFilterStructuredData(filters: any) {
    const baseUrl = SITE_URL;

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
