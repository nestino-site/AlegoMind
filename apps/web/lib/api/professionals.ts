import { api } from "./client";
import type { ProfessionalType, SessionFormat } from "@/lib/types";

export type DayOfWeek =
  | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY"
  | "FRIDAY" | "SATURDAY" | "SUNDAY";

export interface AvailabilitySlot {
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
}

export interface CreateProfilePayload {
  type: ProfessionalType;
  bio: string;
  specializations: string[];
  sessionFormats: SessionFormat[];
  languages: string[];
  pricePerSession: number;
  availableForTrial?: boolean;
  trialPrice?: number;
  trialDuration?: number;
  yearsExperience?: number;
  gender?: string;
}

/** Matches professionals.service.ts findOne() exactly — full profile + relations. */
export interface ProfessionalDetail {
  id: string;
  userId: string;
  type: ProfessionalType;
  bio: string;
  specializations: string[];
  sessionFormats: SessionFormat[];
  languages: string[];
  pricePerSession: number;
  trialPrice: number | null;
  trialDuration: number | null;
  availableForTrial: boolean;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  responseRate: number;
  isVerified: boolean;
  verificationBadge: string | null;
  gender: string | null;
  isAvailable: boolean;
  createdAt: string;
  user: {
    firstName: string | null;
    displayName: string | null;
    avatar: string | null;
    createdAt: string;
  };
  availability: {
    id: string;
    professionalId: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
  }[];
  reviews: {
    id: string;
    bookingId: string;
    seekerId: string;
    professionalId: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    seeker: { displayName: string | null; avatar: string | null };
  }[];
}

export const professionalsApi = {
  createProfile: (payload: CreateProfilePayload) =>
    api.post<void>("/professionals/profile", payload),

  updateProfile: (payload: Partial<CreateProfilePayload>) =>
    api.patch<void>("/professionals/profile", payload),

  setAvailability: (slots: AvailabilitySlot[]) =>
    api.post<void>("/professionals/availability", { slots }),

  getBookings: (status?: string) =>
    api.get<{ data: unknown[]; total: number }>(
      `/bookings/professional${status ? `?status=${status}` : ""}`,
    ),

  getById: (id: string) => api.get<ProfessionalDetail>(`/professionals/${id}`),
};
