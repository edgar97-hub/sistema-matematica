export interface CountryFE {
  id?: number;
  name: string;
  code: string | null; // ISO 3166-1 alpha-3
  flagUrl?: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  // educationalStages?: any[]; // Opcional, si no lo necesitas en la tabla/form principal
}

export interface PaginatedCountriesResponse {
  data: CountryFE[];
  total: number;
  // page: number;
  // limit: number;
}

export type CreateCountryData = Omit<
  CountryFE,
  "id" | "createdAt" | "updatedAt" | "educationalStages"
>;

export type UpdateCountryData = Partial<
  Omit<CountryFE, "id" | "createdAt" | "updatedAt" | "educationalStages">
>;
