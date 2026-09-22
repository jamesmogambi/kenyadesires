// lib/models/escort.model.ts
// Firebase references removed - EscortModel methods are no longer operational
import { CreateEscortDTO, GetEscortsParams, IEscort, UpdateEscortDTO } from "@/types/escort.types";

const COLLECTION_NAME = "escorts";

export class EscortModel {
  static async create(_data: CreateEscortDTO, _agencyId?: string): Promise<IEscort> {
    throw new Error("EscortModel.create is not operational (Firebase removed)");
  }

  static async getById(_id: string): Promise<IEscort | null> {
    throw new Error("EscortModel.getById is not operational (Firebase removed)");
  }

  static async getAll(
    _params: GetEscortsParams = {},
  ): Promise<{ escorts: IEscort[]; total: number; hasMore: boolean }> {
    throw new Error("EscortModel.getAll is not operational (Firebase removed)");
  }

  static async getByAgencyId(
    _agencyId: string,
    _params: Omit<GetEscortsParams, "agencyId"> = {},
  ): Promise<{ escorts: IEscort[]; total: number; hasMore: boolean }> {
    throw new Error("EscortModel.getByAgencyId is not operational (Firebase removed)");
  }

  static async update(_id: string, _data: UpdateEscortDTO): Promise<void> {
    throw new Error("EscortModel.update is not operational (Firebase removed)");
  }

  static async delete(_id: string): Promise<void> {
    throw new Error("EscortModel.delete is not operational (Firebase removed)");
  }

  static async uploadGallery(
    _escortId: string,
    _files: any[],
    _agencyId?: string,
  ): Promise<string[]> {
    throw new Error("EscortModel.uploadGallery is not operational (Firebase removed)");
  }
}