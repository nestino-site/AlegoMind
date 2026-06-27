"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { Provider, ProfessionalType, SessionFormat } from "@/lib/types";

export interface ProvidersQuery {
  type?: ProfessionalType;
  specialization?: string;
  sessionFormat?: SessionFormat;
  availableNow?: boolean;
  minRating?: number;
  maxPrice?: number;
  isVerified?: boolean;
  page?: number;
  limit?: number;
  /** Switches to GET /professionals/recommended (personalized, requires auth). */
  recommended?: boolean;
}

interface ApiProfessional {
  id: string;
  displayName?: string;
  avatarUrl?: string;
  type: ProfessionalType;
  specializations: string[];
  rating: number;
  reviewCount: number;
  sessionCount: number;
  experienceYears: number;
  pricePerSession: number;
  sessionFormats: SessionFormat[];
  isVerified?: boolean;
  bio?: string;
  responseRate?: number;
  /** The API includes the joined user object with name + avatar. */
  user?: {
    firstName: string | null;
    displayName: string | null;
    avatar: string | null;
  };
}

interface ApiResponse {
  items: ApiProfessional[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** GET /professionals/recommended has no pagination — just a scored list. */
interface ApiRecommendedResponse {
  items: ApiProfessional[];
  scored: boolean;
}

function toProvider(p: ApiProfessional): Provider {
  return {
    id: p.id,
    displayName: p.user?.displayName ?? p.user?.firstName ?? p.displayName ?? "Anonim",
    avatarUrl: p.user?.avatar ?? p.avatarUrl,
    type: p.type,
    specializations: p.specializations,
    rating: p.rating,
    reviewCount: p.reviewCount,
    sessionCount: p.sessionCount,
    experienceYears: p.experienceYears,
    pricePerSession: p.pricePerSession,
    formats: p.sessionFormats,
    availability: "available", // derive from real availability endpoint if needed
    bio: p.bio,
    responseRate: p.responseRate,
    isVerified: p.isVerified,
  };
}

export function useProviders(query?: ProvidersQuery) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    // `undefined` query is a deliberate "not ready yet" signal from callers
    // (e.g. the dashboard waiting on hasOnboarded) — skip the fetch entirely.
    if (query === undefined) return;

    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams();
    if (query?.type)           params.set("type", query.type);
    if (query?.specialization) params.set("specialization", query.specialization);
    if (query?.sessionFormat)  params.set("sessionFormat", query.sessionFormat);
    if (query?.availableNow)   params.set("availableNow", "true");
    if (query?.minRating)      params.set("minRating", String(query.minRating));
    if (query?.maxPrice)       params.set("maxPrice", String(query.maxPrice));
    if (query?.isVerified)     params.set("isVerified", "true");
    if (query?.page)           params.set("page", String(query.page));
    if (query?.limit)          params.set("limit", String(query.limit));

    const qs = params.toString();
    const path = query?.recommended ? "/professionals/recommended" : "/professionals";
    api
      .get<ApiResponse | ApiRecommendedResponse>(`${path}${qs ? `?${qs}` : ""}`)
      .then((res) => {
        if (!cancelled) {
          setProviders(res.items.map(toProvider));
          setTotal("total" in res ? res.total : res.items.length);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(query)]);

  return { providers, total, loading, error };
}
