// lib/scrapers/rahaescorts-db.service.ts
import { RahaEscort } from "./rahaescorts.scraper";
import {
  Escort,
  Location,
  Rate,
  OpeningHours,
  Plan,
} from "@/server-actions/escort.action";
import RegionService from "@/lib/services/region.service";

export class RahaEscortsDatabaseService {
  static async escortExists(_slug: string): Promise<boolean> {
    return false;
  }

  static async getCountyByName(_countyName: string): Promise<string | null> {
    return null;
  }

  private static getAgeCategory(age: string): string {
    if (!age) return "";
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum)) return "";
    if (ageNum < 25) return "Young";
    if (ageNum < 35) return "Adult";
    return "Mature";
  }

  private static cleanPhoneNumber(phone: string): string {
    if (!phone) return "";
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }
    if (!cleaned.startsWith("254") && cleaned.length === 9) {
      cleaned = "254" + cleaned;
    }
    return cleaned;
  }

  static convertToEscortModel(
    scrapedData: Partial<RahaEscort>,
    fullDetails: Partial<RahaEscort>,
  ): Escort {
    const now = new Date();
    const merged = { ...scrapedData, ...fullDetails };

    const validAge =
      merged.age &&
      !isNaN(parseInt(merged.age, 10)) &&
      parseInt(merged.age, 10) >= 18 &&
      parseInt(merged.age, 10) <= 65
        ? merged.age
        : "";

    const cleanTelephone = this.cleanPhoneNumber(merged.telephone || "");
    const cleanWhatsapp = merged.whatsappPhone
      ? this.cleanPhoneNumber(merged.whatsappPhone)
      : cleanTelephone;

    const locations: Location[] = [
      {
        region: merged.regionId || merged.region || merged.county || "",
        town: merged.town || merged.region || "",
        estate: merged.city || "",
        address: "",
        street: "",
        postalCode: "",
        isActive: true,
        notes: "",
      },
    ];

    const rates: Rate[] = (merged.rates || [])
      .filter(
        (rate) =>
          rate.duration && rate.duration !== "Duration" && rate.duration !== "",
      )
      .map((rate) => ({
        duration: rate.duration,
        incall: rate.incall || "ASK",
        outcall: rate.outcall || "ASK",
      }));

    const openingHours: OpeningHours = {
      monday: "",
      tuesday: "",
      wednesday: "",
      thursday: "",
      friday: "",
      saturday: "",
      sunday: "",
    };

    const plan: Plan = {
      type: merged.isPremium ? "premium" : merged.isVip ? "vip" : "free",
      isActive: true,
      features: [],
    };

    const isFeatured = merged.isVip || merged.isPremium || false;

    return {
      id: merged.slug || "",
      name: merged.name || "",
      username: merged.slug || "",
      previewPhoto: merged.previewPhoto || merged.images?.[0] || "",
      labels: merged.labels || [],
      email: `${merged.slug}@rahaescorts.com`,
      age: validAge,
      telephone: cleanTelephone,
      whatsappPhone: cleanWhatsapp,
      images: merged.images || [],
      videos: [],
      about: merged.about || "",
      availability: merged.availability ? [merged.availability] : ["24/7"],
      ethnicity: merged.ethnicity || "",
      nationality: merged.nationality || "Kenyan",
      bustSize: merged.bustSize || "",
      weight: "",
      zodiacSign: "",
      sexualOrientation: merged.sexualOrientation || "Straight",
      gender: merged.gender || "Female",
      languages: merged.languages || ["English", "Swahili"],
      categories: merged.practices || [],
      country: "Kenya",
      county: merged.county || "",
      countyCode: (merged.county || "").toLowerCase().replace(/\s+/g, "_"),
      regions: [merged.regionId || merged.region || merged.county || ""].filter(
        (r) => r,
      ),
      primaryRegion: merged.region || merged.county || "",
      locations: locations,
      source: "rahaescorts.com",
      practices: merged.practices || [],
      bdsm: [],
      massage: (merged.practices || []).filter((p) =>
        p.toLowerCase().includes("massage"),
      ),
      extraServices: merged.extraServices || [],
      slug: merged.slug || "",
      role: "escort",
      openingHours: openingHours,
      rates: rates,
      breastSize: merged.bustSize || "",
      ageCategory: this.getAgeCategory(validAge),
      character: "",
      hairColor: "",
      experience: "",
      workType: merged.isPremium
        ? "Premium"
        : merged.isVip
          ? "VIP"
          : "Independent",
      isAgencyFeatured: isFeatured,
      isActive: true,
      isVerified: merged.isVerified || false,
      isFeatured: isFeatured,
      plan: plan,
      totalBookings: 0,
      totalReviews: 0,
      rating: 0,
      totalViews: 0,
      createdAt: now,
      updatedAt: now,
    };
  }

  static async saveEscort(
    _scrapedData: Partial<RahaEscort>,
    _fullDetails: Partial<RahaEscort>,
    _regionDoc?: any,
  ): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: "Firebase removed" };
  }
}
