import type { Provider, Review } from "@/lib/types";
import { api } from "./client";

export interface ProvidersQuery {
  type?: "TERAPEUT" | "COACH" | "MENTOR";
  specialization?: string;
  format?: string;
  available?: boolean;
  minRating?: number;
  page?: number;
  limit?: number;
}

export interface ProvidersResponse {
  data: Provider[];
  total: number;
  page: number;
  limit: number;
}

export const providersApi = {
  list: (query?: ProvidersQuery) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    );
    const qs = params.toString();
    return api.get<ProvidersResponse>(`/professionals${qs ? `?${qs}` : ""}`);
  },

  get: (id: string) => api.get<Provider>(`/professionals/${id}`),

  getReviews: (id: string) => api.get<Review[]>(`/professionals/${id}/reviews`),
};
