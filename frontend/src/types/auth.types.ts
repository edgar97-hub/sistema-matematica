// src/types/auth.types.ts
export interface AdminUserData {
  // Datos del usuario admin que devuelve el backend
  id: string | number;
  username: string;
  name: string;
  email?: string;
  role: string; // Ej. 'ADMINISTRATOR'
  // ... cualquier otro campo que devuelva tu endpoint /auth/admin/profile o /auth/admin/login
}

export interface AuthAdminResponse {
  accessToken: string;
  user: AdminUserData;
  // refreshToken?: string; // Si tu backend lo devuelve
  // expiresIn?: number;
}
