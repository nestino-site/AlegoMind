"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { professionalsApi, type ProfessionalDetail, type DayOfWeek } from "@/lib/api/professionals";
import { messagesApi } from "@/lib/api/messages";
import { useAuth } from "@/lib/context/AuthContext";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { AvailabilityDot } from "@/components/ui/AvailabilityDot";
import { RatingStars } from "@/components/ui/RatingStars";
import { SessionFormatChip } from "@/components/ui/SessionFormatChip";
import { IconArrowRight, IconCheckBadge } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Luni",
  TUESDAY: "Marți",
  WEDNESDAY: "Miercuri",
  THURSDAY: "Joi",
  FRIDAY: "Vineri",
  SATURDAY: "Sâmbătă",
  SUNDAY: "Duminică",
};

const DAY_ORDER: DayOfWeek[] = [
  "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY",
];

const TABS = [
  { value: "despre", label: "Despre" },
  { value: "recenzii", label: "Recenzii" },
  { value: "program", label: "Program" },
] as const;

type Tab = (typeof TABS)[number]["value"];

function formatRelativeTime(dateStr: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (diffDays < 1) return "astăzi";
  if (diffDays === 1) return "acum 1 zi";
  if (diffDays < 30) return `acum ${diffDays} zile`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "acum 1 lună";
  if (diffMonths < 12) return `acum ${diffMonths} luni`;
  const diffYears = Math.floor(diffMonths / 12);
  return diffYears === 1 ? "acum 1 an" : `acum ${diffYears} ani`;
}

