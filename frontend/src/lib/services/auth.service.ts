// ...
import { UserPwa } from "../../store/auth.store";
import { apiClient } from "../apiClient"; // Asume tu apiClient configurado

export const authService = {
  // ... (tus otros métodos de login)

  async getMe(token: string): Promise<UserPwa> {
    const response = await apiClient.get("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};
