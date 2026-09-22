import { NextResponse } from "next/server";
import escortsData from "./escortDB.escorts.json";
import { executeQuery } from "@/lib/neon";

interface MongoId {
  $oid: string;
}

interface Location {
  region: MongoId | string;
  town: string;
  estate: string;
  address: string;
  street: string;
  postalCode: string;
  isActive: boolean;
  notes: string;
  _id: MongoId | string;
}

interface Rate {
  duration: string;
  incall: string;
  outcall: string;
  _id?: MongoId | string;
}

interface OpeningHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

interface Plan {
  type: string;
  isActive: boolean;
  features: string[];
}

interface Escort {
  _id: MongoId;
  name: string;
  username: string;
  previewPhoto: string;
  labels: string[];
  email: string;
  age: string;
  telephone: string;
  whatsappPhone: string;
  images: string[];
  videos: string[];
  about: string;
  availability: string[];
  ethnicity: string;
  nationality: string;
  bustSize: string;
  weight: string;
  zodiacSign: string;
  sexualOrientation: string;
  gender: string;
  languages: string[];
  categories: string[];
  country: string;
  county: MongoId | string;
  countyCode: string;
  regions: (MongoId | string)[];
  primaryRegion: MongoId | string;
  locations: Location[];
  source: string;
  practices: string[];
  bdsm: string[];
  massage: string[];
  extraServices: string[];
  slug: string;
  role: string;
  openingHours: OpeningHours;
  rates: Rate[];
  breastSize: string;
  ageCategory: string;
  character: string;
  hairColor: string;
  experience: string;
  workType: string;
  isAgencyFeatured: boolean;
  isActive: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  plan: Plan;
  totalBookings: number;
  totalReviews: number;
  rating: number;
  totalViews: number;
  createdAt: { $date: string };
  updatedAt: { $date: string };
  __v?: number;
}

const extractId = (id: MongoId | string | undefined): string => {
  if (!id) return "";
  if (typeof id === "string") return id;
  return id.$oid;
};

