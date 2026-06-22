// types/county.types.ts
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

export interface County extends ICounty {
  slug: string; // Extend with slug
}