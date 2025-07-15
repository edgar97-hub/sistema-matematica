// src/lib/auth.ts o src/lib/services/auth.frontend.service.ts
import { apiClient } from "../apiClient"; // Tu instancia de Axios/fetch
import { UserPwa } from "../../store/auth.store"; // Tu interfaz UserPwa del frontend

const PWA_PROFILE_URL = `${process.env.NEXT_PUBLIC_API_URL}/auth/pwa/profile`;

export async function fetchPwaUserProfile(token: string): Promise<UserPwa> {
  try {
    const response = await apiClient.get<UserPwa>(PWA_PROFILE_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("Frontend Service: Profile data received:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Frontend Service: Error fetching PWA user profile:", error);
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch user profile.";
    throw new Error(errorMessage);
  }
}
