// src/lib/services/credit-transaction.service.ts
import { apiClient } from "../apiClient"; // Asume que tienes un apiClient configurado
import {
  CreditTransactionFE,
  PaginatedCreditTransactionsResponse,
  ListCreditTransactionsParams,
} from "../../types/credit-transaction.types"; // Ajusta ruta

interface StripeCheckoutSessionResponse {
  sessionId: string; // ID de la sesión de Stripe
  url: string; // URL a la que redirigir al usuario
}

export interface PurchaseStatusResponse {
  status: "pending_webhook" | "completed" | "failed" | "unknown";
  message: string;
  creditsAdded?: number;
  newBalance?: number;
}

export const creditTransactionService = {
  async getAllCreditTransactions(
    params?: ListCreditTransactionsParams
  ): Promise<PaginatedCreditTransactionsResponse> {
    // Endpoint del backend para CreditTransactionController GET /credit-transactions
    const response = await apiClient.get<PaginatedCreditTransactionsResponse>(
      "/credit-transactions",
      { params }
    );
    return response.data;
  },

  async getUserCreditHistory(
    userId: string | number,
    params?: Pick<
      ListCreditTransactionsParams,
      "page" | "limit" | "sortField" | "sortDirection"
    > // Solo paginación y orden
  ): Promise<PaginatedCreditTransactionsResponse> {
    const allParams = { ...params, targetUserId: userId }; // Aunque la ruta ya tiene userId, puede ser un filtro adicional si el endpoint es genérico
    // Endpoint del backend para CreditTransactionController GET /credit-transactions/history/:userId
    const response = await apiClient.get<PaginatedCreditTransactionsResponse>(
      `/credit-transactions/history/${userId}`,
      { params: params }
    );
    return response.data;
  },

  async getPurchaseStatus(sessionId: string): Promise<PurchaseStatusResponse> {
    // Este endpoint debe estar protegido para el usuario logueado
    // apiClient debe adjuntar el token automáticamente
    const response = await apiClient.get<PurchaseStatusResponse>(
      `/credit-transactions/purchase-status/${sessionId}`
    );
    return response.data;
  },

  async createStripeCheckoutSession(
    packageId: string,
    authToken: string
  ): Promise<StripeCheckoutSessionResponse> {
    const response = await apiClient.post<StripeCheckoutSessionResponse>(
      "/credit-transactions/create-checkout-session",
      { packageId },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return response.data;
  },
};
