import { apiClient } from "../apiClient";

export interface SystemSettingsData {
  openAiPromptBase?: string | null;
  welcomeCreditEnabled: boolean;
  welcomeCreditAmount: number;
}

export interface SystemSettingsResponse extends SystemSettingsData {
  id: string; // El backend probablemente devuelva el ID
  // ... otros campos que devuelva la API (createdAt, updatedAt)
}

export const settingsService = {
  async getSettings(): Promise<SystemSettingsResponse> {
    const response = await apiClient.get<SystemSettingsResponse>(
      "/configuration"
    );
    return response.data;
  },

  async updateSettings(
    data: SystemSettingsData
  ): Promise<SystemSettingsResponse> {
    const response = await apiClient.patch<SystemSettingsResponse>(
      "/configuration",
      data
    );
    return response.data;
  },
};
