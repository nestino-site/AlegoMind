import { api } from "./client";
import type { SessionFormat } from "@/lib/types";

export interface CreateBookingPayload {
  professionalId: string;
  sessionType: SessionFormat;
  durationMinutes: number;
  scheduledAt: string; // ISO string, e.g. "2026-07-10T09:00:00Z"
  isTrial?: boolean;
}

export interface BookingProfessional {
  id: string;
  type: "THERAPIST" | "COACH" | "MENTOR";
  user: {
    firstName: string | null;
    displayName: string | null;
    avatar: string | null;
  };
}

export interface Booking {
  id: string;
  professionalId: string;
  seekerId: string;
  sessionType: SessionFormat;
  durationMinutes: number;
  scheduledAt: string;
  price: number;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  stripePaymentIntentId: string;
  professional?: BookingProfessional;
  createdAt?: string;
}

export interface BookingResult {
  booking: Booking;
  clientSecret: string | null;
}

export const bookingsApi = {
  /** POST /bookings — creates booking + Stripe PaymentIntent (or bypass in test mode) */
  create: (payload: CreateBookingPayload) =>
    api.post<BookingResult>("/bookings", payload),

  /** POST /bookings/:id/confirm — call after Stripe confirms payment client-side */
  confirm: (bookingId: string) =>
    api.post<void>(`/bookings/${bookingId}/confirm`, {}),

  /** POST /bookings/:id/cancel — cancel a booking (≥24h before session) */
  cancel: (bookingId: string) =>
    api.post<Booking>(`/bookings/${bookingId}/cancel`, {}),

  /** GET /bookings/my — all seeker bookings, includes professional info */
  getMy: () => api.get<Booking[]>("/bookings/my"),
};
