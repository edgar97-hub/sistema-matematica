// src/types/credit-package.types.ts
export interface CreditPackageFE {
  id?: string;
  name?: string;
  description?: string | null;
  creditAmount?: number;
  price?: number;
  isActive?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
export type CreateCreditPackageData = Omit<
  CreditPackageFE,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateCreditPackageData = Partial<CreateCreditPackageData>;