const cleanEscortData = (escort: Escort) => {
  const {_id, __v, ...escortData} = escort;
  const cleanData = {
    ...escortData,
    createdAt: new Date(escortData.createdAt.$date),
    updatedAt: new Date(escortData.updatedAt.$date),
    county: extractId(escortData.county),
    primaryRegion: extractId(escortData.primaryRegion),
    regions: escortData.regions.map((region) => extractId(region)),
    locations: escortData.locations.map((location) => ({
      ...location,
      region: extractId(location.region),
      _id: extractId(location._id),
    })),
    rates: escortData.rates.map((rate) => ({
      ...rate,
      _id: rate._id ? extractId(rate._id) : undefined,
    })),
  };
  return cleanData;
};

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        {error: "Seeding only allowed in development environment"},
        {status: 403},
      );
    }

    const escorts = Array.isArray(escortsData) ? escortsData : [escortsData];
    console.log(`📊 Processing ${escorts.length} escorts...`);

    let added = 0;
    let skipped = 0;
    let errors = 0;

    for (const escort of escorts) {
      try {
        if (!escort.name || !escort.username) {
          console.error(`❌ Invalid escort data: missing name or username`);
          errors++;
          continue;
        }

        const docId = extractId(escort._id);
        if (!docId) {
          console.error(`❌ Invalid document ID for ${escort.name}`);
          errors++;
          continue;
        }

        const existing: any[] = await executeQuery(
          `SELECT COUNT(*) as count FROM escorts WHERE id = $1`,
          [docId],
        );

        if (parseInt(existing[0]?.count || "0", 10) > 0) {
          console.log(`⚠️ Skipping ${escort.name} (${docId}) - already exists`);
          skipped++;
          continue;
        }

        const cleanData = cleanEscortData(escort);

        await executeQuery(
          `INSERT INTO escorts (
            id, name, username, preview_photo, labels, email, age, telephone, whatsapp_phone,
            images, videos, about, availability, ethnicity, nationality, bust_size, weight,
            zodiac_sign, sexual_orientation, gender, languages, categories, country, county,
            county_code, regions, primary_region, locations, source, practices, bdsm, massage,
            extra_services, slug, role, opening_hours, rates, breast_size, age_category,
            character, hair_color, experience, work_type, is_agency_featured, is_active,
            is_verified, is_featured, plan_type, plan_is_active, plan_features, plan_activated_at,
            plan_expires_at, total_bookings, total_reviews, rating, total_views, credits,
            created_at, updated_at, street, utm_source, utm_medium, utm_campaign, utm_content,
            utm_term, utm_id, utm_source_platform, landing_page, first_touch_at, registration_date,
            watermark_status, watermark_error, last_processed_at, images_metadata,
            total_images_processed, total_images_failed, has_cleaned_images, cleaned_images
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,
            $25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46,
            $47,$48,$49,$50,$51,$52,$53,$54,$55,$56,$57,$58,$59,$60,$61,$62,$63,$64,$65,$66,$67,$68,$69,$70,$71,$72,$73,$74,$75,$76,$77,$78,$79,$80,$81,$82,$83
          ) ON CONFLICT (id) DO NOTHING`,
          [
            docId, cleanData.name, cleanData.username, cleanData.previewPhoto, JSON.stringify(cleanData.labels),
            cleanData.email, cleanData.age, cleanData.telephone, cleanData.whatsappPhone,
            JSON.stringify(cleanData.images), JSON.stringify(cleanData.videos), cleanData.about, JSON.stringify(cleanData.availability),
            cleanData.ethnicity, cleanData.nationality, cleanData.bustSize, cleanData.weight,
            cleanData.zodiacSign, cleanData.sexualOrientation, cleanData.gender, JSON.stringify(cleanData.languages), JSON.stringify(cleanData.categories),
            cleanData.country, cleanData.county, cleanData.countyCode, JSON.stringify(cleanData.regions), cleanData.primaryRegion,
            JSON.stringify(cleanData.locations), cleanData.source, JSON.stringify(cleanData.practices), JSON.stringify(cleanData.bdsm), JSON.stringify(cleanData.massage),
            JSON.stringify(cleanData.extraServices), cleanData.slug, cleanData.role, JSON.stringify(cleanData.openingHours), JSON.stringify(cleanData.rates),
            cleanData.breastSize, cleanData.ageCategory, cleanData.character, cleanData.hairColor, cleanData.experience,
            cleanData.workType, cleanData.isAgencyFeatured, cleanData.isActive, cleanData.isVerified, cleanData.isFeatured,
            cleanData.plan?.type || "basic", cleanData.plan?.isActive !== undefined ? cleanData.plan.isActive : true, JSON.stringify(cleanData.plan?.features || []),
            cleanData.plan?.activatedAt || null, cleanData.plan?.expiresAt || null, cleanData.totalBookings, cleanData.totalReviews,
            cleanData.rating, cleanData.totalViews, cleanData.credits, cleanData.createdAt, cleanData.updatedAt,
            cleanData.street, cleanData.utm_source, cleanData.utm_medium, cleanData.utm_campaign, cleanData.utm_content,
            cleanData.utm_term, cleanData.utm_id, cleanData.utm_source_platform, cleanData.landing_page, cleanData.first_touch_at, cleanData.registration_date,
            null, null, null, null, null, null, null, null, JSON.stringify(cleanData.gallery || []), JSON.stringify(cleanData.videos || []),
            cleanData.establishmentYear || null, JSON.stringify(cleanData.socialMedia || {}),
          ],
        );

        added++;
        console.log(`✅ Added: ${escort.name} (${escort.age} yrs, ${escort.nationality})`);
      } catch (error) {
        console.error(`❌ Error processing ${escort.name}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      stats: { added, skipped, errors, total: escorts.length },
      message: `Successfully added ${added} escorts to Neon DB`,
    });
  } catch (error) {
    console.error("Seeding failed:", error);
    return NextResponse.json(
      {
        error: "Failed to seed escorts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        {error: "This endpoint is only available in development environment"},
        {status: 403},
      );
    }

    const result: any[] = await executeQuery(
      `SELECT COUNT(*) as count FROM escorts`,
    );
    const totalCount = parseInt(result[0]?.count || "0", 10);

    const sampleResult: any[] = await executeQuery(
      `SELECT id, name, age, nationality, created_at FROM escorts LIMIT 10`,
    );

    const escorts = sampleResult.map((doc) => ({
      id: doc.id,
      name: doc.name,
      age: doc.age,
      nationality: doc.nationality,
      location: null,
      isActive: true,
      createdAt: doc.created_at,
    }));

    return NextResponse.json({
      success: true,
      stats: { total: totalCount, sampleSize: escorts.length },
      data: escorts,
    });
  } catch (error) {
    console.error("Failed to fetch escorts:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch escorts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        {error: "This endpoint is only available in development environment"},
        {status: 403},
      );
    }

    const countResult: any[] = await executeQuery(
      `SELECT COUNT(*) as count FROM escorts`,
    );
    const totalToDelete = parseInt(countResult[0]?.count || "0", 10);

    if (totalToDelete === 0) {
      return NextResponse.json({
        success: true,
        message: "No escorts to delete",
        deletedCount: 0,
      });
    }

    await executeQuery(`DELETE FROM escorts`);

    console.log(`✅ Successfully deleted ${totalToDelete} escorts`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${totalToDelete} escorts`,
      deletedCount: totalToDelete,
    });
  } catch (error) {
    console.error("Failed to delete escorts:", error);
    return NextResponse.json(
      {
        error: "Failed to delete escorts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
