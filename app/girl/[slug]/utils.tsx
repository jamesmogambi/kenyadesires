// /lib/utils.ts
import {type ClassValue, clsx} from "clsx";
import {twMerge} from "tailwind-merge";

import { personNode } from "@/lib/aeo/schema";
import { SITE_URL } from "@/lib/aeo/entity";

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

function normalizeArray(val: any): string[] {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (val && typeof val === "object" && typeof val.map === "function") return val;
    if (val && typeof val === "object") return Object.values(val).map(String);
    return [];
}

// Generate AEO-compliant Person schema for an escort profile page.
// References the site-wide Organization/WebSite nodes by @id instead of
// redefining them. Does not claim employment (worksFor is undefined) and
// does not expose private contact data.
export function generateEscortPersonSchema(escort: any) {
    const siteUrl = SITE_URL;
    const profileUrl = `${siteUrl}/girl/${escort.id}`;
    const displayName = formatSlugToTitle(escort.name || escort.username);
    const location =
        escort.town || escort.primaryRegion || escort.locations?.[0]?.countyName || "Kenya";

    const primaryImage =
        escort.images?.find((img: any) => img.isPrimary)?.url ||
        escort.previewPhoto ||
        escort.images?.[0]?.url;

    const sameAs: string[] = [
        escort.instagram ? `https://instagram.com/${escort.instagram}` : null,
        escort.twitter ? `https://twitter.com/${escort.twitter}` : null,
    ].filter((item): item is string => item !== null);

    return personNode({
        name: displayName,
        url: profileUrl,
        description:
            escort.about ||
            `${displayName} is a listed adult companion provider in ${location}, with a profile on the KenyaDesires directory.`,
        image: primaryImage,
        location,
        isVerified: escort.isVerified ?? null,
        categories: normalizeArray(escort.categories),
        sameAs,
    });
}
