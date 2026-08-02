// models/escort.model.ts
import mongoose, { Schema, Document, Types, Model } from "mongoose";
import { ICounty } from "./County";
import { IRegion } from "./Region";
import { IAgency } from "@/types/agency.types";

// ============ INTERFACES ============

export interface OpeningHour {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface Rate {
  duration: string;
  incall: string;
  outcall?: string;
  region?: Types.ObjectId;
}

export interface PlanDetails {
  type: "basic" | "vip" | "premium";
  isActive: boolean;
  activatedAt?: Date;
  expiresAt?: Date;
  features: string[];
}

export interface LocationDetail {
  region: Types.ObjectId;
  town?: string;
  estate?: string;
  address?: string;
  street?: string;
  postalCode?: string;
  isActive: boolean;
  notes?: string;
  _id?: Types.ObjectId;
}

export interface EscortDoc extends Document {
  // Basic Info
  name?: string;
  clerkUserId?: string;
  username?: string;
  previewPhoto?: string;
  email: string;
  labels: string[];
  age?: string;
  telephone?: string;
  whatsappPhone?: string;
  images: string[];
  videos: string[];
  about?: string;
  availability?: string[];
  ethnicity?: string;
  nationality?: string;
  bustSize?: string;
  weight?: string;
  source?: string;
  zodiacSign?: string;
  sexualOrientation?: string | null;
  gender?: "girl" | "boy" | "transgender" | "non-binary" | "other";

  // Languages & Categories
  languages: string[];
  categories: string[];

  // Location fields - Multi-region support
  country: string;
  county: Types.ObjectId;
  countyCode?: string;
  regions: Types.ObjectId[];
  primaryRegion?: Types.ObjectId;
  locations: LocationDetail[];

  // Services
  practices: string[];
  bdsm: string[];
  massage: string[];
  extraServices: string[];

  // SEO
  slug: string;

  // Role
  role: "escort" | "business" | "admin" | "user";

  // Hours & Rates
  openingHours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  rates: Rate[];

  // Physical Attributes
  breastSize?: string;
  ageCategory?: string;
  character?: string;
  hairColor?: string;
  experience?: string;

  // Agency Relationship
  workType?: "independent" | "agency_employee";
  agencyId?: Types.ObjectId;
  agencyRole?: "owner" | "manager" | "employee" | "independent_contractor";
  agencyCommissionRate?: number;
  isAgencyFeatured?: boolean;

  // Status
  isActive: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  credits: number;
  user?: Types.ObjectId;

  // Plan
  plan: PlanDetails;

  // Statistics
  totalBookings: number;
  totalReviews: number;
  rating: number;
  totalViews: number;

  // Virtual populated fields
  countyDetails?: ICounty;
  regionsDetails?: IRegion[];
  primaryRegionDetails?: IRegion;
  agencyDetails?: IAgency;
  locationsWithDetails?: (LocationDetail & { regionDetails: IRegion })[];

  // Virtual getters
  primaryLocationDisplay: string;
  allLocationsDisplay: string[];
  workingAreas: {
    id: Types.ObjectId;
    name: string;
    countyName?: string;
    isPrimary: boolean;
    locationDetails?: LocationDetail;
  }[];
  workTypeDisplay: string;

