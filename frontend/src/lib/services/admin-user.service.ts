import { apiClient } from "../apiClient";
import { PaginatedUsersAdminResponse, UserAdminFE } from "../../types/user.types";

export const adminUserService = {
  async getAllAdminUsers(
    pagination: { page: number; limit: number },
    token: string
  ): Promise<PaginatedUsersAdminResponse> {
    const response = await apiClient.get<PaginatedUsersAdminResponse>(
      "/admin-users",
      {
        headers: { Authorization: `Bearer ${token}` },
        params: pagination,
      }
    );
    return response.data;
  },

  async getAdminUserById(id: string, token: string): Promise<UserAdminFE> {
    const response = await apiClient.get<UserAdminFE>(`/admin-users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async createAdminUser(
    data: Partial<UserAdminFE>,
    token: string
  ): Promise<UserAdminFE> {
    const response = await apiClient.post<UserAdminFE>("/admin-users", data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async updateAdminUser(
    id: string,
    data: Partial<UserAdminFE>,
    token: string
  ): Promise<UserAdminFE> {
    const response = await apiClient.patch<UserAdminFE>(
      `/admin-users/${id}`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async deleteAdminUser(id: string, token: string): Promise<void> {
    await apiClient.delete(`/admin-users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};