import { api } from "./client";
import type { SessionFormat } from "@/lib/types";

export interface CreateBookingPayload {
  professionalId: string;
  sessionType: SessionFormat;
  durationMinutes: number;
  scheduledAt: string; // ISO string, e.g. "2026-07-10T09:00:00Z"
  isTrial?: boolean;
}

export interface BookingResult {
  booking: {
    id: string;
    professionalId: string;
    seekerId: string;
    sessionType: SessionFormat;
    durationMinutes: number;
    scheduledAt: string;
    price: number;
    status: string;
    stripePaymentIntentId: string;
  };
  clientSecret: string | null;
}

export const bookingsApi = {
  /** POST /bookings — creates booking + Stripe PaymentIntent */
  create: (payload: CreateBookingPayload) =>
    api.post<BookingResult>("/bookings", payload),

  /** POST /bookings/:id/confirm — call after Stripe confirms payment client-side */
  confirm: (bookingId: string) =>
    api.post<void>(`/bookings/${bookingId}/confirm`, {}),

  /** GET /bookings/my — all seeker bookings */
  getMy: () => api.get<BookingResult["booking"][]>("/bookings/my"),
};