  // Instance methods
  getPrimaryLocationDisplay(): string;
  getAllLocationsDisplay(): string[];
  worksInRegion(regionId: string | Types.ObjectId): boolean;
  addLocation(
    locationData: Omit<LocationDetail, "isActive" | "_id"> & {
      isActive?: boolean;
    },
  ): void;
  removeLocation(regionId: string | Types.ObjectId): void;
  setPrimaryRegion(regionId: string | Types.ObjectId): void;
  getLocationForRegion(
    regionId: string | Types.ObjectId,
  ): LocationDetail | undefined;
}

// ============ STATIC METHODS INTERFACE ============

export interface EscortModel extends Model<EscortDoc> {
  findByRegion(regionId: string | Types.ObjectId): Promise<EscortDoc[]>;
  findByCounty(countyId: string | Types.ObjectId): Promise<EscortDoc[]>;
  findByLocation(
    regionId: string | Types.ObjectId,
    town?: string,
  ): Promise<EscortDoc[]>;
  getRegionStats(countyId?: string | Types.ObjectId): Promise<
    Array<{
      _id: Types.ObjectId;
      regionName: string;
      countyId: Types.ObjectId;
      count: number;
      escorts: Array<{ id: Types.ObjectId; name: string }>;
    }>
  >;
  getActiveCount(): Promise<number>;
  getVerifiedCount(): Promise<number>;
}

// ============ SCHEMA DEFINITION ============

const LocationDetailSchema = new Schema<LocationDetail>(
  {
    region: {
      type: Schema.Types.ObjectId,
      ref: "Region",
      required: true,
      index: true,
    },
    town: {
      type: String,
      trim: true,
      default: "",
    },
    estate: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    street: {
      type: String,
      trim: true,
      default: "",
    },
    postalCode: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: true,
    timestamps: false,
  },
);

const RateSchema = new Schema<Rate>(
  {
    duration: {
      type: String,
      required: true,
    },
    incall: {
      type: String,
      default: "",
    },
    outcall: {
      type: String,
      default: "",
    },
    region: {
      type: Schema.Types.ObjectId,
      ref: "Region",
    },
  },
  {
    _id: true,
    timestamps: false,
  },
);

const PlanDetailsSchema = new Schema<PlanDetails>(
  {
    type: {
      type: String,
      enum: ["basic", "vip", "premium"],
      default: "basic",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    activatedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    features: {
      type: [String],
      default: [],
    },
  },
  {
    _id: false,
    timestamps: false,
  },
);

const EscortSchema = new Schema<EscortDoc, EscortModel>(
  {
    // Basic Info
    name: {
      type: String,
      trim: true,
    },
    clerkUserId: {
      type: String,
      index: true,
      sparse: true,
    },
    username: {
      type: String,
      unique: true,
      trim: true,
      sparse: true,
    },
    previewPhoto: {
      type: String,
      trim: true,
    },
    labels: {
      type: [String],
      default: [],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    age: {
      type: String,
    },
    telephone: {
      type: String,
    },
    whatsappPhone: {
      type: String,
    },
    images: {
      type: [String],
      default: [],
    },
    videos: {
      type: [String],
      default: [],
    },
    about: {
      type: String,
    },
    availability: {
      type: [String],
      default: [],
    },
    ethnicity: {
      type: String,
      default: "",
    },
    nationality: {
      type: String,
      default: "",
    },
    bustSize: {
      type: String,
    },
    weight: {
      type: String,
    },
    zodiacSign: {
      type: String,
    },
    sexualOrientation: {
      type: String,
      default: null,
    },
    gender: {
      type: String,
      enum: ["girl", "boy", "transgender", "non-binary", "other"],
      default: "girl",
      trim: true,
      index: true,
    },

    // Languages & Categories
    languages: {
      type: [String],
      default: [],
    },
    categories: {
      type: [String],
      default: [],
    },

    // Location fields - Multi-region support
    country: {
      type: String,
      trim: true,
      default: "Kenya",
      index: true,
    },
    county: {
      type: Schema.Types.ObjectId,
      ref: "County",
      required: true,
      index: true,
    },
    countyCode: {
      type: String,
      trim: true,
      index: true,
    },
    regions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Region",
        index: true,
      },
    ],
    primaryRegion: {
      type: Schema.Types.ObjectId,
      ref: "Region",
      index: true,
    },
    locations: [LocationDetailSchema],

    // Services
    source: {
      type: String,
      default: "custom",
    },
    practices: {
      type: [String],
      default: [],
    },
    bdsm: {
      type: [String],
      default: [],
    },
    massage: {
      type: [String],
      default: [],
    },
    extraServices: {
      type: [String],
      default: [],
    },

    // SEO
    slug: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },

    // Role
    role: {
      type: String,
      enum: ["escort", "business", "admin", "user"],
      default: "escort",
    },

    // Hours
    openingHours: {
      monday: { type: String, default: "Not Specified" },
      tuesday: { type: String, default: "Not Specified" },
      wednesday: { type: String, default: "Not Specified" },
      thursday: { type: String, default: "Not Specified" },
      friday: { type: String, default: "Not Specified" },
      saturday: { type: String, default: "Not Specified" },
      sunday: { type: String, default: "Not Specified" },
    },

    // Rates
    rates: [RateSchema],

    // Physical Attributes
    breastSize: {
      type: String,
      default: "",
    },
    ageCategory: {
      type: String,
      default: "",
    },
    character: {
      type: String,
      default: "",
    },
    hairColor: {
      type: String,
      default: "",
    },
    experience: {
      type: String,
      default: "",
    },

    // Agency Relationship
    workType: {
      type: String,
      enum: ["independent", "agency_employee"],
      default: "independent",
      index: true,
    },
    agencyId: {
      type: Schema.Types.ObjectId,
      ref: "Agency",
      index: true,
      sparse: true,
    },
    agencyRole: {
      type: String,
      enum: ["owner", "manager", "employee", "independent_contractor"],
    },
    agencyCommissionRate: {
      type: Number,
      min: 0,
      max: 100,
    },
    isAgencyFeatured: {
      type: Boolean,
      default: false,
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    credits: {
      type: Number,
      default: 0,
      min: 0,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      sparse: true,
    },

    // Plan
    plan: PlanDetailsSchema,

    // Statistics
    totalBookings: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalViews: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        const { __v, ...rest } = ret;
        return rest;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        const { __v, ...rest } = ret;
        return rest;
      },
    },
  },
);

