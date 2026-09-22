// lib/services/agency.service.ts
import {
  IAgency,
  CreateAgencyDTO,
  UpdateAgencyDTO,
  GetAgenciesParams,
  GetAgenciesResponse,
} from "@/types/agency.types";

export class AgencyService {
  static async createAgency(_data: CreateAgencyDTO): Promise<IAgency> {
    throw new Error("AgencyService.createAgency is not operational");
  }

  static async getAgencyById(_id: string): Promise<IAgency | null> {
    return null;
  }

  static async getAgencyBySlug(_slug: string): Promise<IAgency | null> {
    return null;
  }

  static async getAgenciesByOwner(_ownerId: string): Promise<IAgency[]> {
    return [];
  }

  static async updateAgency(
    _id: string,
    _data: UpdateAgencyDTO,
  ): Promise<IAgency> {
    throw new Error("AgencyService.updateAgency is not operational");
  }

  static async deleteAgency(
    _id: string,
    _hardDelete: boolean = false,
  ): Promise<boolean> {
    return false;
  }

  static async getAgencies(
    _params: GetAgenciesParams = {},
  ): Promise<GetAgenciesResponse> {
    return { agencies: [], total: 0, page: 1, totalPages: 0, hasMore: false };
  }

  static async incrementViewCount(_id: string): Promise<void> {}

  static async updateRating(_id: string, _newRating: number): Promise<void> {}

  static async getFeaturedAgencies(
    _limitCount: number = 10,
  ): Promise<IAgency[]> {
    return [];
  }

  static async getAgencyStats(): Promise<{
    total: number;
    active: number;
    verified: number;
    featured: number;
    byBusinessType: Record<string, number>;
  }> {
    return {
      total: 0,
      active: 0,
      verified: 0,
      featured: 0,
      byBusinessType: {},
    };
  }

  static async getAgenciesByIds(
    _ids: string[],
  ): Promise<IAgency[]> {
    return [];
  }

  static async getCachedAgencies(
    _page: number = 1,
    _limitCount: number = 24,
  ) {
    return {
      success: true,
      data: { agencies: [], total: 0, page: 1, totalPages: 0, hasMore: false },
    };
  }

  static async getCachedAgencyBySlug(_slug: string) {
    return { success: false, data: null };
  }

  static async getCachedAgenciesCount() {
    return 0;
  }

  static async getCachedFirstAgency() {
    return null;
  }

  static getAgenciesServer = AgencyService.getAgencies;
  static getAgenciesCountServer = AgencyService.getCachedAgenciesCount;
  static getFirstAgencyServer = AgencyService.getCachedFirstAgency;

  static async getAgencyEscortsFromNeon() {
    return {
      success: false,
      data: [],
      error: "Not implemented",
      total: 0,
      page: 1,
      totalPages: 0,
      hasMore: false,
    };
  }

  static async getAgenciesWithEscortsFromNeon() {
    return { agencies: [], total: 0, page: 1, totalPages: 0, hasMore: false };
  }

  static async getAgenciesCountFromNeon() {
    return 0;
  }

  static async getFirstAgencyFromNeon() {
    return null;
  }

  static getAgenciesFromNeon = AgencyService.getAgenciesWithEscortsFromNeon;
  static getAgenciesCountFromNeonAlias = AgencyService.getAgenciesCountFromNeon;
  static getFirstAgencyFromNeonAlias = AgencyService.getFirstAgencyFromNeon;

  static getAgenciesCount = AgencyService.getAgenciesCountFromNeon;
  static getFirstAgency = AgencyService.getFirstAgencyFromNeon;
  static getAgencyEscorts = AgencyService.getAgencyEscortsFromNeon;
}

export default AgencyService;
