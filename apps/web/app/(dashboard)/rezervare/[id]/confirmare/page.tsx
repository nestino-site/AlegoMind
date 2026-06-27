"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { loadStripe, type Stripe, type StripeCardElement } from "@stripe/stripe-js";
import { professionalsApi } from "@/lib/api/professionals";
import { bookingsApi } from "@/lib/api/bookings";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { BookingStepper } from "@/components/shared/BookingStepper";
import type { SessionFormat } from "@/lib/types";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
);

const MONTH_NAMES = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
];
const DAY_NAMES = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];

const FORMAT_LABELS: Record<SessionFormat, string> = {
  VIDEO:     "Video",
  VOICE:     "Vocal",
  TEXT:      "Chat",
  IN_PERSON: "Față în față",
};

interface BookingDraft {
  sessionType: SessionFormat;
  durationMinutes: number;
  isTrial: boolean;
  price: number;
  scheduledAt?: string;
}

function formatDateRo(iso: string) {
  const d = new Date(iso);
  return `${DAY_NAMES[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function formatTimeRo(iso: string) {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

// Test mode: BYPASS_PAYMENT=true on the API means the server returns clientSecret: null
// and the booking is auto-confirmed. We detect this after the first POST.
// To go live: remove BYPASS_PAYMENT from apps/api/.env and add real Stripe keys.

export default function ConfirmarePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [professionalName, setProfessionalName] = useState("");
  const [professionalType, setProfessionalType] = useState<"THERAPIST" | "COACH" | "MENTOR">("THERAPIST");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const [stripeReady, setStripeReady] = useState(false);

  const stripeRef = useRef<Stripe | null>(null);
  const cardElementRef = useRef<StripeCardElement | null>(null);

  // Whether we're in bypass (test) mode — determined server-side, detected after create()
  // We show the full Stripe form by default; it collapses if the server is in bypass mode.
  const [bypassMode, setBypassMode] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(`am_bk_${id}`);
    if (!raw) { router.replace(`/rezervare/${id}/tip`); return; }
    const parsed: BookingDraft = JSON.parse(raw);
    if (!parsed.scheduledAt) { router.replace(`/rezervare/${id}/tip`); return; }
    setDraft(parsed);

    professionalsApi.getById(id).then((p) => {
      setProfessionalName(p.user.displayName ?? p.user.firstName ?? "Profesionist");
      setProfessionalType(p.type);
    });
  }, [id, router]);

  // Mount Stripe card element (skipped automatically if bypass mode is already known)
  useEffect(() => {
    if (!draft || bypassMode) return;
    let mounted = true;

    stripePromise.then((stripe) => {
      if (!mounted) return;
      if (!stripe) {
        // Stripe key missing — auto-detect as bypass / test mode
        setBypassMode(true);
        return;
      }
      stripeRef.current = stripe;
      const elements = stripe.elements({ locale: "ro" });
      const cardElement = elements.create("card", {
        style: {
          base: {
            fontSize: "16px",
            color: "#1a1a2e",
            "::placeholder": { color: "#9ca3af" },
          },
        },
      });
      cardElement.mount("#card-element");
      cardElement.on("change", (e) => setCardError(e.error?.message ?? null));
      cardElementRef.current = cardElement;
      setStripeReady(true);
    });

    return () => {
      mounted = false;
      cardElementRef.current?.destroy();
      cardElementRef.current = null;
    };
  }, [draft, bypassMode]);

  async function handlePay() {
    if (!draft?.scheduledAt) return;
    setLoading(true);
    setError(null);

    try {
      const { booking, clientSecret } = await bookingsApi.create({
        professionalId: id,
        sessionType: draft.sessionType,
        durationMinutes: draft.durationMinutes,
        scheduledAt: draft.scheduledAt,
        isTrial: draft.isTrial,
      });

      // ── Bypass / test mode ─────────────────────────────────────────────────
      if (clientSecret === null) {
        // Server already confirmed the booking — no Stripe step needed
        sessionStorage.removeItem(`am_bk_${id}`);
        router.replace(`/rezervare/confirmat/${booking.id}`);
        return;
      }

      // ── Real Stripe flow ───────────────────────────────────────────────────
      const stripe = await stripePromise;
      const { error: stripeError } = await stripe!.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElementRef.current! },
      });

      if (stripeError) throw new Error(stripeError.message);

      await bookingsApi.confirm(booking.id);

      sessionStorage.removeItem(`am_bk_${id}`);
      router.replace(`/rezervare/confirmat/${booking.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "A apărut o eroare. Încearcă din nou.");
      setLoading(false);
    }
  }

  if (!draft) {
    return (
      <div className="max-w-lg mx-auto space-y-4 pb-24">
        <div className="h-6 w-40 rounded-lg bg-gray-100 animate-pulse" />
        <div className="h-48 rounded-2xl border border-border bg-white animate-pulse" />
        <div className="h-32 rounded-2xl border border-border bg-white animate-pulse" />
      </div>
    );
  }

  const sessionLabel = draft.isTrial ? "Ședință de probă" : FORMAT_LABELS[draft.sessionType];

  return (
    <div className="max-w-lg mx-auto pb-28">
      <BookingStepper current={3} />

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
        <h1 className="text-lg font-bold text-text-primary">Confirmare rezervare</h1>
      </div>

      {/* Test mode banner */}
      {bypassMode && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3 mb-4">
          <span className="text-amber-500 text-base">🧪</span>
          <p className="text-xs text-amber-700 font-medium">
            Mod testare — plata este simulată. Rezervarea va fi confirmată instant fără card.
          </p>
        </div>
      )}

      {/* Summary card */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-card mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-11 w-11 rounded-2xl bg-brand-50 border border-border flex items-center justify-center text-base font-bold text-brand-500 flex-shrink-0">
            {professionalName[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-text-primary truncate">{professionalName}</p>
            <TypeBadge type={professionalType} />
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Tip ședință</span>
            <span className="font-medium text-text-primary">{sessionLabel}</span>
          </div>
          {!draft.isTrial && (
            <div className="flex justify-between">
              <span className="text-text-secondary">Format</span>
              <span className="font-medium text-text-primary">{FORMAT_LABELS[draft.sessionType]}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-text-secondary">Data</span>
            <span className="font-medium text-text-primary">{formatDateRo(draft.scheduledAt!)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Ora</span>
            <span className="font-medium text-text-primary">{formatTimeRo(draft.scheduledAt!)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Durată</span>
            <span className="font-medium text-text-primary">{draft.durationMinutes} minute</span>
          </div>
        </div>

        <div className="border-t border-border mt-4 pt-4 flex justify-between items-center">
          <span className="font-semibold text-text-primary">Total</span>
          <span className="text-lg font-bold text-brand-500">{draft.price} RON</span>
        </div>
        <p className="text-xs text-text-muted mt-1 text-right">Plată securizată prin Stripe</p>
      </div>

      {/* Payment card — hidden in bypass mode */}
      {!bypassMode && (
        <div className="rounded-2xl border border-border bg-white p-5 shadow-card mb-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Date de card</p>
          <p className="text-xs text-text-muted mb-3 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-emerald-500 flex-shrink-0">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Datele tale sunt criptate. Nu stocăm informații despre card.
          </p>
          <div id="card-element" className="border border-border rounded-xl p-4 bg-white min-h-[52px]" />
          {cardError && <p className="text-red-500 text-sm mt-2">{cardError}</p>}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Sticky footer */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm border-t border-border z-40 px-4 py-4 lg:relative lg:bg-transparent lg:border-0 lg:px-0">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handlePay}
            disabled={loading || (!bypassMode && !stripeReady)}
            className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? "Se procesează..."
              : bypassMode
                ? `Confirmă rezervarea — ${draft.price} RON`
                : `Confirmă și plătește ${draft.price} RON`}
          </button>
        </div>
      </div>
    </div>
  );
}
