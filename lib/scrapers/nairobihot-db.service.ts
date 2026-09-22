// lib/scrapers/nairobihot-db.service.ts
import { NairobiHotEscort } from "./nairobihot.scrapers";
import {
  Escort,
  Location,
  Rate,
  OpeningHours,
  Plan,
} from "@/server-actions/escort.action";

export class NairobiHotDatabaseService {
  static async escortExists(_username: string): Promise<boolean> {
    return false;
  }

  static convertToEscortModel(
    scrapedData: Partial<NairobiHotEscort>,
    fullDetails?: Partial<NairobiHotEscort>,
  ): Escort {
    const now = new Date();
    const merged = { ...scrapedData, ...fullDetails };

    const locations: Location[] = [
      {
        region: merged.town || merged.county || "Nairobi",
        town: merged.town || "",
        estate: "",
        address: "",
        street: "",
        postalCode: "",
        isActive: true,
        notes: "",
      },
    ];

    const rates: Rate[] = [];
    if (merged.incallRate || merged.outcallRate) {
      rates.push({
        duration: "1 hour",
        incall: merged.incallRate || "ASK",
        outcall: merged.outcallRate || "ASK",
      });
    }

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
      type: "free",
      isActive: true,
      features: [],
    };

    return {
      id: merged.id || merged.username || "",
      name: merged.name || "",
      username: merged.username || "",
      previewPhoto: merged.previewPhoto || "",
      labels: merged.isVip ? ["VIP"] : [],
      email: `${merged.username}@nairobihot.com`,
      age: merged.age || "",
      telephone: merged.telephone || "",
      whatsappPhone: merged.telephone || "",
      images: merged.images || [],
      videos: [],
      about: merged.about || merged.description || "",
      availability: ["24/7"],
      ethnicity: "African",
      nationality: merged.nationality || "Kenyan",
      bustSize: "",
      weight: "",
      zodiacSign: "",
      sexualOrientation: merged.sexualOrientation || "Straight",
      gender: merged.gender || "Female",
      languages: ["English", "Swahili"],
      categories: merged.services || [],
      country: "Kenya",
      county: merged.county || "Nairobi",
      countyCode: (merged.county || "Nairobi")
        .toLowerCase()
        .replace(/\s+/g, "_"),
      regions: [merged.county || "Nairobi"],
      primaryRegion: merged.town || merged.county || "Nairobi",
      locations: locations,
      source: "nairobihot.com",
      practices: merged.services || [],
      bdsm: [],
      massage: (merged.services || []).filter((s) =>
        s.toLowerCase().includes("massage"),
      ),
      extraServices: [],
      slug: merged.username || "",
      role: "escort",
      openingHours: openingHours,
      rates: rates,
      breastSize: "",
      ageCategory: merged.age
        ? parseInt(merged.age) < 25
          ? "Young"
          : parseInt(merged.age) < 35
            ? "Adult"
            : "Mature"
        : "",
      character: "",
      hairColor: "",
      experience: "",
      workType: "Independent",
      isAgencyFeatured: merged.isVip || false,
      isActive: true,
      isVerified: false,
      isFeatured: merged.isVip || false,
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
    _scrapedData: Partial<NairobiHotEscort>,
    _fullDetails?: Partial<NairobiHotEscort>,
  ): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: "Firebase removed" };
  }

  static async saveEscorts(
    _escorts: Partial<NairobiHotEscort>[],
  ): Promise<{ success: number; failed: number }> {
    return { success: 0, failed: 0 };
  }
}
