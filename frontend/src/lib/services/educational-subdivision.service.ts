// src/lib/services/educational-subdivision.service.ts
import { apiClient } from "../apiClient";
import {
  EducationalSubdivisionFE,
  PaginatedEducationalSubdivisionsResponse,
  CreateEducationalSubdivisionData,
  UpdateEducationalSubdivisionData,
} from "../../types/educational-content.types"; // Ajusta ruta

interface ListSubdivisionParams {
  page?: number;
  limit?: number;
  sortField?: string;
  sortDirection?: "ASC" | "DESC";
  educationalStageId?: string | number; // Para filtrar por etapa
  name?: string;
  isActive?: boolean;
}

export const educationalSubdivisionService = {
  async getEducationalSubdivisions(
    params?: ListSubdivisionParams
  ): Promise<
    PaginatedEducationalSubdivisionsResponse | EducationalSubdivisionFE[]
  > {
    const response = await apiClient.get<
      PaginatedEducationalSubdivisionsResponse | EducationalSubdivisionFE[]
    >("/educational-subdivisions", { params });
    return response.data;
  },

  async getEducationalSubdivisionById(
    id: string
  ): Promise<EducationalSubdivisionFE> {
    const response = await apiClient.get<EducationalSubdivisionFE>(
      `/educational-subdivisions/${id}`
    );
    return response.data;
  },

  async createEducationalSubdivision(
    data: CreateEducationalSubdivisionData
  ): Promise<EducationalSubdivisionFE> {
    const response = await apiClient.post<EducationalSubdivisionFE>(
      "/educational-subdivisions",
      data
    );
    return response.data;
  },

  async updateEducationalSubdivision(
    id: string,
    data: UpdateEducationalSubdivisionData
  ): Promise<EducationalSubdivisionFE> {
    const response = await apiClient.patch<EducationalSubdivisionFE>(
      `/educational-subdivisions/${id}`,
      data
    );
    return response.data;
  },

  async deleteEducationalSubdivision(id: string): Promise<void> {
    await apiClient.delete(`/educational-subdivisions/${id}`);
  },
  async getSubdivisionsByStageIdForPwa(
    id: string
  ): Promise<EducationalSubdivisionFE[]> {
    const response = await apiClient.get<EducationalSubdivisionFE[]>(
      `/educational-subdivisions/by-stage/${id}/pwa-list`
    );
    return response.data;
  },
};
