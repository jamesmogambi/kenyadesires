// lib/services/agency-image.service.ts
import AgencyService from "./agency.service";

export interface AgencyImageUploadResult {
    success: boolean;
    url?: string;
    error?: string;
}

export class AgencyImageService {
    static async uploadLogo(
        _agencyId: string,
        _file: any,
        _fileName?: string,
    ): Promise<AgencyImageUploadResult> {
        return { success: false, error: "Firebase Storage removed" };
    }

    static async uploadCoverImage(
        _agencyId: string,
        _file: any,
        _fileName?: string,
    ): Promise<AgencyImageUploadResult> {
        return { success: false, error: "Firebase Storage removed" };
    }

    static async uploadGalleryImages(
        _agencyId: string,
        _files: any[],
    ): Promise<AgencyImageUploadResult[]> {
        return [];
    }

    static async deleteLogo(_agencyId: string): Promise<boolean> {
        return false;
    }

    static async deleteCoverImage(_agencyId: string): Promise<boolean> {
        return false;
    }

    static async deleteGalleryImage(
        _agencyId: string,
        _imageUrl: string,
    ): Promise<boolean> {
        return false;
    }

    static async deleteAllAgencyImages(_agencyId: string): Promise<boolean> {
        return false;
    }

    private static getFileExtension(_file: any): string {
        return "jpg";
    }

    private static getContentType(_extension: string): string {
        return "image/jpeg";
    }

    private static extractPathFromUrl(_url: string): string | null {
        return null;
    }
}

export default AgencyImageService;
