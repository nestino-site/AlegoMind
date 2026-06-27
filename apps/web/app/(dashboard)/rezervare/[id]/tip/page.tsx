"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { professionalsApi, type ProfessionalDetail } from "@/lib/api/professionals";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { BookingStepper } from "@/components/shared/BookingStepper";
import {
  IconVideo, IconPhone, IconMessage, IconMapPin, IconSparkle,
} from "@/components/ui/Icons";
import type { SessionFormat } from "@/lib/types";

interface BookingDraft {
  sessionType: SessionFormat;
  durationMinutes: number;
  isTrial: boolean;
  price: number;
}

type IconComponent = React.FC<{ size?: number; className?: string }>;

interface CardOption {
  key: string;
  Icon: IconComponent;
  label: string;
  sessionType: SessionFormat;
  durationMinutes: number;
  isTrial: boolean;
  price: number;
}

const FORMAT_META: Record<SessionFormat, { Icon: IconComponent; label: string }> = {
  VIDEO:     { Icon: IconVideo,   label: "Sesiune video" },
  VOICE:     { Icon: IconPhone,   label: "Apel vocal"    },
  TEXT:      { Icon: IconMessage, label: "Chat text"     },
  IN_PERSON: { Icon: IconMapPin,  label: "Față în față"  },
};

export default function TipPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [professional, setProfessional] = useState<ProfessionalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CardOption | null>(null);

  useEffect(() => {
    professionalsApi
      .getById(id)
      .then(setProfessional)
      .catch(() => setError("Nu am putut încărca datele profesionistului."))
      .finally(() => setLoading(false));
  }, [id]);

  function buildCards(p: ProfessionalDetail): CardOption[] {
    const cards: CardOption[] = [];

    if (p.availableForTrial && p.trialPrice) {
      cards.push({
        key: "trial",
        Icon: IconSparkle,
        label: "Ședință de probă",
        sessionType: p.sessionFormats[0],
        durationMinutes: p.trialDuration ?? 30,
        isTrial: true,
        price: p.trialPrice,
      });
    }

    for (const fmt of p.sessionFormats) {
      const meta = FORMAT_META[fmt];
      for (const dur of [50, 80] as const) {
        cards.push({
          key: `${fmt}-${dur}`,
          Icon: meta.Icon,
          label: meta.label,
          sessionType: fmt,
          durationMinutes: dur,
          isTrial: false,
          price: p.pricePerSession,
        });
      }
    }

    return cards;
  }

  function handleContinue() {
    if (!selected) return;
    const draft: BookingDraft = {
      sessionType: selected.sessionType,
      durationMinutes: selected.durationMinutes,
      isTrial: selected.isTrial,
      price: selected.price,
    };
    sessionStorage.setItem(`am_bk_${id}`, JSON.stringify(draft));
    router.push(`/rezervare/${id}/program`);
  }

  const professionalName =
    professional?.user.displayName ?? professional?.user.firstName ?? "Profesionist";

  if (loading) {
    return (
      <div className="max-w-lg mx-auto space-y-4 pb-24">
        <div className="h-6 w-32 rounded-lg bg-gray-100 animate-pulse" />
        <div className="h-4 w-48 rounded-lg bg-gray-100 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl border border-border bg-white animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !professional) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <p className="text-text-secondary">{error ?? "Ceva nu a mers bine."}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm font-semibold text-brand-500 hover:underline"
        >
          Înapoi
        </button>
      </div>
    );
  }

  const cards = buildCards(professional);

  return (
    <div className="max-w-lg mx-auto pb-28">
      <BookingStepper current={1} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white hover:bg-bg transition-colors flex-shrink-0"
          aria-label="Înapoi"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-text-primary leading-tight">Alege tipul ședinței</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm text-text-secondary truncate">{professionalName}</span>
            <TypeBadge type={professional.type} />
          </div>
        </div>
      </div>

      {/* Session type cards */}
      <div className="space-y-3">
        {cards.map((card) => {
          const isSelected = selected?.key === card.key;
          return (
            <button
              key={card.key}
              onClick={() => setSelected(card)}
              className={`w-full flex items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                isSelected
                  ? "border-brand-500 bg-brand-50 shadow-card"
                  : "border-border bg-white hover:border-brand-300 hover:shadow-card"
              }`}
            >
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${isSelected ? "bg-brand-500/10" : "bg-brand-50"}`}>
                <card.Icon size={20} className={isSelected ? "text-brand-500" : "text-brand-300"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary">{card.label}</p>
                <p className="text-sm text-text-secondary mt-0.5">
                  {card.durationMinutes} minute
                  {card.isTrial && (
                    <span className="ml-2 text-xs font-medium text-brand-500 bg-brand-50 border border-brand-200 rounded-full px-2 py-0.5">
                      Probă
                    </span>
                  )}
                </p>
              </div>
              <span className="text-sm font-bold text-brand-500 flex-shrink-0">
                {card.price} RON
              </span>
            </button>
          );
        })}
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm border-t border-border z-40 px-4 py-4 lg:relative lg:bg-transparent lg:border-0 lg:px-0 lg:mt-6">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleContinue}
            disabled={!selected}
            className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continuă
          </button>
        </div>
      </div>
    </div>
  );
}
