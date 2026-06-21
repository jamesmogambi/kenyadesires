export const BUSINESS_TYPES = [
    {
        value: "agency",
        label: "Agency",
        icon: "🏢",
        color: "blue",
    },
    {
        value: "spa",
        label: "Spa",
        icon: "💆",
        color: "green",
    },
    {
        value: "massage_parlor",
        label: "Massage",
        icon: "👐",
        color: "purple",
    },
    {
        value: "brothel",
        label: "Brothel",
        icon: "🏠",
        color: "red",
    },
];

// Standard business nature categories for agencies
export const BUSINESS_NATURE_CATEGORIES = [
    // By Service Type
    "escort_agency", // Traditional escort services
    "spa", // Spa and massage services
    "massage_parlor", // Focused massage services
    "brothel", // Brothel/establishment-based
    "companion_service", // Social companion focus
    "luxury_service", // High-end VIP services
    "elite_service", // Exclusive high-class services

    // By Client Focus
    "corporate", // Business/corporate clients
    "tourist", // Tourist-focused
    "expat", // Expatriate-focused
    "local", // Local client-focused
    "international", // International clients

    // By Service Style
    "traditional", // Traditional escorting
    "therapeutic", // Therapeutic/healing focus
    "social", // Social companion only
    "discreet", // High discretion emphasis
    "boutique", // Small, selective agency
    "premium", // Premium pricing/services

    // By Specialization
    "model_agency", // Model escorts
    "student_agency", // Student escorts
    "mature_agency", // Mature escorts
    "bdsm_specialist", // BDSM specialization
    "fetish_specialist", // Fetish specialization

    // By Operations
    "incall_only", // Only incall services
    "outcall_only", // Only outcall services
    "24_hour", // 24/7 operations
    "appointment_only", // Appointment only
    "walk_in_welcome", // Walk-ins accepted
];

export const ITEMS_PER_PAGE = 24;