export function ProfessionalProfileClient({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [professional, setProfessional] = useState<ProfessionalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<Tab>("despre");
  const [messaging, setMessaging] = useState(false);

  const handleMessage = useCallback(async () => {
    if (!user) {
      router.push(`/autentificare?next=/profesionist/${id}`);
      return;
    }
    setMessaging(true);
    try {
      const conv = await messagesApi.createConversation(id);
      router.push(`/conversatii/${conv.id}`);
    } catch {
      setMessaging(false);
    }
  }, [id, router, user]);

  useEffect(() => {
    let cancelled = false;
    professionalsApi
      .getById(id)
      .then((data) => {
        if (!cancelled) setProfessional(data);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="container-app py-8 lg:py-12 max-w-4xl space-y-4">
        <div className="h-5 w-24 rounded-lg bg-gray-100 animate-pulse" />
        <div className="rounded-3xl border border-border bg-white p-6">
          <div className="flex gap-4">
            <div className="h-20 w-20 rounded-2xl bg-gray-100 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-5 w-40 rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-4 w-56 rounded-lg bg-gray-100 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !professional) {
    return (
      <div className="container-app py-16 text-center">
        <p className="text-lg font-semibold text-text-primary mb-2">Furnizorul nu a fost găsit</p>
        <Link
          href="/explorez"
          className="text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
        >
          Înapoi la explorare
        </Link>
      </div>
    );
  }

  const name = professional.user.displayName ?? professional.user.firstName ?? "Furnizor";

  return (
    <div className="container-app py-8 lg:py-12 pb-28 lg:pb-12">
      <Link
        href="/explorez"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors mb-6"
      >
        <IconArrowRight size={14} className="rotate-180" />
        Explorează
      </Link>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main column */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="rounded-3xl border border-border bg-white p-6 lg:p-7 mb-6">
            <div className="flex gap-4 mb-5">
              <div className="relative flex-shrink-0 h-20 w-20 rounded-2xl bg-brand-50 border border-border overflow-hidden flex items-center justify-center">
                {professional.user.avatar ? (
                  <Image src={professional.user.avatar} alt={name} fill className="object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-brand-500">{name[0]?.toUpperCase()}</span>
                )}
                <AvailabilityDot
                  status={professional.isAvailable ? "available" : "offline"}
                  className="absolute -bottom-0.5 -right-0.5"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-xl font-bold text-text-primary">{name}</h1>
                  <TypeBadge type={professional.type} />
                  {professional.isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      <IconCheckBadge size={12} />
                      Verificat
                    </span>
                  )}
                </div>
                <RatingStars rating={professional.rating} reviewCount={professional.reviewCount} />
                <div className="flex gap-1.5 flex-wrap mt-3">
                  {professional.sessionFormats.map((fmt) => (
                    <SessionFormatChip key={fmt} format={fmt} />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-baseline gap-3 pt-4 border-t border-border flex-wrap">
              <span className="text-xl font-bold text-brand-500">
                {professional.pricePerSession}{" "}
                <span className="text-sm font-medium text-text-muted">RON / ședință</span>
              </span>
              {professional.availableForTrial && professional.trialPrice && (
                <span className="text-xs text-text-secondary">
                  Probă:{" "}
                  <span className="font-semibold text-text-primary">{professional.trialPrice} RON</span>
                  {professional.trialDuration ? ` / ${professional.trialDuration} min` : ""}
                </span>
              )}
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { value: professional.reviewCount, label: "Recenzii" },
              { value: `${professional.yearsExperience} ani`, label: "Experiență" },
              { value: `${professional.responseRate}%`, label: "Rată răspuns" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-border bg-white py-4 text-center">
                <p className="text-lg font-extrabold text-text-primary">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-text-muted mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border mb-6">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={cn(
                  "px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px",
                  tab === t.value
                    ? "border-brand-500 text-brand-600"
                    : "border-transparent text-text-secondary hover:text-text-primary",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "despre" && (
            <div className="space-y-6">
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                {professional.bio}
              </p>
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Specializări
                </p>
                <div className="flex flex-wrap gap-2">
                  {professional.specializations.map((s) => (
                    <span
                      key={s}
                      className="rounded-2xl border border-border px-3 py-1.5 text-xs font-medium text-text-secondary"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Limbi
                </p>
                <p className="text-sm text-text-secondary">{professional.languages.join(", ")}</p>
              </div>
            </div>
          )}

          {tab === "recenzii" && (
            <div>
              <div className="mb-6">
                <RatingStars rating={professional.rating} reviewCount={professional.reviewCount} />
              </div>
              {professional.reviews.length === 0 ? (
                <p className="text-sm text-text-muted">Niciun review încă.</p>
              ) : (
                <div className="space-y-4">
                  {professional.reviews.map((r) => {
                    const reviewerName = r.seeker.displayName ?? "Anonim";
                    return (
                      <div key={r.id} className="rounded-2xl border border-border bg-white p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-600 flex-shrink-0">
                              {reviewerName[0]?.toUpperCase()}
                            </div>
                            <p className="text-sm font-semibold text-text-primary">{reviewerName}</p>
                          </div>
                          <span className="text-xs text-text-muted">{formatRelativeTime(r.createdAt)}</span>
                        </div>
                        <RatingStars rating={r.rating} size="sm" />
                        {r.comment && (
                          <p className="text-sm text-text-secondary mt-2 leading-relaxed">{r.comment}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === "program" && (
            <div className="space-y-2">
              {DAY_ORDER.map((day) => {
                const slots = professional.availability.filter((a) => a.dayOfWeek === day);
                return (
                  <div
                    key={day}
                    className={cn(
                      "flex items-center justify-between rounded-2xl border border-border bg-white px-4 py-3",
                      slots.length === 0 && "opacity-50",
                    )}
                  >
                    <p className="text-sm font-semibold text-text-primary">{DAY_LABELS[day]}</p>
                    {slots.length > 0 ? (
                      <div className="flex gap-2 flex-wrap justify-end">
                        {slots.map((s) => (
                          <span
                            key={s.id}
                            className="text-xs font-medium text-text-secondary rounded-xl bg-bg px-2.5 py-1"
                          >
                            {s.startTime}–{s.endTime}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-text-muted">Indisponibil</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop sidebar actions */}
        <aside className="hidden lg:block w-[280px] flex-shrink-0">
          <div className="sticky top-24 rounded-3xl border border-border bg-white p-5 space-y-3">
            <Link
              href={`/rezervare/${id}/tip`}
              className="block w-full rounded-2xl bg-brand-500 py-3 text-center text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              Rezervă ședință
            </Link>
            <button
              onClick={handleMessage}
              disabled={messaging}
              className="block w-full rounded-2xl border border-border py-3 text-center text-sm font-semibold text-text-secondary hover:border-brand-300 transition-colors disabled:opacity-50"
            >
              {messaging ? "Se incarca..." : "Trimite mesaj"}
            </button>
          </div>
        </aside>
      </div>

      {/* Mobile sticky action bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm border-t border-border z-40 px-4 py-3 flex gap-3">
        <button
          onClick={handleMessage}
          disabled={messaging}
          className="flex-1 rounded-2xl border border-border py-3 text-center text-sm font-semibold text-text-secondary hover:border-brand-300 transition-colors disabled:opacity-50"
        >
          {messaging ? "..." : "Mesaj"}
        </button>
        <Link
          href={`/rezervare/${id}/tip`}
          className="flex-1 rounded-2xl bg-brand-500 py-3 text-center text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          Rezervă ședință
        </Link>
      </div>
    </div>
  );
}
