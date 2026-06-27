"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { authApi } from "@/lib/api/auth";
import { cn } from "@/lib/utils";
import type { OnboardingState, ProfessionalType } from "@/lib/types";

const GENDER_OPTIONS = [
  { value: "female", label: "Femeie" },
  { value: "male",   label: "Bărbat"  },
  { value: "any",    label: "Fără preferință" },
] as const;

const AGE_RANGES: { label: string; min: number; max: number }[] = [
  { label: "20–30 ani", min: 20, max: 30 },
  { label: "30–45 ani", min: 30, max: 45 },
  { label: "45–60 ani", min: 45, max: 60 },
  { label: "60+ ani",   min: 60, max: 80 },
];

export default function OnboardingPreferencesPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [gender, setGender]   = useState<"male" | "female" | "any">("any");
  const [ageRange, setAgeRange] = useState<{ min: number; max: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Shared by "Finalizează" and "Omite" — skipping still saves whatever was
  // picked in earlier steps (now genuinely empty arrays if those were
  // skipped too, since the backend accepts that).
  async function save() {
    setLoading(true);
    setError(null);

    const stored: Partial<OnboardingState> = JSON.parse(
      localStorage.getItem("am_onboarding") ?? "{}",
    );

    const storedType = sessionStorage.getItem("am_ob_type");
    const preferredType =
      storedType && storedType !== "null" ? (storedType as ProfessionalType) : undefined;

    const prefs: OnboardingState & { preferredType?: ProfessionalType } = {
      topics: stored.topics ?? [],
      communicationFormats: stored.communicationFormats ?? [],
      providerGender: gender !== "any" ? gender : undefined,
      providerAgeMin: ageRange?.min,
      providerAgeMax: ageRange?.max,
      preferredType,
    };

    const token = document.cookie
      .split("; ")
      .find((c) => c.startsWith("am_at="))
      ?.split("=")[1];

    if (!token) {
      router.replace("/autentificare");
      return;
    }

    try {
      await authApi.savePreferences(prefs, token);
      localStorage.removeItem("am_onboarding");
      sessionStorage.removeItem("am_ob_type");
      await refreshUser();
      router.replace("/acasa");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Eroare la salvarea preferințelor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-2">Pasul 4 din 4</p>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Cu cine te simți confortabil?</h1>
        <p className="text-sm text-text-secondary">
          Aceste preferințe ne ajută să afișăm furnizori în care ai cu adevărat încredere.
          Nicio alegere nu este obligatorie.
        </p>
      </div>

      {/* Gender */}
      <div className="mb-7">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Gen furnizor
        </p>
        <div className="flex gap-2 flex-wrap">
          {GENDER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setGender(value)}
              className={cn(
                "rounded-2xl border px-4 py-2 text-sm font-medium transition-all",
                gender === value
                  ? "border-brand-400 bg-brand-50 text-brand-600 ring-1 ring-brand-300"
                  : "border-border bg-white text-text-secondary hover:border-brand-300",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Age range */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Vârstă furnizor
        </p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setAgeRange(null)}
            className={cn(
              "rounded-2xl border px-4 py-2 text-sm font-medium transition-all",
              !ageRange
                ? "border-brand-400 bg-brand-50 text-brand-600 ring-1 ring-brand-300"
                : "border-border bg-white text-text-secondary hover:border-brand-300",
            )}
          >
            Fără preferință
          </button>
          {AGE_RANGES.map((range) => {
            const active = ageRange?.min === range.min && ageRange?.max === range.max;
            return (
              <button
                key={range.label}
                onClick={() => setAgeRange(range)}
                className={cn(
                  "rounded-2xl border px-4 py-2 text-sm font-medium transition-all",
                  active
                    ? "border-brand-400 bg-brand-50 text-brand-600 ring-1 ring-brand-300"
                    : "border-border bg-white text-text-secondary hover:border-brand-300",
                )}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-danger/20 bg-red-50 px-4 py-3 text-xs text-danger">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={save}
          disabled={loading}
          className="flex-1 rounded-2xl bg-brand-500 py-3.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60 transition-colors"
        >
          {loading ? "Se salvează..." : "Finalizează"}
        </button>
        <button
          onClick={save}
          disabled={loading}
          className="rounded-2xl border border-border px-5 py-3.5 text-sm font-medium text-text-secondary hover:border-brand-300 disabled:opacity-60 transition-colors"
        >
          Omite
        </button>
      </div>

      <p className="mt-4 text-xs text-text-muted text-center">
        Poți modifica oricând preferințele din profilul tău.
      </p>
    </div>
  );
}
