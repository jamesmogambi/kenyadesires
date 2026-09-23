"use server";

import {
  getPracticesFromCleanedEscorts,
  getMassagesFromCleanedEscorts,
  getBDSMsFromCleanedEscorts,
  getCategoriesFromCleanedEscorts,
} from "./cleaned-escorts.action";
import { executeQuery } from "@/lib/neon";

async function fetchUniqueFieldFromCleanedEscorts(
  params: Record<string, any> = {},
  field: "practices" | "massage" | "categories" | "bdsm" | "work_type" | "gender" | "nationality" | "extra_services",
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
    nationalities,
    extraServices,
  ] = await Promise.all([
    getPracticesFromCleanedEscorts(params),
    getMassagesFromCleanedEscorts(params),
    getBDSMsFromCleanedEscorts(params),
    getCategoriesFromCleanedEscorts(params),
    getWorkTypesFromCleanedEscorts(params),
    getGendersFromCleanedEscorts(params),
    getNationalitiesFromCleanedEscorts(params),
    getExtraServicesFromCleanedEscorts(params),
  ]);

  return {
    practices: practices.map((p) => p.value),
    massage: massage.map((m) => m.value),
    bdsm: bdsm.map((b) => b.value),
    categories: categories.map((c) => c.value),
    workTypes: workTypes.map((w) => w.value),
    genders: genders.map((g) => g.value),
    nationalities: nationalities.map((n) => n.value),
    extraServices: extraServices.map((e) => e.value),
    availability: [],
    age: [],
    breast: [],
    character: [],
    hairColor: [],
    experience: [],
    languages: [],
  };
}

export async function getPractices(params?: Record<string, any>) {
  return getPracticesFromCleanedEscorts(params || {});
}