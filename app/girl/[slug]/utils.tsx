// /lib/utils.ts
import {type ClassValue, clsx} from "clsx";
import {twMerge} from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatSlugToTitle(slug: string): string {
    if (!slug) return "";

    return slug
        .split(/[_-]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

// Generate structured data for escort profile
export function generateEscortStructuredData(escort: any) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadivas.com";
    const profileUrl = `${siteUrl}/girl/${escort.id}`;
    const displayName = formatSlugToTitle(escort.name || escort.username);
    const location =
        escort.town || escort.workingAreas?.[0]?.countyName || "Kenya";

    // Get primary image
    const primaryImage =
        escort.images?.find((img: any) => img.isPrimary)?.url ||
        escort.previewPhoto ||
        escort.images?.[0]?.url;

    return {
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": profileUrl,
        name: displayName,
        description:
            escort.about || `${displayName} - Premium escort in ${location}`,
        url: profileUrl,
        image: primaryImage,
        gender: "Female",
        age: escort.age,
        height: escort.height,
        weight: escort.weight,
        nationality: escort.nationality || "Kenyan",
        jobTitle: "Premium Escort",
        worksFor: {
            "@type": "Organization",
            name: "KENYADIVAS",
            url: siteUrl,
        },
        homeLocation: {
            "@type": "Place",
            name: location,
            address: {
                "@type": "PostalAddress",
                addressLocality: escort.town || "",
                addressRegion: escort.workingAreas?.[0]?.countyName || "",
                addressCountry: "KE",
            },
        },
        makesOffer: {
            "@type": "Offer",
            itemOffered: {
                "@type": "Service",
                name: "Escort Services",
                description: escort.categories?.join(", ") || "Premium companionship",
                provider: {
                    "@type": "Person",
                    name: displayName,
                },
                areaServed: escort.workingAreas?.map((area: any) => ({
                    "@type": "City",
                    name: area.countyName,
                })) || [{"@type": "Country", name: "Kenya"}],
            },
            price: escort.ratePerHour ? escort.ratePerHour.toString() : undefined,
            priceCurrency: "KES",
            availability: "https://schema.org/InStock",
            validFrom: new Date().toISOString().split("T")[0],
        },
        contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            email: escort.contactEmail,
            telephone: escort.contactPhone,
            availableLanguage: ["English", "Swahili"],
        },
        sameAs: [
            escort.instagram ? `https://instagram.com/${escort.instagram}` : null,
            escort.twitter ? `https://twitter.com/${escort.twitter}` : null,
        ].filter(Boolean),
    };
}
