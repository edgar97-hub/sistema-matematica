// src/lib/services/educational-stage.service.ts
import { apiClient } from "../apiClient";
import {
  EducationalStageFE,
  PaginatedEducationalStagesResponse,
  CreateEducationalStageData,
  UpdateEducationalStageData,
} from "../../types/educational-content.types"; // Ajusta ruta

// Tipos para parámetros de listado (puedes crear un DTO genérico para esto)
interface ListParams {
  page?: number;
  limit?: number;
  sortField?: string;
  sortDirection?: "ASC" | "DESC";
  countryId?: string | number; // Para filtrar por país
  name?: string; // Para filtrar por nombre de etapa
  isActive?: boolean;
}

export const educationalStageService = {
  async getEducationalStages(
    params?: ListParams
  ): Promise<PaginatedEducationalStagesResponse | EducationalStageFE[]> {
    const response = await apiClient.get<
      PaginatedEducationalStagesResponse | EducationalStageFE[]
    >("/educational-stages", { params });
    return response.data;
  },

  async getEducationalStageById(id: string): Promise<EducationalStageFE> {
    const response = await apiClient.get<EducationalStageFE>(
      `/educational-stages/${id}`
    );
    return response.data;
  },

  async createEducationalStage(
    data: CreateEducationalStageData
  ): Promise<EducationalStageFE> {
    const response = await apiClient.post<EducationalStageFE>(
      "/educational-stages",
      data
    );
    return response.data;
  },

  async updateEducationalStage(
    id: string,
    data: UpdateEducationalStageData
  ): Promise<EducationalStageFE> {
    const response = await apiClient.patch<EducationalStageFE>(
      `/educational-stages/${id}`,
      data
    );
    return response.data;
  },

  async deleteEducationalStage(id: number): Promise<void> {
    await apiClient.delete(`/educational-stages/${id}`);
  },

  async getEducationalStagesForPwa(id: string): Promise<EducationalStageFE[]> {
    const response = await apiClient.get<EducationalStageFE[]>(
      `/educational-stages/by-id-country/${id}/pwa-list`
    );
    return response.data;
  },
  async getStagesByCountryNameForPwa(
    id: string
  ): Promise<EducationalStageFE[]> {
    const response = await apiClient.get<EducationalStageFE[]>(
      `/educational-stages/by-name-country/${id}/pwa-list`
    );
    return response.data;
  },
};
