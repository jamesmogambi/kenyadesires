// lib/services/region.service.ts
import { slugify } from "@/lib/utils";

const COLLECTION_NAME = "regions";

export interface IRegion {
  id: string;
  name: string;
  countyCode: string;
  county: string;
  countyNumericCode?: string;
  countyId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  town?: string;
  estate?: string;
  address?: string;
  street?: string;
  postalCode?: string;
  notes?: string;
}

export interface CreateRegionDTO {
  name: string;
  county: string;
  countyNumericCode?: string;
  countyId?: string;
  countyCode?: string;
  town?: string;
  estate?: string;
  address?: string;
  street?: string;
  postalCode?: string;
  notes?: string;
}

export const COUNTY_MAP: Record<
  string,
  { code: string; name: string; numericCode: string }
> = {
  mombasa: { code: "mombasa", name: "Mombasa", numericCode: "001" },
  kwale: { code: "kwale", name: "Kwale", numericCode: "002" },
  kilifi: { code: "kilifi", name: "Kilifi", numericCode: "003" },
  "tana-river": { code: "tana-river", name: "Tana River", numericCode: "004" },
  lamu: { code: "lamu", name: "Lamu", numericCode: "005" },
  "taita-taveta": {
    code: "taita-taveta",
    name: "Taita Taveta",
    numericCode: "006",
  },
  garissa: { code: "garissa", name: "Garissa", numericCode: "007" },
  wajir: { code: "wajir", name: "Wajir", numericCode: "008" },
  mandera: { code: "mandera", name: "Mandera", numericCode: "009" },
  marsabit: { code: "marsabit", name: "Marsabit", numericCode: "010" },
  isiolo: { code: "isiolo", name: "Isiolo", numericCode: "011" },
  meru: { code: "meru", name: "Meru", numericCode: "012" },
  "tharaka-nithi": {
    code: "tharaka-nithi",
    name: "Tharaka Nithi",
    numericCode: "013",
  },
  embu: { code: "embu", name: "Embu", numericCode: "014" },
  kitui: { code: "kitui", name: "Kitui", numericCode: "015" },
  machakos: { code: "machakos", name: "Machakos", numericCode: "016" },
  makueni: { code: "makueni", name: "Makueni", numericCode: "017" },
  nyandarua: { code: "nyandarua", name: "Nyandarua", numericCode: "018" },
  nyeri: { code: "nyeri", name: "Nyeri", numericCode: "019" },
  kirinyaga: { code: "kirinyaga", name: "Kirinyaga", numericCode: "020" },
  muranga: { code: "muranga", name: "Murang'a", numericCode: "021" },
  kiambu: { code: "kiambu", name: "Kiambu", numericCode: "022" },
  turkana: { code: "turkana", name: "Turkana", numericCode: "023" },
  "west-pokot": { code: "west-pokot", name: "West Pokot", numericCode: "024" },
  samburu: { code: "samburu", name: "Samburu", numericCode: "025" },
  "trans-nzoia": {
    code: "trans-nzoia",
    name: "Trans Nzoia",
    numericCode: "026",
  },
  "uasin-gishu": {
    code: "uasin-gishu",
    name: "Uasin Gishu",
    numericCode: "027",
  },
  "elgeyo-marakwet": {
    code: "elgeyo-marakwet",
    name: "Elgeyo Marakwet",
    numericCode: "028",
  },
  nandi: { code: "nandi", name: "Nandi", numericCode: "029" },
  baringo: { code: "baringo", name: "Baringo", numericCode: "030" },
  laikipia: { code: "laikipia", name: "Laikipia", numericCode: "031" },
  nakuru: { code: "nakuru", name: "Nakuru", numericCode: "032" },
  narok: { code: "narok", name: "Narok", numericCode: "033" },
  kajiado: { code: "kajiado", name: "Kajiado", numericCode: "034" },
  kericho: { code: "kericho", name: "Kericho", numericCode: "035" },
  bomet: { code: "bomet", name: "Bomet", numericCode: "036" },
  kakamega: { code: "kakamega", name: "Kakamega", numericCode: "037" },
  vihiga: { code: "vihiga", name: "Vihiga", numericCode: "038" },
  bungoma: { code: "bungoma", name: "Bungoma", numericCode: "039" },
  busia: { code: "busia", name: "Busia", numericCode: "040" },
  siaya: { code: "siaya", name: "Siaya", numericCode: "041" },
  kisumu: { code: "kisumu", name: "Kisumu", numericCode: "042" },
  "homa-bay": { code: "homa-bay", name: "Homa Bay", numericCode: "043" },
  migori: { code: "migori", name: "Migori", numericCode: "044" },
  kisii: { code: "kisii", name: "Kisii", numericCode: "045" },
  nyamira: { code: "nyamira", name: "Nyamira", numericCode: "046" },
  nairobi: { code: "nairobi", name: "Nairobi", numericCode: "047" },
};

export class RegionService {
  static getRegionByNameAndCounty(
    _name: string,
    _county: string,
  ): Promise<IRegion | null> {
    return Promise.resolve(null);
  }

  static getRegionById(_id: string): Promise<IRegion | null> {
    return Promise.resolve(null);
  }

  static async getCountyInfo(countyName: string) {
    const countySlug = slugify(countyName);
    return (
      COUNTY_MAP[countySlug] || {
        code: countySlug,
        name: countyName,
        numericCode: "",
      }
    );
  }

  static async createRegion(_data: CreateRegionDTO): Promise<IRegion> {
    return {
      id: "",
      name: "",
      countyCode: "",
      county: "",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static async getOrCreateRegion(
    _regionName: string,
    _county: string,
    _additionalData?: Partial<CreateRegionDTO>,
  ): Promise<IRegion> {
    return {
      id: "",
      name: _regionName,
      countyCode: "",
      county: _county,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static async getRegionsByCounty(_county: string): Promise<IRegion[]> {
    return [];
  }

  static async getAllRegions(): Promise<IRegion[]> {
    return [];
  }
}

export default RegionService;
