"use client";

import { useEffect, useState, type FormEvent } from "react";
import { professionalsApi, type AvailabilitySlot, type DayOfWeek } from "@/lib/api/professionals";

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: "MONDAY",    label: "Luni"      },
  { value: "TUESDAY",   label: "Marți"     },
  { value: "WEDNESDAY", label: "Miercuri"  },
  { value: "THURSDAY",  label: "Joi"       },
  { value: "FRIDAY",    label: "Vineri"    },
  { value: "SATURDAY",  label: "Sâmbătă"   },
  { value: "SUNDAY",    label: "Duminică"  },
];

type DaySlot = { startTime: string; endTime: string };
type Schedule = Partial<Record<DayOfWeek, DaySlot[]>>;

export default function ProgramPage() {
  const [schedule, setSchedule] = useState<Schedule>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    professionalsApi
      .getMyProfile()
      .then((p) => {
        const s: Schedule = {};
        for (const slot of p.availability) {
          if (!s[slot.dayOfWeek]) s[slot.dayOfWeek] = [];
          s[slot.dayOfWeek]!.push({ startTime: slot.startTime, endTime: slot.endTime });
        }
        setSchedule(s);
      })
      .catch(() => setError("Nu am putut încărca programul."))
      .finally(() => setLoading(false));
  }, []);

  function addSlot(day: DayOfWeek) {
    setSchedule((prev) => ({
      ...prev,
      [day]: [...(prev[day] ?? []), { startTime: "09:00", endTime: "17:00" }],
    }));
  }

  function removeSlot(day: DayOfWeek, idx: number) {
    setSchedule((prev) => {
      const slots = (prev[day] ?? []).filter((_, i) => i !== idx);
      const next = { ...prev };
      if (slots.length === 0) delete next[day];
      else next[day] = slots;
      return next;
    });
  }

  function updateSlot(day: DayOfWeek, idx: number, field: "startTime" | "endTime", value: string) {
    setSchedule((prev) => {
      const slots = [...(prev[day] ?? [])];
      slots[idx] = { ...slots[idx], [field]: value };
      return { ...prev, [day]: slots };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const slots: AvailabilitySlot[] = [];
    for (const [day, daySlots] of Object.entries(schedule)) {
      for (const s of daySlots ?? []) {
        slots.push({ dayOfWeek: day as DayOfWeek, startTime: s.startTime, endTime: s.endTime });
      }
    }

    try {
      await professionalsApi.setAvailability(slots);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "A apărut o eroare la salvare.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {DAYS.map((d) => (
          <div key={d.value} className="h-16 rounded-2xl border border-border bg-white animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-24 lg:pb-0">
      <div className="mb-8">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">Disponibilitate</p>
        <h1 className="text-2xl font-bold text-text-primary">Programul meu</h1>
        <p className="text-sm text-text-secondary mt-1">
          Setează intervalele orare în care ești disponibil. Programul se aplică săptămânal.
        </p>
      </div>

      {success && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Programul a fost salvat cu succes.
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {DAYS.map(({ value: day, label }) => {
          const slots = schedule[day] ?? [];
          const hasSlots = slots.length > 0;
          return (
            <div
              key={day}
              className={`rounded-2xl border border-border bg-white p-4 transition-colors ${hasSlots ? "" : "opacity-60"}`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-text-primary">{label}</p>
                <button
                  type="button"
                  onClick={() => addSlot(day)}
                  className="rounded-lg border border-brand-200 px-3 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  + Adaugă interval
                </button>
              </div>
              {slots.length === 0 ? (
                <p className="text-xs text-text-muted">Indisponibil</p>
              ) : (
                <div className="space-y-2">
                  {slots.map((slot, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateSlot(day, idx, "startTime", e.target.value)}
                        className="rounded-lg border border-border px-2 py-1.5 text-xs text-text-primary focus:border-brand-400 focus:outline-none"
                      />
                      <span className="text-xs text-text-muted">–</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateSlot(day, idx, "endTime", e.target.value)}
                        className="rounded-lg border border-border px-2 py-1.5 text-xs text-text-primary focus:border-brand-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeSlot(day, idx)}
                        className="ml-auto rounded-lg p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-60"
        >
          {saving ? "Se salvează..." : "Salvează programul"}
        </button>
      </form>
    </div>
  );
}
