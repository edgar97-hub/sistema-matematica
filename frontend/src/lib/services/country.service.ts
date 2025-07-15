// src/lib/services/country.service.ts
import { apiClient } from "../apiClient"; // Asume tu apiClient configurado
import {
  CountryFE,
  PaginatedCountriesResponse,
  CreateCountryData,
  UpdateCountryData,
} from "../../types/country.types"; // Ajusta ruta

// Asume que en tu backend el controlador está en '/countries' o '/educational-content/countries'
const API_ENDPOINT = "/countries"; // AJUSTA ESTO A TU ENDPOINT REAL

export const countryService = {
  async getCountries(): // Podrías añadir parámetros de paginación, filtro, ordenamiento si el backend los soporta
  // page: number = 1,
  // limit: number = 10,
  Promise<PaginatedCountriesResponse | CountryFE[]> {
    // El backend podría devolver paginado o un array simple
    // const params: any = { page, limit };
    const response = await apiClient.get<
      PaginatedCountriesResponse | CountryFE[]
    >(`${API_ENDPOINT}`); // , { params });
    return response.data;
  },

  async getCountryById(id: string): Promise<CountryFE> {
    const response = await apiClient.get<CountryFE>(`${API_ENDPOINT}/${id}`);
    return response.data;
  },

  async createCountry(data: CreateCountryData): Promise<CountryFE> {
    const response = await apiClient.post<CountryFE>(API_ENDPOINT, data);
    return response.data;
  },

  async updateCountry(id: string, data: UpdateCountryData): Promise<CountryFE> {
    console.log("data", data);
    const response = await apiClient.patch<CountryFE>(
      `${API_ENDPOINT}/${id}`,
      data
    );
    return response.data;
  },

  async deleteCountry(id?: number): Promise<void> {
    // O podría ser un PATCH para cambiar isActive a false (soft delete)
    if (id) {
      await apiClient.delete(`${API_ENDPOINT}/${id}`);
    }
  },

  // Endpoint PWA que ya tenías en el backend para listar países activos
  async getPwaActiveCountries(): Promise<CountryFE[]> {
    const response = await apiClient.get<CountryFE[]>(
      `${API_ENDPOINT}/pwa-list`
    );
    return response.data;
  },

  async getActiveCountriesForPwa(): Promise<CountryFE[]> {
    const response = await apiClient.get<CountryFE[]>(
      `${API_ENDPOINT}/pwa-list`
    );
    return response.data;
  },
};
