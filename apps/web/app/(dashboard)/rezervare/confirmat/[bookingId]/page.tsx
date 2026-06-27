"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { bookingsApi, type Booking } from "@/lib/api/bookings";

const MONTH_NAMES = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
];
const DAY_NAMES = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];

function formatDateRo(iso: string) {
  const d = new Date(iso);
  return `${DAY_NAMES[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function formatTimeRo(iso: string) {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export default function ConfirmatPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsApi.getMy().then((bookings) => {
      const found = bookings.find((b) => b.id === bookingId);
      setBooking(found ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [bookingId]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto text-center py-24 space-y-4">
        <div className="h-16 w-16 rounded-full bg-gray-100 animate-pulse mx-auto" />
        <div className="h-5 w-48 rounded-lg bg-gray-100 animate-pulse mx-auto" />
      </div>
    );
  }

  const professionalName =
    booking?.professional?.user?.displayName ??
    booking?.professional?.user?.firstName ??
    "Profesionistul";

  return (
    <div className="max-w-lg mx-auto pb-28 pt-8 text-center">
      {/* Success icon */}
      <div className="flex items-center justify-center mb-6">
        <div className="h-20 w-20 rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#10b981" />
            <path d="M7 12.5l3.5 3.5 6.5-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-text-primary mb-2">Rezervare confirmată!</h1>
      <p className="text-sm text-text-secondary mb-8">
        Ședința ta cu {professionalName} a fost programată cu succes.
      </p>

      {booking && (
        <div className="rounded-2xl border border-border bg-white p-5 shadow-card mb-6 text-left">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Profesionist</span>
              <span className="font-medium text-text-primary">{professionalName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Data</span>
              <span className="font-medium text-text-primary">{formatDateRo(booking.scheduledAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Ora</span>
              <span className="font-medium text-text-primary">{formatTimeRo(booking.scheduledAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Durată</span>
              <span className="font-medium text-text-primary">{booking.durationMinutes} minute</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Sumă achitată</span>
              <span className="font-semibold text-brand-500">{booking.price} RON</span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Link
          href="/sesiuni"
          className="block w-full rounded-2xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          Vezi sesiunile mele
        </Link>
        <Link
          href="/acasa"
          className="block w-full rounded-2xl border border-border bg-white py-3 text-sm font-semibold text-text-primary hover:bg-bg transition-colors"
        >
          Înapoi acasă
        </Link>
      </div>
    </div>
  );
}
