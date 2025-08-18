import { apiClient } from "../apiClient";

export interface SystemSettingsData {
  openAiPromptBase?: string | null;
  welcomeCreditEnabled: boolean;
  welcomeCreditAmount: number;
  whatsappNumber?: string | null;
}

export interface SystemSettingsResponse extends SystemSettingsData {
  id: string;
  logoUrl?: string | null;
}

export const settingsService = {
  async getSettings(): Promise<SystemSettingsResponse> {
    const response = await apiClient.get<SystemSettingsResponse>(
      "/configuration"
    );
    return response.data;
  },

  async updateSettings(data: FormData): Promise<SystemSettingsResponse> {
    const response = await apiClient.patch<SystemSettingsResponse>(
      "/configuration",
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },
};
