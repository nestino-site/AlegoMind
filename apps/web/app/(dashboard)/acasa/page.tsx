"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { useProviders } from "@/lib/hooks/useProviders";
import { ProviderCard } from "@/components/shared/ProviderCard";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { SessionFormatChip } from "@/components/ui/SessionFormatChip";
import { api } from "@/lib/api/client";
import { IconSearch, IconMessage, IconCalendar, IconSparkle, IconArrowRight } from "@/components/ui/Icons";
import type { ProfessionalType, SessionFormat, BookingStatus } from "@/lib/types";

const QUICK_ACTIONS = [
  { href: "/explorez",    label: "Găsește furnizor",   Icon: IconSearch,   desc: "Filtrează toți furnizorii" },
  { href: "/asistent",    label: "Asistent AI",         Icon: IconSparkle,  desc: "Descrie ce simți" },
  { href: "/explorez",    label: "Rezervă ședință",     Icon: IconCalendar, desc: "Programează cu un furnizor" },
  { href: "/conversatii", label: "Conversații",          Icon: IconMessage,  desc: "Mesajele tale" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bună dimineața";
  if (h < 18) return "Bună ziua";
  return "Bună seara";
}

interface BookingWithProfessional {
  id: string;
  sessionType: SessionFormat;
  scheduledAt: string;
  status: BookingStatus;
  professional: {
    id: string;
    type: ProfessionalType;
    user: {
      firstName: string | null;
      displayName: string | null;
      avatar: string | null;
    };
  };
}

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
}

export default function DashboardHomePage() {
  const { user, hasOnboarded } = useAuth();

  // `undefined` while hasOnboarded is still resolving — useProviders skips
  // the fetch entirely for an undefined query (see useProviders.ts).
  const providersQuery =
    hasOnboarded === null ? undefined : hasOnboarded ? { recommended: true, limit: 6 } : { limit: 6 };
  const { providers, loading: providersLoading } = useProviders(providersQuery);

  const [nextBooking, setNextBooking] = useState<BookingWithProfessional | null>(null);

  useEffect(() => {
    if (hasOnboarded === null) return;
    let cancelled = false;
    api
      .get<BookingWithProfessional[]>("/bookings/my")
      .then((bookings) => {
        if (cancelled) return;
        const now = Date.now();
        const upcoming = bookings
          .filter(
            (b) =>
              (b.status === "CONFIRMED" || b.status === "PENDING") &&
              new Date(b.scheduledAt).getTime() > now,
          )
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
        setNextBooking(upcoming[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setNextBooking(null);
      });
    return () => {
      cancelled = true;
    };
  }, [hasOnboarded]);

  // Live countdown, minute precision — the card only displays days/hrs/min,
  // so a per-second tick would just be wasted re-renders.
  const [countdown, setCountdown] = useState<Countdown | null>(null);

  useEffect(() => {
    if (!nextBooking) {
      setCountdown(null);
      return;
    }
    function tick() {
      const diff = Math.max(new Date(nextBooking!.scheduledAt).getTime() - Date.now(), 0);
      setCountdown({
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
      });
    }
    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, [nextBooking]);

  const name = user?.displayName ?? user?.firstName ?? "tu";

  // ── Still resolving auth/onboarding state — minimal skeleton, no content ──
  if (hasOnboarded === null) {
    return (
      <div className="max-w-5xl mx-auto space-y-2">
        <div className="h-4 w-24 rounded-lg bg-gray-100 animate-pulse" />
        <div className="h-7 w-56 rounded-lg bg-gray-100 animate-pulse" />
      </div>
    );
  }

  const providerSectionTitle = hasOnboarded ? "Recomandați pentru tine" : "Furnizori populari";
  const providerName =
    nextBooking?.professional.user.displayName ?? nextBooking?.professional.user.firstName ?? "Furnizor";

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-24 lg:pb-0">
      {/* Greeting */}
      <div>
        <p className="text-text-muted text-sm">{getGreeting()}</p>
        <h1 className="text-2xl font-bold text-text-primary mt-0.5">
          {nextBooking ? "Bine ai revenit" : "Bun venit"}, {name}
        </h1>
      </div>

      {/* State 1 — onboarding banner */}
      {!hasOnboarded && (
        <div className="rounded-3xl border border-brand-200 bg-brand-50 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="font-semibold text-text-primary">
            Răspunde câteva întrebări pentru a găsi cea mai bună potrivire
          </p>
          <Link
            href="/onboarding/tip"
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-brand-600 transition-colors flex-shrink-0"
          >
            Completează profilul <IconArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* State 3 — upcoming session countdown */}
      {hasOnboarded && nextBooking && (
        <div className="rounded-3xl border border-brand-200 bg-white p-6 lg:p-7 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-3">
            Următoarea ședință
          </p>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-12 w-12 rounded-2xl bg-brand-50 border border-border flex items-center justify-center text-lg font-bold text-brand-500 flex-shrink-0">
              {providerName[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-text-primary truncate">{providerName}</p>
              <div className="flex items-center gap-2 mt-1">
                <TypeBadge type={nextBooking.professional.type} />
                <SessionFormatChip format={nextBooking.sessionType} />
              </div>
            </div>
          </div>
          <p className="text-sm text-text-secondary mb-5">
            {new Date(nextBooking.scheduledAt).toLocaleDateString("ro-RO", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
            {" · "}
            {new Date(nextBooking.scheduledAt).toLocaleTimeString("ro-RO", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {countdown && (
            <div className="flex gap-3">
              {[
                { value: countdown.days, label: "zile" },
                { value: countdown.hours, label: "ore" },
                { value: countdown.minutes, label: "min" },
              ].map((u) => (
                <div key={u.label} className="flex-1 rounded-2xl bg-bg py-3 text-center">
                  <p className="text-2xl font-extrabold text-brand-600">{u.value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted mt-0.5">{u.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick actions */}
      <section>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">
          Acțiuni rapide
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map(({ href, label, Icon, desc }, i) => (
            <Link
              key={`${href}-${i}`}
              href={href}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 hover:border-brand-300 hover:shadow-card transition-all group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 group-hover:bg-brand-100 transition-colors">
                <Icon size={18} className="text-brand-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{label}</p>
                <p className="text-xs text-text-muted mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Providers */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">Furnizori</p>
            <h2 className="text-lg font-bold text-text-primary">{providerSectionTitle}</h2>
          </div>
          <Link
            href="/explorez"
            className="flex items-center gap-1 text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors"
          >
            Vezi toți <IconArrowRight size={14} />
          </Link>
        </div>

        {providersLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl border border-border bg-white p-5 animate-pulse h-48" />
            ))}
          </div>
        ) : providers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((p) => (
              <ProviderCard key={p.id} provider={p} variant="list" />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-white p-10 text-center">
            <p className="text-sm text-text-muted">Niciun furnizor disponibil momentan</p>
          </div>
        )}
      </section>
    </div>
  );
}