// ============ VIRTUALS ============

// County details
EscortSchema.virtual("countyDetails", {
  ref: "County",
  localField: "county",
  foreignField: "_id",
  justOne: true,
});

// All regions details
EscortSchema.virtual("regionsDetails", {
  ref: "Region",
  localField: "regions",
  foreignField: "_id",
});

// Primary region details
EscortSchema.virtual("primaryRegionDetails", {
  ref: "Region",
  localField: "primaryRegion",
  foreignField: "_id",
  justOne: true,
});

// Agency details
EscortSchema.virtual("agencyDetails", {
  ref: "Agency",
  localField: "agencyId",
  foreignField: "_id",
  justOne: true,
});

// Locations with populated region details
EscortSchema.virtual("locationsWithDetails", {
  ref: "Region",
  localField: "locations.region",
  foreignField: "_id",
});

// ============ VIRTUAL GETTERS ============

// Primary location display
EscortSchema.virtual("primaryLocationDisplay").get(function (this: EscortDoc) {
  const primaryLocation =
    this.locations?.find(
      (loc) => loc.region?.toString() === this.primaryRegion?.toString(),
    ) || this.locations?.[0];

  if (primaryLocation) {
    const parts: string[] = [];
    if (primaryLocation.estate) parts.push(primaryLocation.estate);
    if (primaryLocation.town) parts.push(primaryLocation.town);
    if (this.primaryRegionDetails?.name)
      parts.push(this.primaryRegionDetails.name);
    if (this.countyDetails?.name)
      parts.push(`${this.countyDetails.name} County`);
    return parts.length > 0 ? parts.join(", ") : "Location not specified";
  }

  return "Location not specified";
});

// All locations display
EscortSchema.virtual("allLocationsDisplay").get(function (this: EscortDoc) {
  if (!this.locations || this.locations.length === 0) {
    return ["Location not specified"];
  }

  return this.locations.map((location) => {
    const parts: string[] = [];
    if (location.estate) parts.push(location.estate);
    if (location.town) parts.push(location.town);

    if (this.regionsDetails) {
      const region = this.regionsDetails.find(
        (r) => r._id.toString() === location.region?.toString(),
      );
      if (region?.name) parts.push(region.name);
    }

    if (this.countyDetails?.name)
      parts.push(`${this.countyDetails.name} County`);
    return parts.length > 0 ? parts.join(", ") : "Location not specified";
  });
});

// Working areas summary
EscortSchema.virtual("workingAreas").get(function (this: EscortDoc) {
  if (!this.regionsDetails || this.regionsDetails.length === 0) {
    return [];
  }

  return this.regionsDetails.map((region) => ({
    id: region._id,
    name: region.name,
    countyName: this.countyDetails?.name,
    isPrimary: this.primaryRegion?.toString() === region._id.toString(),
    locationDetails: this.locations?.find(
      (l) => l.region?.toString() === region._id.toString(),
    ),
  }));
});

