"use server";

import {
  getPracticesFromCleanedEscorts,
  getMassagesFromCleanedEscorts,
  getBDSMsFromCleanedEscorts,
  getCategoriesFromCleanedEscorts,
} from "./cleaned-escorts.action";
import { executeQuery } from "@/lib/neon";
import { variantSettings } from "@/fixtures/setting";

async function fetchUniqueFieldFromCleanedEscorts(
  params: Record<string, any> = {},
  field: "practices" | "massage" | "categories" | "bdsm" | "work_type" | "gender" | "nationality" | "extra_services" | "availability",
): Promise<{ value: string; count: number }[]> {
  try {
    const conditions: string[] = ["has_cleaned_images = TRUE"];
    const params_arr: any[] = [];
    let paramIndex = 1;

    if (params.county && params.county !== "all") {
      conditions.push(`county = $${paramIndex}`);
      params_arr.push(params.county);
      paramIndex++;
    }
    if (params.region && params.region !== "all") {
      conditions.push(`(EXISTS (SELECT 1 FROM JSON_TABLE(regions, '$[*]' COLUMNS (r VARCHAR(255) PATH '$')) AS jt WHERE LOWER(jt.r) = LOWER($${paramIndex})) OR lower(primary_region) = lower($${paramIndex + 1}))`);
      params_arr.push(params.region, params.region);
      paramIndex += 2;
    }
    if (params.nationality && params.nationality !== "all") {
      conditions.push(`nationality = $${paramIndex}`);
      params_arr.push(params.nationality);
      paramIndex++;
    }
    if (params.isActive !== undefined) {
      conditions.push(`is_active = $${paramIndex}`);
      params_arr.push(params.isActive);
      paramIndex++;
    }
    if (params.isVerified !== undefined) {
      conditions.push(`is_verified = $${paramIndex}`);
      params_arr.push(params.isVerified);
      paramIndex++;
    }
    if (params.isFeatured !== undefined) {
      conditions.push(`is_featured = $${paramIndex}`);
      params_arr.push(params.isFeatured);
      paramIndex++;
    }

    const whereClause = conditions.join(" AND ");
    const query = `SELECT ${field} FROM escorts WHERE ${whereClause}`;

    const rows = await executeQuery(query, params_arr);

    const valueCounts: Record<string, number> = {};

    rows.forEach((row) => {
      const values = row[field];
      if (values && Array.isArray(values)) {
        values.forEach((value: string) => {
          if (value) {
            valueCounts[value] = (valueCounts[value] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(valueCounts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.value.localeCompare(b.value);
      });
  } catch (error) {
    console.error(`Error fetching ${field} from cleaned escorts:`, error);
    return [];
  }
}

const DEFAULT_AVAILABILITY = ["Incall", "outcall", "Both"];

export async function getAvailabilityLookup(): Promise<string[]> {
  try {
    const rows = await executeQuery(
      "SELECT name FROM lookup_availability ORDER BY sort_order ASC, name ASC",
    );
    const names = rows.map((r: any) => r?.name).filter(Boolean);
    return names.length > 0 ? names : DEFAULT_AVAILABILITY;
  } catch (error) {
    console.error("Error fetching availability lookup:", error);
    return DEFAULT_AVAILABILITY;
  }
}

export async function getWorkTypesFromCleanedEscorts(
  params: Record<string, any> = {},
): Promise<{ value: string; count: number }[]> {
  return fetchUniqueFieldFromCleanedEscorts(params, "work_type");
}

export async function getGendersFromCleanedEscorts(
  params: Record<string, any> = {},
): Promise<{ value: string; count: number }[]> {
  return fetchUniqueFieldFromCleanedEscorts(params, "gender");
}

export async function getNationalitiesFromCleanedEscorts(
  params: Record<string, any> = {},
): Promise<{ value: string; count: number }[]> {
  return fetchUniqueFieldFromCleanedEscorts(params, "nationality");
}

export async function getExtraServicesFromCleanedEscorts(
  params: Record<string, any> = {},
): Promise<{ value: string; count: number }[]> {
  return fetchUniqueFieldFromCleanedEscorts(params, "extra_services");
}

export async function getAllLookupData(params: Record<string, any> = {}) {
  const [
    practices,
    massage,
    bdsm,
    categories,
    workTypes,
    genders,
    extraServices,
    availability,
    ageRows,
    breastRows,
  ] = await Promise.all([
    getPracticesFromCleanedEscorts(params),
    getMassagesFromCleanedEscorts(params),
    getBDSMsFromCleanedEscorts(params),
    getCategoriesFromCleanedEscorts(params),
    getWorkTypesFromCleanedEscorts(params),
    getGendersFromCleanedEscorts(params),
    getExtraServicesFromCleanedEscorts(params),
    getAvailabilityLookup(),
    executeQuery("SELECT name FROM lookup_ages"),
    executeQuery("SELECT name FROM lookup_breast_sizes"),
  ]);

  return {
    // `getPracticesFromCleanedEscorts` is the one lookup that returns
    // `{ practice, count }`; the other seven return `{ value, count }`.
    // It keeps that shape because app/sitemap.ts and
    // components/FileInputInitializer.tsx both read `.practice` from it, so
    // the difference is normalised here instead of at the source.
    // `availability` is the exception: it is not derived from escort rows but
    // read straight from the `lookup_availability` table so the dropdown is
    // always prepopulated with the canonical options.
    practices: practices.map((p) => p.practice),
    massage: massage.map((m) => m.value),
    bdsm: bdsm.map((b) => b.value),
    categories: categories.map((c) => c.value),
    workTypes: workTypes.map((w) => w.value),
    genders: genders.map((g) => g.value),
    extraServices: extraServices.map((e) => e.value),
    availability,
    age: ageRows.map((a: any) => ({ name: a.name })),
    breast: breastRows.map((b: any) => ({ name: b.name })),
    character: variantSettings.character,
    hairColor: variantSettings.hairColor,
    nationality: variantSettings.nationality,
    experience: variantSettings.experience,
    languages: variantSettings.languages,
  };
}

export async function getPractices(params?: Record<string, any>) {
  return getPracticesFromCleanedEscorts(params || {});
}

// Canonical service option lists. These read the `lookup_*` tables directly so the
// selectable options are the canonical catalogue, not values inferred from the
// rows escorts happen to have selected. Table names are restricted to this
// union so the identifier can never come from user input.
type ServiceLookupTable =
  | "lookup_practices"
  | "lookup_bdsm"
  | "lookup_massage"
  | "lookup_categories";

async function getServiceLookupNames(
  table: ServiceLookupTable,
): Promise<string[]> {
  try {
    const rows = await executeQuery(
      `SELECT name FROM ${table} ORDER BY name ASC`,
    );
    return rows.map((r: any) => r?.name).filter(Boolean);
  } catch (error) {
    console.error(`Error fetching ${table}:`, error);
    return [];
  }
}

export async function getPracticesLookup(): Promise<string[]> {
  return getServiceLookupNames("lookup_practices");
}

export async function getMassageTypes(): Promise<string[]> {
  return getServiceLookupNames("lookup_massage");
}

export async function getBdsmPractices(): Promise<string[]> {
  return getServiceLookupNames("lookup_bdsm");
}

export async function getCategoryLookup(): Promise<string[]> {
  return getServiceLookupNames("lookup_categories");
}

export interface LanguageLookupItem {
  name: string;
  slug: string;
  countryCode: string;
}

export async function getLanguageLookup(): Promise<LanguageLookupItem[]> {
  try {
    const rows = await executeQuery(
      "SELECT name, slug, country_code FROM lookup_languages ORDER BY sort_order ASC, name ASC",
    );
    return rows
      .map((r: any) => ({
        name: (r?.name || "").trim(),
        slug: (r?.slug || "").trim(),
        countryCode: (r?.country_code || "").trim().toUpperCase(),
      }))
      .filter((r) => r.name);
  } catch (error) {
    console.error("Error fetching lookup_languages:", error);
    return [];
  }
}