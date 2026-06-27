"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SEEKER_TOPICS, type SeekerTopic } from "@/lib/types";

const TOPIC_LABELS: Record<SeekerTopic, string> = {
  anxiety:          "Anxietate",
  depression:       "Depresie",
  relationships:    "Relații",
  career:           "Carieră",
  trauma:           "Traumă",
  burnout:          "Burnout",
  grief:            "Doliu",
  stress:           "Stres",
  self_esteem:      "Stimă de sine",
  life_transitions: "Tranziții în viață",
  addiction:        "Dependențe",
  family:           "Familie",
  parenting:        "Parentaj",
  identity:         "Identitate",
  sleep:            "Somn",
  motivation:       "Motivație",
};

export default function OnboardingObjectivesPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<SeekerTopic[]>([]);

  function toggle(topic: SeekerTopic) {
    setSelected((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );
  }

  function handleNext() {
    if (selected.length === 0) return;
    // Persist to localStorage for final submission
    const existing = JSON.parse(localStorage.getItem("am_onboarding") ?? "{}");
    localStorage.setItem("am_onboarding", JSON.stringify({ ...existing, topics: selected }));
    router.push("/onboarding/comunicare");
  }

  function handleSkip() {
    router.push("/onboarding/comunicare");
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-2">Pasul 2 din 4</p>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Ce te-a adus aici?</h1>
        <p className="text-sm text-text-secondary">
          Selectează subiectele care te preocupă. Ne ajută să găsim furnizori potriviți pentru tine.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {SEEKER_TOPICS.map((topic) => (
          <button
            key={topic}
            onClick={() => toggle(topic)}
            className={cn(
              "rounded-2xl border px-4 py-2 text-sm font-medium transition-all",
              selected.includes(topic)
                ? "border-brand-400 bg-brand-50 text-brand-600 ring-1 ring-brand-300"
                : "border-border bg-white text-text-secondary hover:border-brand-300",
            )}
          >
            {TOPIC_LABELS[topic]}
          </button>
        ))}
      </div>

      {selected.length > 0 && (
        <p className="text-xs text-text-muted mb-6">
          {selected.length} {selected.length === 1 ? "subiect selectat" : "subiecte selectate"}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleNext}
          disabled={selected.length === 0}
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

      <p className="mt-4 text-xs text-text-muted text-center">
        Răspunsurile tale sunt private și folosite doar pentru potrivire.
      </p>
    </div>
  );
}
