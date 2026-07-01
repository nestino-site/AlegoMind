"use client";

import { useEffect, useState } from "react";
import { professionalsApi } from "@/lib/api/professionals";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { IconCalendar, IconClock } from "@/components/ui/Icons";
import type { Booking } from "@/lib/api/bookings";

const MONTH_NAMES_SHORT = [
  "Ian", "Feb", "Mar", "Apr", "Mai", "Iun",
  "Iul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTH_NAMES_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

const STATUS_CHIP: Record<Booking["status"], { label: string; cls: string }> = {
  PENDING:   { label: "În așteptare", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  CONFIRMED: { label: "Confirmat",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  COMPLETED: { label: "Finalizat",    cls: "bg-blue-50 text-blue-600 border-blue-200" },
  CANCELLED: { label: "Anulat",       cls: "bg-red-50 text-red-500 border-red-200" },
};

export default function ProRezervariPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    professionalsApi
      .getBookings()
      .then(setBookings)
      .catch(() => setError("Nu am putut încărca rezervările."))
      .finally(() => setLoading(false));
  }, []);

  const upcoming = bookings.filter(
    (b) => (b.status === "PENDING" || b.status === "CONFIRMED") && new Date(b.scheduledAt) > new Date(),
  );
  const past = bookings.filter(
    (b) => b.status === "COMPLETED" || b.status === "CANCELLED" || new Date(b.scheduledAt) <= new Date(),
  );
  const displayed = tab === "upcoming" ? upcoming : past;

  return (
    <div className="max-w-3xl mx-auto pb-24 lg:pb-0">
      <div className="mb-8">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">Programare</p>
        <h1 className="text-2xl font-bold text-text-primary">Rezervări</h1>
      </div>

      <div className="flex gap-1 rounded-2xl border border-border bg-bg p-1 max-w-xs mb-6">
        {(["upcoming", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${
              tab === t ? "bg-white text-text-primary shadow-sm" : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {t === "upcoming" ? `Viitoare${!loading ? ` (${upcoming.length})` : ""}` : `Trecute${!loading ? ` (${past.length})` : ""}`}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl border border-border bg-white animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      {!loading && !error && displayed.length === 0 && (
        <div className="rounded-3xl border border-border bg-white p-12 text-center">
          <div className="h-14 w-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <IconCalendar size={24} className="text-brand-400" />
          </div>
          <p className="text-sm font-semibold text-text-primary mb-1">
            {tab === "upcoming" ? "Nicio rezervare viitoare" : "Niciun istoric de rezervări"}
          </p>
          <p className="text-xs text-text-muted max-w-xs mx-auto leading-relaxed">
            {tab === "upcoming"
              ? "Rezervările noi de la clienți vor apărea aici."
              : "Rezervările finalizate și anulate vor apărea aici."}
          </p>
        </div>
      )}

      {!loading && !error && displayed.length > 0 && (
        <div className="space-y-3">
          {displayed.map((b) => {
            const chip = STATUS_CHIP[b.status];
            const seekerName =
              (b as unknown as { seeker?: { displayName?: string | null; firstName?: string | null } })
                .seeker?.displayName ??
              (b as unknown as { seeker?: { firstName?: string | null } }).seeker?.firstName ??
              "Client";
            return (
              <div key={b.id} className="rounded-2xl border border-border bg-white p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-2xl bg-brand-50 border border-border flex items-center justify-center text-sm font-bold text-brand-500 flex-shrink-0">
                      {seekerName[0]?.toUpperCase() ?? "C"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{seekerName}</p>
                      <p className="text-xs text-text-muted">{b.sessionType}</p>
                    </div>
                  </div>
                  <span className={`inline-flex flex-shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${chip.cls}`}>
                    {chip.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
                  <span className="flex items-center gap-1">
                    <IconCalendar size={12} className="text-text-muted" />
                    {formatDate(b.scheduledAt)} · {formatTime(b.scheduledAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <IconClock size={12} className="text-text-muted" />
                    {b.durationMinutes} min
                  </span>
                  <span className="font-semibold text-brand-500">{b.price} RON</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
