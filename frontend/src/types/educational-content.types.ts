// src/types/educational-content.types.ts

// Asume que tienes una interfaz para CountryFE
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
export interface EducationalStageFE {
  id: number; // o number
  name: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
  countryId: string | number; // El ID del país al que pertenece
  country?: CountryFE; // Opcional: para mostrar el nombre del país en la tabla
  countryName?: string;
  // createdAt?: string | Date;
  // updatedAt?: string | Date;
  // educationalSubdivisions?: any[]; // Si quieres cargar subdivisiones aquí
}

export interface PaginatedEducationalStagesResponse {
  data: EducationalStageFE[];
  total: number;
  // page: number;
  // limit: number;
}

export type CreateEducationalStageData = Omit<
  EducationalStageFE,
  "id" | "country" | "createdAt" | "updatedAt" | "educationalSubdivisions"
>;
export type UpdateEducationalStageData = Partial<CreateEducationalStageData>;

export interface EducationalSubdivisionFE {
  id?: string; // o number
  name: string;
  description?: string | null;
  isActive: boolean;
  educationalStageId: string | number; // El ID de la etapa a la que pertenece
  educationalStage?: EducationalStageFE; // Opcional: para mostrar info de la etapa
  // createdAt?: string | Date;
  // updatedAt?: string | Date;
}

export interface PaginatedEducationalSubdivisionsResponse {
  data: EducationalSubdivisionFE[];
  total: number;
}

export type CreateEducationalSubdivisionData = Omit<
  EducationalSubdivisionFE,
  "id" | "educationalStage" | "createdAt" | "updatedAt"
>;
export type UpdateEducationalSubdivisionData =
  Partial<CreateEducationalSubdivisionData>;
