// En orderService.ts
import { OrderFE /*...*/, PaginatedResponse } from "../../types/order.types"; // Necesitas esta interfaz
import { apiClient } from "../apiClient"; // Asume que tienes un apiClient configurado

export interface CreateOrderFrontendData extends FormData {} // Solo para tipado

export const orderService = {
  async createOrderPwa(
    formData: FormData,
    authToken: string
  ): Promise<OrderFE> {
    const response = await apiClient.post<OrderFE>("/orders", formData, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
  async getMyOrdersPwa(
    params: {
      page: number;
      limit: number;
      filters?: { status?: string };
      sort?: { field: string; direction: string };
    },
    token: string
  ): Promise<PaginatedResponse<OrderFE>> {
    const response = await apiClient.get<PaginatedResponse<OrderFE>>(
      "/orders/pwa/my-orders",
      {
        headers: { Authorization: `Bearer ${token}` },
        params,
      }
    );
    console.log(response.data);
    return response.data;
  },
  async getOrderByIdPwa(orderId: string, token: string): Promise<OrderFE> {
    const response = await apiClient.get<OrderFE>(`/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  async getAdminResolutionOrders(
    params: {
      page?: number;
      limit?: number;
      userName?: string;
      startDate?: string;
      endDate?: string;
    },
    token: string
  ): Promise<PaginatedResponse<OrderFE>> {
    const response = await apiClient.get<PaginatedResponse<OrderFE>>(
      "/orders/admin/resolution-orders",
      {
        headers: { Authorization: `Bearer ${token}` },
        params,
      }
    );
    return response.data;
  },
};
