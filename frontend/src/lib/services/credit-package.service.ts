// src/lib/services/credit-package.service.ts
import { apiClient } from "../apiClient"; // Asume que tienes un apiClient configurado

// Interfaz que coincide con tu CreditPackageEntity del backend
// (usando camelCase para el frontend)
export interface CreditPackageFE {
  id: string; // o number si tu BaseEntity usa number
  name?: string;
  description?: string | null;
  creditAmount?: number; // Nota el camelCase
  price?: number;
  isActive?: boolean;
  // createdAt?: string | Date; // Opcional si los necesitas en la tabla
  // updatedAt?: string | Date; // Opcional
}

// Para la respuesta de la API de listado (si tu backend devuelve paginación)
export interface PaginatedCreditPackagesResponse {
  data: CreditPackageFE[];
  total: number;
  // page: number; // Si tu API devuelve estos datos
  // limit: number; // Si tu API devuelve estos datos
}

// Para crear un nuevo paquete (omite id, createdAt, updatedAt)
export type CreateCreditPackageData = Omit<
  CreditPackageFE,
  "id" | "createdAt" | "updatedAt"
>;

// Para actualizar un paquete (todos los campos son opcionales excepto el id)
export type UpdateCreditPackageData = Partial<CreateCreditPackageData>;

export const creditPackageService = {
  // Asume que el backend devuelve un objeto con 'data' y 'total' para paginación
  // Si no hay paginación en el backend para paquetes, ajusta esto.
  async getCreditPackages(): // Podrías añadir parámetros de paginación/ordenamiento si el backend los soporta
  // page: number = 1,
  // limit: number = 10,
  // sortField?: string,
  // sortDirection?: 'ASC' | 'DESC'
  Promise<PaginatedCreditPackagesResponse | CreditPackageFE[]> {
    // Puede devolver paginado o un array simple
    // Endpoint del backend para CreditPackageController
    // Asumimos que es GET /credit-packages (ajusta si es diferente)
    const response = await apiClient.get<
      PaginatedCreditPackagesResponse | CreditPackageFE[]
    >("/credit-packages");
    return response.data;
  },

  async getCreditPackageById(id: string): Promise<CreditPackageFE> {
    const response = await apiClient.get<CreditPackageFE>(
      `/credit-packages/${id}`
    );
    return response.data;
  },

  async createCreditPackage(
    data: CreateCreditPackageData
  ): Promise<CreditPackageFE> {
    const response = await apiClient.post<CreditPackageFE>(
      "/credit-packages",
      data
    );
    return response.data;
  },

  async updateCreditPackage(
    id: string,
    data: UpdateCreditPackageData
  ): Promise<CreditPackageFE> {
    const response = await apiClient.patch<CreditPackageFE>(
      `/credit-packages/${id}`,
      data
    );
    return response.data;
  },

  async deleteCreditPackage(id: string): Promise<void> {
    await apiClient.delete(`/credit-packages/${id}`);
  },

  async getActiveCreditPackagesForPwa(): Promise<CreditPackageFE[]> {
    const response = await apiClient.get<CreditPackageFE[]>(
      "/credit-packages/users/active"
    );
    return response.data;
  },
};
