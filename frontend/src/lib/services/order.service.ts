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
    pagination: { page: number; limit: number },
    token: string
  ): Promise<PaginatedResponse<OrderFE>> {
    const response = await apiClient.get<PaginatedResponse<OrderFE>>(
      "/orders/pwa/my-orders",
      {
        headers: { Authorization: `Bearer ${token}` },
        params: pagination,
      }
    );
    return response.data;
  },
  async getOrderByIdPwa(orderId: string, token: string): Promise<OrderFE> {
    const response = await apiClient.get<OrderFE>(`/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