// Work type display
EscortSchema.virtual("workTypeDisplay").get(function (this: EscortDoc) {
  if (this.workType === "independent") {
    return "Independent Escort";
  } else if (this.agencyDetails) {
    return `Agency: ${(this.agencyDetails as IAgency).name}`;
  }
  return "Escort";
});

// ============ INSTANCE METHODS ============

// Get primary location display
EscortSchema.methods.getPrimaryLocationDisplay = function (
  this: EscortDoc,
): string {
  return this.primaryLocationDisplay;
};

// Get all locations display
EscortSchema.methods.getAllLocationsDisplay = function (
  this: EscortDoc,
): string[] {
  return this.allLocationsDisplay;
};

// Check if works in region
EscortSchema.methods.worksInRegion = function (
  this: EscortDoc,
  regionId: string | Types.ObjectId,
): boolean {
  const idStr = regionId.toString();
  return this.regions?.some((r) => r.toString() === idStr) || false;
};

// Get location for specific region
EscortSchema.methods.getLocationForRegion = function (
  this: EscortDoc,
  regionId: string | Types.ObjectId,
): LocationDetail | undefined {
  const idStr = regionId.toString();
  return this.locations?.find((l) => l.region?.toString() === idStr);
};

// Add new location
EscortSchema.methods.addLocation = function (
  this: EscortDoc,
  locationData: Omit<LocationDetail, "isActive" | "_id"> & {
    isActive?: boolean;
  },
): void {
  if (!this.locations) {
    this.locations = [];
  }

  const regionId = locationData.region;
  const existingIndex = this.locations.findIndex(
    (l) => l.region?.toString() === regionId.toString(),
  );

  if (existingIndex >= 0) {
    // Update existing
    this.locations[existingIndex] = {
      ...this.locations[existingIndex],
      ...locationData,
      isActive: locationData.isActive ?? this.locations[existingIndex].isActive,
    };
  } else {
    // Add new
    this.locations.push({
      ...locationData,
      isActive: locationData.isActive ?? true,
    });
  }

  // Add to regions array if not already there
  if (!this.regions?.some((r) => r.toString() === regionId.toString())) {
    if (!this.regions) this.regions = [];
    this.regions.push(regionId);
  }

  // Set as primary if no primary region set
  if (!this.primaryRegion) {
    this.primaryRegion = regionId;
  }
};

// Remove location
EscortSchema.methods.removeLocation = function (
  this: EscortDoc,
  regionId: string | Types.ObjectId,
): void {
  const idStr = regionId.toString();

  // Remove from locations array
  if (this.locations) {
    this.locations = this.locations.filter(
      (l) => l.region?.toString() !== idStr,
    );
  }

  // Remove from regions array
  if (this.regions) {
    this.regions = this.regions.filter((r) => r.toString() !== idStr);
  }

  // Update primary region if needed
  if (this.primaryRegion?.toString() === idStr) {
    this.primaryRegion = this.regions?.[0] || undefined;
  }
};

// Set primary region
EscortSchema.methods.setPrimaryRegion = function (
  this: EscortDoc,
  regionId: string | Types.ObjectId,
): void {
  const idStr = regionId.toString();

  if (this.regions?.some((r) => r.toString() === idStr)) {
    this.primaryRegion = new Types.ObjectId(idStr);
  }
};

// ============ STATIC METHODS ============

// Find by region
EscortSchema.statics.findByRegion = function (
  this: Model<EscortDoc>,
  regionId: string | Types.ObjectId,
) {
  return this.find({
    regions: regionId,
    isActive: true,
  }).populate("countyDetails regionsDetails primaryRegionDetails");
};

// Find by county
EscortSchema.statics.findByCounty = function (
  this: Model<EscortDoc>,
  countyId: string | Types.ObjectId,
) {
  return this.find({
    county: countyId,
    isActive: true,
  }).populate("countyDetails regionsDetails primaryRegionDetails");
};

// Find by location
EscortSchema.statics.findByLocation = function (
  this: Model<EscortDoc>,
  regionId: string | Types.ObjectId,
  town?: string,
) {
  const query: any = {
    regions: regionId,
    isActive: true,
  };

  if (town) {
    query["locations"] = {
      $elemMatch: {
        region: regionId,
        town: { $regex: town, $options: "i" },
      },
    };
  }

  return this.find(query).populate(
    "countyDetails regionsDetails primaryRegionDetails",
  );
};

