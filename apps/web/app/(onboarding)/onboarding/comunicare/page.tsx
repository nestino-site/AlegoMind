"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { SessionFormat } from "@/lib/types";
import { IconMessage, IconVideo, IconPhone, IconMapPin, IconCheckBadge } from "@/components/ui/Icons";

const FORMATS: {
  value: SessionFormat;
  label: string;
  desc: string;
  Icon: React.FC<{ size?: number; className?: string }>;
}[] = [
  { value: "TEXT",      label: "Chat text",      desc: "Mesaje oricând, în ritmul tău",                   Icon: IconMessage },
  { value: "VIDEO",     label: "Apel video",     desc: "Față în față de acasă",                           Icon: IconVideo   },
  { value: "VOICE",     label: "Apel vocal",     desc: "Conversație audio, fără cameră",                  Icon: IconPhone   },
  { value: "IN_PERSON", label: "Întâlnire fizică", desc: "La cabinetul furnizorului",                     Icon: IconMapPin  },
];

export default function OnboardingCommunicationPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<SessionFormat[]>([]);

  function toggle(fmt: SessionFormat) {
    setSelected((prev) =>
      prev.includes(fmt) ? prev.filter((f) => f !== fmt) : [...prev, fmt],
    );
  }

  function handleNext() {
    const existing = JSON.parse(localStorage.getItem("am_onboarding") ?? "{}");
    if (selected.length > 0) {
      localStorage.setItem(
        "am_onboarding",
        JSON.stringify({ ...existing, communicationFormats: selected }),
      );
    }
    router.push("/onboarding/preferinte");
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-2">Pasul 3 din 4</p>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Cum preferi să comunici?</h1>
        <p className="text-sm text-text-secondary">
          Alege formatul sau formatele preferate. Poți schimba oricând.
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {FORMATS.map(({ value, label, desc, Icon }) => {
          const active = selected.includes(value);
          return (
            <button
              key={value}
              onClick={() => toggle(value)}
              className={cn(
                "w-full flex items-center gap-4 rounded-2xl border p-4 text-left transition-all",
                active
                  ? "border-brand-400 bg-brand-50 ring-1 ring-brand-200"
                  : "border-border bg-white hover:border-brand-300",
              )}
            >
              <div className={cn(
                "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors",
                active ? "bg-brand-100" : "bg-bg",
              )}>
                <Icon size={18} className={active ? "text-brand-500" : "text-text-muted"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("font-semibold text-sm", active ? "text-brand-700" : "text-text-primary")}>
                  {label}
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
          className="flex-1 rounded-2xl bg-brand-500 py-3.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          {selected.length > 0 ? "Continuă" : "Omite"}
        </button>
        <button
          onClick={() => router.back()}
          className="rounded-2xl border border-border px-5 py-3.5 text-sm font-medium text-text-secondary hover:border-brand-300 transition-colors"
        >
          Înapoi
        </button>
      </div>
    </div>
  );
}
