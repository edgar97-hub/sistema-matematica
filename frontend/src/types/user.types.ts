// Coincide con UserPwaRole del backend
export enum UserPwaRoleFE {
  CLIENT = "CLIENT",
}

// Coincide con UserEntity del backend (campos relevantes para la tabla/edición)
export interface UserPwaFE {
  id: string;
  googleId?: string;
  email: string;
  name: string;
  pictureUrl?: string;
  countryOfOrigin?: string;
  creditBalance: number;
  isActive: boolean;
  role: UserPwaRoleFE;
  createdAt: string; // O Date si lo transformas
  updatedAt: string; // O Date
}

// Para la respuesta de la API de listado
export interface PaginatedUsersResponse {
  data: UserPwaFE[];
  total: number;
  page: number;
  limit: number;
}

// Para los parámetros de la API (coincide con tus DTOs del backend)
export interface PaginationQueryFE {
  page?: number;
  limit?: number;
}

export interface FilterUserFE {
  email?: string;
  name?: string;
  isActive?: boolean | string; // El backend puede esperar boolean, el form string
  countryOfOrigin?: string;
  // Añade más campos de filtro si tu backend los soporta
}

export interface SortUserFE {
  sort?: string; // Ej: "name" o "createdAt"
  order?: "asc" | "desc";
}