// Get region statistics
EscortSchema.statics.getRegionStats = async function (
  this: Model<EscortDoc>,
  countyId?: string | Types.ObjectId,
) {
  const matchStage: any = { isActive: true };
  if (countyId) {
    matchStage.county = new Types.ObjectId(countyId.toString());
  }

  return this.aggregate([
    { $match: matchStage },
    { $unwind: "$regions" },
    {
      $group: {
        _id: "$regions",
        count: { $sum: 1 },
        escorts: {
          $push: {
            id: "$_id",
            name: { $ifNull: ["$name", "Unknown"] },
          },
        },
      },
    },
    {
      $lookup: {
        from: "regions",
        localField: "_id",
        foreignField: "_id",
        as: "regionDetails",
      },
    },
    { $unwind: "$regionDetails" },
    {
      $project: {
        _id: 1,
        regionName: "$regionDetails.name",
        countyId: "$regionDetails.county",
        count: 1,
        escorts: { $slice: ["$escorts", 10] },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

// Get active count
EscortSchema.statics.getActiveCount = async function (this: Model<EscortDoc>) {
  return this.countDocuments({ isActive: true });
};

// Get verified count
EscortSchema.statics.getVerifiedCount = async function (
  this: Model<EscortDoc>,
) {
  return this.countDocuments({ isVerified: true, isActive: true });
};

// ============ MIDDLEWARE ============

// Pre-save middleware
EscortSchema.pre("save", async function (this: EscortDoc, next) {
  // Sync countyCode with county
  if (this.county && this.isModified("county")) {
    try {
      const { County } = await import("./County");
      const countyDoc = await County.findById(this.county);
      if (countyDoc) {
        this.countyCode = countyDoc.code;
      }
    } catch (error) {
      console.error("Error syncing county code:", error);
    }
  }

  // Ensure primary region is in regions array
  if (
    this.primaryRegion &&
    !this.regions?.some((r) => r.toString() === this.primaryRegion?.toString())
  ) {
    if (!this.regions) this.regions = [];
    this.regions.push(this.primaryRegion);
  }

  // Ensure locations have corresponding entries in regions array
  if (this.locations && this.locations.length > 0) {
    this.locations.forEach((location) => {
      if (
        location.region &&
        !this.regions?.some((r) => r.toString() === location.region?.toString())
      ) {
        if (!this.regions) this.regions = [];
        this.regions.push(location.region);
      }
    });
  }

  next();
});

// ============ INDEXES ============

// Multi-region indexes
EscortSchema.index({ regions: 1, isActive: 1 });
EscortSchema.index({ primaryRegion: 1, isActive: 1 });
EscortSchema.index({ county: 1, regions: 1 });
EscortSchema.index({ "locations.region": 1, "locations.town": 1 });
EscortSchema.index({ "locations.town": 1, isActive: 1 });
EscortSchema.index({ "locations.estate": 1, isActive: 1 });

// Existing indexes
EscortSchema.index({ workType: 1, isActive: 1 });
EscortSchema.index({ agencyId: 1, isActive: 1 });
EscortSchema.index({ county: 1, workType: 1 });
EscortSchema.index({ rating: -1, totalReviews: -1 });
EscortSchema.index({ isFeatured: 1, createdAt: -1 });
EscortSchema.index({ workType: 1, isVerified: 1 });
EscortSchema.index({ gender: 1, isActive: 1 });
EscortSchema.index({ gender: 1, county: 1 });
EscortSchema.index({ gender: 1, regions: 1 });

// Text search indexes
EscortSchema.index(
  {
    name: "text",
    username: "text",
    about: "text",
    "locations.town": "text",
    "locations.estate": "text",
    categories: "text",
    practices: "text",
  },
  {
    name: "escort_text_search",
    weights: {
      name: 10,
      username: 8,
      about: 5,
      "locations.town": 7,
      "locations.estate": 6,
      categories: 4,
      practices: 3,
    },
  },
);

// ============ EXPORT ============

export default (mongoose.models.Escort as EscortModel) ||
  mongoose.model<EscortDoc, EscortModel>("Escort", EscortSchema);
