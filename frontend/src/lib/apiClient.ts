import axios, { InternalAxiosRequestConfig } from "axios"; // Importa InternalAxiosRequestConfig
import { useAuthStore } from "../store/auth.store"; // Ajusta la ruta si 'store' está en otra parte

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api", // Ejemplo, usa tu variable de entorno
  // headers: {
  //   'Content-Type': 'application/json', // Por defecto para la mayoría de las APIs REST
  // },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.endsWith("/login")
      ) {
        console.warn(
          "API client: 401 Unauthorized, logging out and redirecting to admin login."
        );
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export { apiClient };
