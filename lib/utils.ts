import {localeToFlagEmoji} from "@/fixtures/flags";
import {type ClassValue, clsx} from "clsx";
import {twMerge} from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// export function slugify(input: string): string {
//   return input
//     .trim()
//     .toLowerCase()
//     .replace(/\s+/g, "-") // Replace spaces with hyphens
//     .replace(/[^a-z0-9-]/g, ""); // Remove non-alphanumeric (except hyphen)
// }

export function slugify(input: string): string {
    return input
        .normalize("NFKD") // Decompose accented characters
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric except space/hyphen
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-") // Collapse multiple hyphens
        .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens
}

export function convertToLocalPhone(phone: string): string {
    // Remove all whitespace
    const cleaned = phone.replace(/\s+/g, "");

    // Replace +254 with 0
    if (cleaned.startsWith("+254")) {
        return "0" + cleaned.slice(4);
    }

    // If already starts with 0 and valid length, return as is
    if (cleaned.startsWith("0")) {
        return cleaned;
    }

    // Fallback: return original
    return phone;
}

// export function formatKenyanPhoneNumber(phoneNumber: string): string {
//   // Remove any spaces just in case
//   const cleaned = phoneNumber.replace(/\s+/g, "");

//   // Validate input
//   if (!cleaned.startsWith("+254") || cleaned.length !== 13) {
//     throw new Error(
//       "Phone number must start with +254 and be 13 characters long"
//     );
//   }

//   // Convert to local format: +254701694004 → 0701694004
//   const localNumber = "0" + cleaned.slice(4); // slice from index 4 to remove '+254'

//   // Format: 0701 694 004
//   return `${localNumber.slice(0, 4)} ${localNumber.slice(
//     4,
//     7
//   )} ${localNumber.slice(7)}`;
// }

// export function formatKenyanPhoneNumber(phoneNumber: string): string {
//   // Remove any spaces just in case
//   const cleaned = phoneNumber.replace(/\s+/g, "");

//   // Validate input
//   if (!cleaned.startsWith("+254") || cleaned.length !== 13) {
//     throw new Error(
//       "Phone number must start with +254 and be 13 characters long",
//     );
//   }

//   // Convert to local format: +254701694004 → 0701694004
//   const localNumber = "0" + cleaned.slice(4); // slice from index 4 to remove '+254'

//   // Format: 0701 694 004
//   return `${localNumber.slice(0, 4)} ${localNumber.slice(
//     4,
//     7,
//   )} ${localNumber.slice(7)}`;
// }

export function formatKenyanPhoneNumber(phoneNumber: string | null): string {
    if (!phoneNumber || typeof phoneNumber !== "string") {
        return phoneNumber || "";
    }

    // Remove all spaces, dashes, parentheses, and other separators
    const cleaned = phoneNumber.trim().replace(/[\s\-().+]/g, "");

    // Handle empty string after cleaning
    if (!cleaned) {
        return phoneNumber;
    }

    let digitsOnly = cleaned;

    // If it starts with +, remove it for processing
    if (phoneNumber.startsWith("+")) {
        digitsOnly = cleaned;
    }

    let localNumber: string;

    // Handle different formats
    if (digitsOnly.startsWith("254") && digitsOnly.length === 12) {
        // Format: 254701694004 (international without +)
        localNumber = "0" + digitsOnly.slice(3);
    } else if (digitsOnly.startsWith("0") && digitsOnly.length === 10) {
        // Format: 0701694004 (local format)
        localNumber = digitsOnly;
    } else if (digitsOnly.match(/^[17]\d{8}$/)) {
        // Format: 701694004 (9 digits, no leading zero)
        localNumber = "0" + digitsOnly;
    } else if (digitsOnly.length === 9 && /^\d{9}$/.test(digitsOnly)) {
        // Any 9-digit number (e.g., 701694004)
        localNumber = "0" + digitsOnly;
    } else {
        // Return original if format is unexpected instead of throwing
        return phoneNumber;
    }

    // Validate the local number format - if it doesn't look like a Kenyan mobile/landline, return original
    if (!/^0[17]\d{8}$/.test(localNumber)) {
        return phoneNumber;
    }

    // Format with spaces for display: 0701 694 004
    return `${localNumber.slice(0, 4)} ${localNumber.slice(4, 7)} ${localNumber.slice(7)}`;
}

export function getFirstName(fullName: string): string {
    return fullName.trim().split(" ")[0];
}

// const normalizeWorkingHours = (data: any["workingHours"]) => {
//   return Object.entries(data).map(([day, val]) => {
//     if (!val.enabled) return { day, off: true };
//     return { day, start: val.start, end: val.end };
//   });
// };

export function formatCategory(input: string): string {
    return input
        .split(/[^a-zA-Z0-9]+/) // Split by non-word characters
        .filter((word) => word.length > 0) // Remove empty fragments
        .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase()) // Capitalize
        .join(" ");
}

export function normalizeArray(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (val && typeof val === "object" && typeof val.map === "function") return val;
  if (val && typeof val === "object") return Object.values(val);
  return [];
}

export function splitIntoThreeColumns<T>(items: T[]): [T[], T[], T[]] {
    const columns: [T[], T[], T[]] = [[], [], []];

    items.forEach((item, index) => {
        columns[index % 3].push(item);
    });

    return columns;
}

export const getFlagEmoji = (locale: string): string =>
    localeToFlagEmoji[locale] ?? "🏳️"; // fallback to white flag

export function formatSlugToTitle(slug: any) {
    if (!slug) return "";
    return slug
        .split(/[\s_-]+/) // Split by spaces, hyphens, or underscores
        .map(
            (word: string) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        ) // Capitalize first letter of each word
        .join(" "); // Join with space
}

// Example usage:
// formatSlugToTitle('big-ass-porn') => "Big Ass Porn"
// formatSlugToTitle('african porn videos') => "African Porn Videos"


export function formatDate(date: string): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateShort(date: string): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// export function slugify(text: string): string {
//   return text
//     .toLowerCase()
//     .replace(/[^a-z0-9]+/g, '-')
//     .replace(/^-|-$/g, '')
// }

// export function truncateText(text: string, maxLength: number = 160): string {
//   if (!text) return ''
//   if (text.length <= maxLength) return text
//   return text.slice(0, maxLength) + '...'
// }

export function formatPracticeName(name: string): string {
  if (!name) return "";
  const withoutBrackets = name.replace(/\s*[\(\[].*?[\)\]]/g, "").trim();
  const words = withoutBrackets.split(/\s+/).filter((w) => w.length > 0);
  return words.slice(0, 3).join(" ");
}

type FilterValue = string | number | boolean | undefined;

interface FilterUpdate {
  [key: string]: FilterValue;
}

export function buildFilterUrl(
  basePath: string,
  currentSearchParams: URLSearchParams,
  updates: FilterUpdate,
  resetPage: boolean = true,
): string {
  const params = new URLSearchParams();

  // Start with existing params, excluding ones being updated
  currentSearchParams.forEach((value, key) => {
    if (!(key in updates)) {
      params.set(key, value);
    }
  });

  // Apply updates
  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "all") {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  });

  // Always reset page to 1 when filters change
  if (resetPage) {
    params.set("page", "1");
  }

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}