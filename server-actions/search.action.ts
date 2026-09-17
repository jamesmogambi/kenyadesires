"use server";

import { getEscorts } from "./escort.action";
import type { Escort } from "./escort.action";
import type { GetEscortsParams } from "./escort.action";

interface SearchEscortsOptions {
  query: string;
  limit?: number;
  page?: number;
  filters?: {
    county?: string;
    region?: string;
    gender?: string;
  };
}

export async function searchEscorts(
  options: SearchEscortsOptions,
): Promise<{
  success: boolean;
  data?: {
    escorts: Escort[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
  error?: string;
}> {
  try {
    const { query, limit = 20, page = 1, filters = {} } = options;
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));

    const params: GetEscortsParams = {
      page: validPage,
      limit: validLimit,
      county: filters.county,
      region: filters.region,
      isActive: true,
    };

    if (query?.trim()) {
      params.search = query.trim();
    }

    const result = await getEscorts(params);

    const totalPages = Math.max(1, Math.ceil(result.total / validLimit));

    return {
      success: true,
      data: {
        escorts: result.escorts,
        pagination: {
          page: result.page,
          limit: validLimit,
          total: result.total,
          totalPages,
          hasNextPage: result.page < totalPages,
          hasPreviousPage: result.page > 1,
        },
      },
    };
  } catch (error) {
    console.error("Search error:", error);
    return {
      success: false,
      error: "Failed to search escorts. Please try again later.",
    };
  }
}
