"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ProfessionalType } from "@/lib/types";
import { IconCheckBadge } from "@/components/ui/Icons";

const OPTIONS: { value: ProfessionalType | null; title: string; desc: string }[] = [
  { value: "THERAPIST", title: "Terapeut", desc: "Suport pentru sănătate mentală și emoțională" },
  { value: "COACH",     title: "Coach",    desc: "Dezvoltare personală, carieră și performanță" },
  { value: "MENTOR",    title: "Mentor",   desc: "Ghidare practică din experiență reală" },
  { value: null,        title: "Deschis la toate", desc: "Arată-mi toți furnizorii disponibili" },
];

export default function OnboardingTypePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<ProfessionalType | null | undefined>(undefined);

  function handleNext() {
    if (selected === undefined) return;
    // Plain String() so a later plain string check ("null" vs missing) works
    // without needing to JSON.parse it back on the reading side.
    sessionStorage.setItem("am_ob_type", String(selected));
    router.push("/onboarding/obiective");
  }

  function handleSkip() {
    router.push("/onboarding/obiective");
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-2">Pasul 1 din 4</p>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Ce tip de suport cauți?</h1>
        <p className="text-sm text-text-secondary">
          Alege ce se potrivește nevoilor tale. Poți schimba oricând.
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {OPTIONS.map(({ value, title, desc }) => {
          const active = selected === value;
          return (
            <button
              key={title}
              onClick={() => setSelected(value)}
              className={cn(
                "w-full flex items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-all",
                active
                  ? "border-brand-400 bg-brand-50 ring-1 ring-brand-200"
                  : "border-border bg-white hover:border-brand-300",
              )}
            >
              <div>
                <p className={cn("font-semibold text-sm", active ? "text-brand-700" : "text-text-primary")}>
                  {title}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">{desc}</p>
              </div>
              {active && <IconCheckBadge size={18} className="text-brand-500 flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleNext}
          disabled={selected === undefined}
          className="flex-1 rounded-2xl bg-brand-500 py-3.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-40 transition-colors"
        >
          Continuă
        </button>
        <button
          onClick={handleSkip}
          className="rounded-2xl border border-border px-5 py-3.5 text-sm font-medium text-text-secondary hover:border-brand-300 transition-colors"
        >
          Omite
        </button>
      </div>
    </div>
  );
}
