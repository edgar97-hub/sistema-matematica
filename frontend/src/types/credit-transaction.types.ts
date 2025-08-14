// src/types/credit-transaction.types.ts

// Debe coincidir con el enum del backend
export enum CreditTransactionActionFE {
  PURCHASE_SUCCESS = "purchase_success",
  USAGE_RESOLUTION = "usage_resolution",
  WELCOME_BONUS = "welcome_bonus",
  ADMIN_ADJUSTMENT = "admin_adjustment",
}

// Para mostrar info básica del usuario en la tabla de transacciones
export interface BasicUserRef {
  id: string | number;
  name?: string;
  email?: string;
}

// Interfaz para los datos de transacción que mostrará el frontend
export interface CreditTransactionFE {
  id: string; // o number
  targetUser?: BasicUserRef; // O solo targetUserId si no cargas la info completa
  targetUserId: string | number;
  adminUser?: BasicUserRef; // O solo adminUserId
  adminUserId?: string | number | null;
  action: CreditTransactionActionFE;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reason?: string | null;
  paymentGateway?: string | null;
  gatewayTransactionId?: string | null;
  // gatewayTransactionStatus?: string | null; // Podrías no necesitar mostrarlo
  creditPackageId?: string | number | null; // Podrías mostrar el nombre del paquete
  // creditPackageName?: string; // Si tu API lo devuelve anidado
  createdAt: string; // O Date
}

export interface PaginatedCreditTransactionsResponse {
  data: CreditTransactionFE[];
  total: number;
  // page: number;
  // limit: number;
}

// Para los parámetros de la API (coincide con GetAllCreditTransactionsDto del backend)
export interface ListCreditTransactionsParams {
  page?: number;
  limit?: number;
  sortField?: string;
  sortDirection?: "ASC" | "DESC";
  startDate?: string; // Formato YYYY-MM-DD
  endDate?: string; // Formato YYYY-MM-DD
  action?: CreditTransactionActionFE;
  targetUserName?: string; // Para filtrar por nombre de usuario
}
