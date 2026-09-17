"use server";

import { sql } from "@/app/lib/db";
import { dbCountyToAppCounty, dbRegionToAppRegion } from "@/lib/db-types";

export interface ICounty {
  id: string;
  name: string;
  code: string;
  description?: string;
  isPopular: boolean;
  population?: number;
  area?: string;
  capital?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IRegion {
  id: string;
  name: string;
  countyCode: string;
  county: string;
  countyNumericCode?: string;
  countyId: string;
  isActive: boolean;
  town?: string;
  estate?: string;
  address?: string;
  street?: string;
  postalCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getPopularCounties(options?: { limit?: number }) {
  try {
    const limit = options?.limit;
    let rows: any[];

    if (limit && limit > 0) {
      rows = await sql`
        SELECT * FROM counties
        WHERE is_popular = TRUE
        ORDER BY name ASC
        LIMIT ${limit}
      `;
    } else {
      rows = await sql`
        SELECT * FROM counties
        WHERE is_popular = TRUE
        ORDER BY name ASC
      `;
    }

    const counties: ICounty[] = rows.map((row) =>
      dbCountyToAppCounty({
        id: row.id,
        name: row.name,
        code: row.code,
        slug: row.slug,
        description: row.description,
        is_popular: row.is_popular,
        population: row.population,
        area: row.area,
        capital: row.capital,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }),
    );

    return {
      success: true,
      data: counties,
    };
  } catch (error) {
    console.error("Error fetching popular counties:", error);
    return {
      success: false,
      error: "Failed to fetch popular counties",
      data: [],
    };
  }
}

export async function getAllRegions() {
  try {
    const rows: any[] = await sql`
      SELECT * FROM regions
      ORDER BY name ASC
    `;

    const regions: IRegion[] = rows.map((row) =>
      dbRegionToAppRegion({
        id: row.id,
        name: row.name,
        county_code: row.county_code,
        county: row.county,
        county_numeric_code: row.county_numeric_code,
        county_id: row.county_id,
        is_active: row.is_active,
        town: row.town,
        estate: row.estate,
        address: row.address,
        street: row.street,
        postal_code: row.postal_code,
        notes: row.notes,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }),
    );

    return {
      success: true,
      data: regions,
    };
  } catch (error) {
    console.error("Error fetching regions:", error);
    return {
      success: false,
      error: "Failed to fetch regions",
      data: [],
    };
  }
}

export async function getAllCounties() {
  try {
    const rows: any[] = await sql`
      SELECT * FROM counties
      ORDER BY name ASC
    `;

    const counties: ICounty[] = rows.map((row) =>
      dbCountyToAppCounty({
        id: row.id,
        name: row.name,
        code: row.code,
        slug: row.slug,
        description: row.description,
        is_popular: row.is_popular,
        population: row.population,
        area: row.area,
        capital: row.capital,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }),
    );

    return {
      success: true,
      data: counties,
    };
  } catch (error) {
    console.error("Error fetching all counties:", error);
    return {
      success: false,
      error: "Failed to fetch counties",
      data: [],
    };
  }
}
