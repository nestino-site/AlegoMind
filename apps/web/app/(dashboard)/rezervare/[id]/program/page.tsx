"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { professionalsApi } from "@/lib/api/professionals";
import { api } from "@/lib/api/client";
import { BookingStepper } from "@/components/shared/BookingStepper";
import type { SessionFormat } from "@/lib/types";

interface BookingDraft {
  sessionType: SessionFormat;
  durationMinutes: number;
  isTrial: boolean;
  price: number;
  scheduledAt?: string;
}

interface AvailabilityDay {
  date: string;
  dayOfWeek: string;
  windows: {
    startTime: string;
    endTime: string;
    bookedPeriods: { start: string; end: string }[];
  }[];
}

interface AvailabilityResponse {
  professionalId: string;
  from: string;
  to: string;
  days: AvailabilityDay[];
}

const DAY_LABELS = ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"];
const MONTH_NAMES = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
];

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function generateSlots(
  windows: AvailabilityDay["windows"],
  durationMinutes: number,
): string[] {
  const toMins = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const toTime = (mins: number) =>
    `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

  const slots: string[] = [];
  for (const w of windows) {
    const wStart = toMins(w.startTime);
    const wEnd = toMins(w.endTime);
    let cur = wStart;
    while (cur + durationMinutes <= wEnd) {
      const slotEnd = cur + durationMinutes;
      const isBooked = (w.bookedPeriods ?? []).some((bp) => {
        const bStart = toMins(bp.start);
        const bEnd = toMins(bp.end);
        return cur < bEnd && slotEnd > bStart;
      });
      if (!isBooked) slots.push(toTime(cur));
      cur += 60;
    }
  }
  return slots;
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ProgramPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [professionalName, setProfessionalName] = useState("");
  const [availabilityMap, setAvailabilityMap] = useState<Map<string, AvailabilityDay>>(new Map());
  const [loading, setLoading] = useState(true);

  // Calendar state — tracks which month is displayed
  const [viewYear, setViewYear]   = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth()); // 0-indexed

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Boundaries of the availability window
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const windowEnd = new Date(today);
  windowEnd.setDate(windowEnd.getDate() + 42);

  useEffect(() => {
    const raw = sessionStorage.getItem(`am_bk_${id}`);
    if (!raw) { router.replace(`/rezervare/${id}/tip`); return; }
    const parsed: BookingDraft = JSON.parse(raw);
    if (!parsed.sessionType) { router.replace(`/rezervare/${id}/tip`); return; }
    setDraft(parsed);

    const fromStr = toDateStr(today);
    const toStr   = toDateStr(windowEnd);

    Promise.all([
      professionalsApi.getById(id),
      api.get<AvailabilityResponse>(`/professionals/${id}/availability?from=${fromStr}&to=${toStr}`),
    ])
      .then(([prof, avail]) => {
        setProfessionalName(prof.user.displayName ?? prof.user.firstName ?? "Profesionist");
        const map = new Map<string, AvailabilityDay>();
        for (const day of avail.days) map.set(day.date, day);
        setAvailabilityMap(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function hasAvailableSlots(dateStr: string, dur: number) {
    const day = availabilityMap.get(dateStr);
    if (!day) return false;
    return generateSlots(day.windows, dur).length > 0;
  }

  // Build the grid for the currently viewed month
  function buildMonthGrid(year: number, month: number) {
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);

    // Pad to Monday (getDay: 0=Sun → Monday=1, so (day+6)%7 gives Mon=0)
    const startPad = (firstDay.getDay() + 6) % 7;
    const cells: (Date | null)[] = Array(startPad).fill(null);

    for (let d = 1; d <= lastDay.getDate(); d++) {
      cells.push(new Date(year, month, d));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }

  function canGoPrev() {
    // Can go to previous month only if it's not before today's month
    return viewYear > today.getFullYear() || viewMonth > today.getMonth();
  }

  function canGoNext() {
    // Can go to next month only if the window end is in or after that month
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear  = viewMonth === 11 ? viewYear + 1 : viewYear;
    return (
      nextYear < windowEnd.getFullYear() ||
      (nextYear === windowEnd.getFullYear() && nextMonth <= windowEnd.getMonth())
    );
  }

  function prevMonth() {
    if (!canGoPrev()) return;
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
    setSelectedDate(null); setSelectedSlot(null);
  }

  function nextMonth() {
    if (!canGoNext()) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
    setSelectedDate(null); setSelectedSlot(null);
  }

  function handleContinue() {
    if (!selectedDate || !selectedSlot || !draft) return;
    const updated: BookingDraft = {
      ...draft,
      scheduledAt: `${selectedDate}T${selectedSlot}:00.000Z`,
    };
    sessionStorage.setItem(`am_bk_${id}`, JSON.stringify(updated));
    router.push(`/rezervare/${id}/confirmare`);
  }

  const slots =
    selectedDate && draft && availabilityMap.has(selectedDate)
      ? generateSlots(availabilityMap.get(selectedDate)!.windows, draft.durationMinutes)
      : [];

  if (loading || !draft) {
    return (
      <div className="max-w-lg mx-auto space-y-4 pb-24">
        <div className="h-6 w-40 rounded-lg bg-gray-100 animate-pulse" />
        <div className="h-80 rounded-2xl border border-border bg-white animate-pulse" />
      </div>
    );
  }

  const cells = buildMonthGrid(viewYear, viewMonth);
  const todayStr = toDateStr(today);

  return (
    <div className="max-w-lg mx-auto pb-28">
      <BookingStepper current={2} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white hover:bg-bg transition-colors flex-shrink-0"
          aria-label="Înapoi"
        >
          <ChevronLeft />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-text-primary leading-tight">Alege data și ora</h1>
          <p className="text-sm text-text-secondary truncate">{professionalName}</p>
        </div>
      </div>

      {/* Calendar card */}
      <div className="rounded-2xl border border-border bg-white shadow-card mb-4 overflow-hidden">
        {/* Month navigation */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <button
            onClick={prevMonth}
            disabled={!canGoPrev()}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-bg hover:bg-brand-50 hover:border-brand-300 hover:text-brand-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft />
          </button>
          <span className="text-sm font-semibold text-text-primary">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            disabled={!canGoNext()}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-bg hover:bg-brand-50 hover:border-brand-300 hover:text-brand-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight />
          </button>
        </div>

        <div className="px-4 pb-4 pt-3">
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-text-muted py-1 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Date cells */}
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((date, i) => {
              if (!date) return <div key={i} />;

              const dateStr  = toDateStr(date);
              const isPast   = date < today;
              const isToday  = dateStr === todayStr;
              const hasSlots = !isPast && hasAvailableSlots(dateStr, draft.durationMinutes);
              const isSelected = dateStr === selectedDate;

              return (
                <button
                  key={i}
                  disabled={!hasSlots}
                  onClick={() => { setSelectedDate(dateStr); setSelectedSlot(null); }}
                  className={`
                    relative flex flex-col items-center justify-center rounded-xl py-1.5 text-sm font-medium
                    transition-colors mx-0.5
                    ${isSelected
                      ? "bg-brand-500 text-white"
                      : hasSlots
                        ? "hover:bg-brand-50 text-text-primary"
                        : "text-text-muted opacity-35 cursor-not-allowed"
                    }
                    ${isToday && !isSelected ? "ring-1 ring-brand-400 ring-offset-1" : ""}
                  `}
                >
                  <span>{date.getDate()}</span>
                  {/* Availability dot */}
                  {hasSlots && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-brand-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div className="rounded-2xl border border-border bg-white shadow-card p-4 mb-4">
          {slots.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-3">
              Nicio oră disponibilă pentru această zi.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-widest">
                  Ore disponibile
                </p>
                <p className="text-[10px] text-text-muted">Ora României (EET/EEST)</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                      selectedSlot === slot
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-border bg-white text-text-primary hover:border-brand-300 hover:text-brand-500"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Sticky footer */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm border-t border-border z-40 px-4 py-4 lg:relative lg:bg-transparent lg:border-0 lg:px-0 lg:mt-2">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleContinue}
            disabled={!selectedDate || !selectedSlot}
            className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continuă
          </button>
        </div>
      </div>
    </div>
  );
}
