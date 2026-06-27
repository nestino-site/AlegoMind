"use client";

import { useState, useEffect, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { authApi } from "@/lib/api/auth";
import { professionalsApi, type DayOfWeek, type AvailabilitySlot } from "@/lib/api/professionals";
import { cn } from "@/lib/utils";
import type { ProfessionalType, SessionFormat } from "@/lib/types";
import {
  IconBrain, IconTarget, IconLightbulb,
  IconVideo, IconMessage, IconPhone, IconMapPin,
  IconCheckBadge,
} from "@/components/ui/Icons";

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "am_pro_onboarding";

const STEPS = [
  { n: 1, label: "Profil" },
  { n: 2, label: "Servicii" },
  { n: 3, label: "Program" },
];

const PRO_TYPES: { type: ProfessionalType; label: string; Icon: React.FC<{ size?: number; className?: string }> }[] = [
  { type: "THERAPIST", label: "Terapeut",  Icon: IconBrain     },
  { type: "COACH",     label: "Coach",     Icon: IconTarget    },
  { type: "MENTOR",    label: "Mentor",    Icon: IconLightbulb },
];

const GENDERS = [
  { value: "",                   label: "Prefer să nu spun" },
  { value: "male",               label: "Masculin" },
  { value: "female",             label: "Feminin" },
  { value: "non_binary",         label: "Non-binar" },
  { value: "prefer_not_to_say",  label: "Prefer să nu specific" },
];

const LANGUAGES: { code: string; label: string }[] = [
  { code: "ro", label: "Română" },
  { code: "en", label: "Engleză" },
  { code: "fr", label: "Franceză" },
  { code: "de", label: "Germană" },
  { code: "hu", label: "Maghiară" },
  { code: "it", label: "Italiană" },
  { code: "es", label: "Spaniolă" },
];

const SESSION_FORMATS: { value: SessionFormat; label: string; Icon: React.FC<{ size?: number; className?: string }> }[] = [
  { value: "VIDEO",     label: "Video",    Icon: IconVideo   },
  { value: "VOICE",     label: "Voce",     Icon: IconPhone   },
  { value: "TEXT",      label: "Chat",     Icon: IconMessage },
  { value: "IN_PERSON", label: "Fizic",    Icon: IconMapPin  },
];

const SPECIALIZATION_SUGGESTIONS: Record<ProfessionalType, string[]> = {
  THERAPIST: ["Anxietate", "Depresie", "Traumă", "Relații", "Familie", "Burnout", "Stres", "Doliu", "Tulburări de somn"],
  COACH:     ["Carieră", "Leadership", "Productivitate", "Mindset", "Comunicare", "Business", "Dezvoltare personală"],
  MENTOR:    ["Startup", "AI & Tech", "Inginerie software", "Product Management", "Marketing digital", "Design"],
};

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "MONDAY",    label: "Luni"     },
  { key: "TUESDAY",   label: "Marți"    },
  { key: "WEDNESDAY", label: "Miercuri" },
  { key: "THURSDAY",  label: "Joi"      },
  { key: "FRIDAY",    label: "Vineri"   },
  { key: "SATURDAY",  label: "Sâmbătă"  },
  { key: "SUNDAY",    label: "Duminică" },
];

type DaySchedule = { enabled: boolean; startTime: string; endTime: string };
type WeekSchedule = Record<DayOfWeek, DaySchedule>;

const DEFAULT_SCHEDULE: WeekSchedule = {
  MONDAY:    { enabled: true,  startTime: "09:00", endTime: "17:00" },
  TUESDAY:   { enabled: true,  startTime: "09:00", endTime: "17:00" },
  WEDNESDAY: { enabled: true,  startTime: "09:00", endTime: "17:00" },
  THURSDAY:  { enabled: true,  startTime: "09:00", endTime: "17:00" },
  FRIDAY:    { enabled: true,  startTime: "09:00", endTime: "17:00" },
  SATURDAY:  { enabled: false, startTime: "10:00", endTime: "14:00" },
  SUNDAY:    { enabled: false, startTime: "10:00", endTime: "14:00" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProInregistrarePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 state
  const [proType, setProType]       = useState<ProfessionalType | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio]               = useState("");
  const [gender, setGender]         = useState("");
  const [languages, setLanguages]   = useState<string[]>(["ro"]);

  // Step 2 state
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [tagInput, setTagInput]       = useState("");
  const [formats, setFormats]         = useState<SessionFormat[]>([]);
  const [price, setPrice]             = useState<number | "">("");
  const [experience, setExperience]   = useState<number | "">("");
  const [hasTrial, setHasTrial]       = useState(false);
  const [trialPrice, setTrialPrice]   = useState<number | "">("");
  const [trialDuration, setTrialDuration] = useState<number>(30);

  // Step 3 state
  const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE);

  // Pre-fill from localStorage and user data
  useEffect(() => {
    const savedType = localStorage.getItem("am_pro_type") as ProfessionalType | null;
    if (savedType) setProType(savedType);

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s.proType)       setProType(s.proType);
        if (s.displayName)   setDisplayName(s.displayName);
        if (s.bio)           setBio(s.bio);
        if (s.gender)        setGender(s.gender);
        if (s.languages)     setLanguages(s.languages);
        if (s.specializations) setSpecializations(s.specializations);
        if (s.formats)       setFormats(s.formats);
        if (s.price)         setPrice(s.price);
        if (s.experience)    setExperience(s.experience);
        if (s.hasTrial)      setHasTrial(s.hasTrial);
        if (s.trialPrice)    setTrialPrice(s.trialPrice);
        if (s.trialDuration) setTrialDuration(s.trialDuration);
        if (s.schedule)      setSchedule(s.schedule);
        if (s.step)          setStep(s.step);
      } catch { /* ignore corrupt data */ }
    }
    // Pre-fill display name from user
    if (user?.displayName) setDisplayName(user.displayName);
    else if (user?.firstName) setDisplayName(user.firstName);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function save(extra?: object) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      proType, displayName, bio, gender, languages,
      specializations, formats, price, experience,
      hasTrial, trialPrice, trialDuration, schedule,
      ...extra,
    }));
  }

  // ── Step navigation ──────────────────────────────────────────────────────────

  function goToStep(n: number) {
    save({ step: n });
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function step1Valid() {
    return !!proType && displayName.trim().length >= 2 && bio.trim().length >= 50 && languages.length > 0;
  }

  function step2Valid() {
    return specializations.length > 0 && formats.length > 0 && Number(price) >= 50;
  }

  function step3Valid() {
    return DAYS.some((d) => schedule[d.key].enabled);
  }

  // ── Tag input helpers ────────────────────────────────────────────────────────

  function addTag(value: string) {
    const trimmed = value.trim();
    if (trimmed && !specializations.includes(trimmed)) {
      setSpecializations((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  }

  function onTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && specializations.length > 0) {
      setSpecializations((prev) => prev.slice(0, -1));
    }
  }

  function removeTag(tag: string) {
    setSpecializations((prev) => prev.filter((t) => t !== tag));
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!proType || !step2Valid() || !step3Valid()) return;
    setError(null);
    setSubmitting(true);

    try {
      // Update display name if changed
      if (displayName && displayName !== user?.displayName) {
        await authApi.updateMe({ displayName });
      }

      // Create professional profile
      await professionalsApi.createProfile({
        type: proType,
        bio: bio.trim(),
        specializations,
        sessionFormats: formats,
        languages,
        pricePerSession: Number(price),
        yearsExperience: experience !== "" ? Number(experience) : undefined,
        gender: gender || undefined,
        availableForTrial: hasTrial,
        trialPrice: hasTrial && trialPrice !== "" ? Number(trialPrice) : undefined,
        trialDuration: hasTrial ? trialDuration : undefined,
      });

      // Set weekly availability
      const slots: AvailabilitySlot[] = DAYS
        .filter((d) => schedule[d.key].enabled)
        .map((d) => ({
          dayOfWeek: d.key,
          startTime: schedule[d.key].startTime,
          endTime:   schedule[d.key].endTime,
        }));

      if (slots.length > 0) {
        await professionalsApi.setAvailability(slots);
      }

      // Clear saved state
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("am_pro_type");

      setStep(4); // success
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Eroare la salvarea profilului");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Success screen ──────────────────────────────────────────────────────────

  if (step === 4) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-3xl border border-border p-10 shadow-card">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-full bg-brand-50 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="#006FFD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <h1 className="text-xl font-bold text-text-primary mb-3">Profil creat cu succes!</h1>
          <p className="text-sm text-text-secondary leading-relaxed mb-6">
            Contul tău profesionist a fost trimis spre verificare. Echipa noastră va revizui profilul
            și te va notifica pe email în termen de <strong>1–3 zile lucrătoare</strong>.
          </p>
          <div className="bg-brand-50 rounded-2xl p-4 mb-6 text-left space-y-2">
            {[
              "Verificăm credențialele și informațiile furnizate",
              "Profilul tău devine vizibil după aprobare",
              "Primești email de confirmare când ești activ",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-brand-500 mt-0.5 flex-shrink-0">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xs text-text-secondary">{item}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => router.replace("/profesionist/panou")}
            className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Mergi la panoul tău
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                  step > s.n
                    ? "bg-brand-500 text-white"
                    : step === s.n
                      ? "bg-brand-500 text-white ring-4 ring-brand-100"
                      : "bg-border text-text-muted",
                )}>
                  {step > s.n ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : s.n}
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  step >= s.n ? "text-brand-600" : "text-text-muted",
                )}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-2 mb-5 transition-colors",
                  step > s.n ? "bg-brand-500" : "bg-border",
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-border shadow-card overflow-hidden">
        {/* ── STEP 1: Profil personal ──────────────────────────────────────── */}
        {step === 1 && (
          <div className="p-8">
            <div className="mb-7">
              <h1 className="text-xl font-bold text-text-primary mb-1">Profil profesional</h1>
              <p className="text-sm text-text-secondary">Informații despre tine și activitatea ta.</p>
            </div>

            <div className="space-y-5">
              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2">
                  Tip de serviciu <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {PRO_TYPES.map(({ type, label, Icon }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setProType(type)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all",
                        proType === type
                          ? "border-brand-400 bg-brand-50 ring-2 ring-brand-200"
                          : "border-border hover:border-brand-300",
                      )}
                    >
                      <Icon size={20} className={proType === type ? "text-brand-500" : "text-text-muted"} />
                      <span className="text-xs font-semibold text-text-primary">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Display name */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Nume complet <span className="text-red-500">*</span>
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Dr. Andrei Popescu"
                  className="w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                />
                <p className="text-[10px] text-text-muted mt-1">
                  Profesioniștii nu pot folosi pseudonime — numele real creează încredere.
                </p>
              </div>

              {/* Bio */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Biografie <span className="text-red-500">*</span>
                  </label>
                  <span className={cn(
                    "text-[10px] font-mono",
                    bio.length < 50 ? "text-text-muted" : bio.length > 1800 ? "text-orange-500" : "text-success",
                  )}>
                    {bio.length} / 2000
                  </span>
                </div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={5}
                  maxLength={2000}
                  placeholder="Descrie experiența ta, abordarea terapeutică/de coaching, valorile și ce fel de clienți poți ajuta..."
                  className="w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all resize-none"
                />
                {bio.length > 0 && bio.length < 50 && (
                  <p className="text-[10px] text-red-500 mt-1">Minim 50 de caractere ({50 - bio.length} rămase)</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Gen (opțional)</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                >
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2">
                  Limbi vorbite <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(({ code, label }) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setLanguages((prev) =>
                        prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]
                      )}
                      className={cn(
                        "rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
                        languages.includes(code)
                          ? "border-brand-400 bg-brand-50 text-brand-600"
                          : "border-border text-text-secondary hover:border-brand-300",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => { if (step1Valid()) goToStep(2); }}
                disabled={!step1Valid()}
                className="w-full rounded-2xl bg-brand-500 py-3.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-40 transition-colors"
              >
                Continuă
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Servicii & tarife ─────────────────────────────────────── */}
        {step === 2 && (
          <div className="p-8">
            <div className="mb-7">
              <h1 className="text-xl font-bold text-text-primary mb-1">Servicii & tarife</h1>
              <p className="text-sm text-text-secondary">Definește ce oferi și la ce prețuri.</p>
            </div>

            <div className="space-y-5">
              {/* Specializations */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Specializări <span className="text-red-500">*</span>
                </label>
                <div className={cn(
                  "flex flex-wrap gap-1.5 min-h-[44px] rounded-2xl border bg-bg px-3 py-2.5 cursor-text transition-colors",
                  "border-border focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100",
                )}>
                  {specializations.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-xl bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-brand-900 leading-none">×</button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={onTagKeyDown}
                    onBlur={() => { if (tagInput) addTag(tagInput); }}
                    placeholder={specializations.length === 0 ? "Scrie și apasă Enter..." : ""}
                    className="flex-1 min-w-[120px] text-xs text-text-primary placeholder:text-text-muted bg-transparent outline-none"
                  />
                </div>
                {proType && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {SPECIALIZATION_SUGGESTIONS[proType]
                      .filter((s) => !specializations.includes(s))
                      .map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSpecializations((prev) => [...prev, s])}
                          className="rounded-xl border border-dashed border-border px-2.5 py-0.5 text-[10px] text-text-muted hover:border-brand-300 hover:text-brand-600 transition-colors"
                        >
                          + {s}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Session formats */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2">
                  Format sesiuni <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SESSION_FORMATS.map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormats((prev) =>
                        prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value]
                      )}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition-all",
                        formats.includes(value)
                          ? "border-brand-400 bg-brand-50"
                          : "border-border hover:border-brand-300",
                      )}
                    >
                      <Icon size={18} className={formats.includes(value) ? "text-brand-500" : "text-text-muted"} />
                      <span className={cn("text-xs font-medium", formats.includes(value) ? "text-brand-600" : "text-text-secondary")}>
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price + Experience */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                    Preț / ședință <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={50}
                      max={2000}
                      value={price}
                      onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="200"
                      className="w-full rounded-2xl border border-border bg-bg px-4 py-3 pr-12 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-muted font-medium">RON</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                    Ani experiență
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={experience}
                    onChange={(e) => setExperience(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="5"
                    className="w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                  />
                </div>
              </div>

              {/* Trial session */}
              <div className="rounded-2xl border border-border bg-bg p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setHasTrial(!hasTrial)}
                    className={cn(
                      "relative w-9 h-5 rounded-full transition-colors flex-shrink-0 cursor-pointer",
                      hasTrial ? "bg-brand-500" : "bg-border",
                    )}
                  >
                    <span className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                      hasTrial ? "translate-x-4" : "translate-x-0.5",
                    )} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-primary">Ofer ședință de probă</p>
                    <p className="text-[10px] text-text-muted mt-0.5">Sesiune introductivă la preț redus</p>
                  </div>
                </label>

                {hasTrial && (
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
                    <div>
                      <label className="block text-[10px] font-semibold text-text-secondary mb-1">Preț probă (RON)</label>
                      <input
                        type="number"
                        min={0}
                        value={trialPrice}
                        onChange={(e) => setTrialPrice(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="75"
                        className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-text-secondary mb-1">Durată (min)</label>
                      <select
                        value={trialDuration}
                        onChange={(e) => setTrialDuration(Number(e.target.value))}
                        className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-400 transition-all"
                      >
                        {[15, 20, 25, 30, 45, 60].map((m) => (
                          <option key={m} value={m}>{m} min</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => goToStep(1)}
                className="rounded-2xl border border-border px-6 py-3 text-sm font-medium text-text-secondary hover:border-brand-300 transition-colors"
              >
                Înapoi
              </button>
              <button
                onClick={() => { if (step2Valid()) goToStep(3); }}
                disabled={!step2Valid()}
                className="flex-1 rounded-2xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-40 transition-colors"
              >
                Continuă
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Program săptămânal ──────────────────────────────────────── */}
        {step === 3 && (
          <div className="p-8">
            <div className="mb-7">
              <h1 className="text-xl font-bold text-text-primary mb-1">Program săptămânal</h1>
              <p className="text-sm text-text-secondary">Setează zilele și orele în care ești disponibil.</p>
            </div>

            <div className="space-y-2">
              {DAYS.map(({ key, label }) => {
                const day = schedule[key];
                return (
                  <div
                    key={key}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors",
                      day.enabled ? "border-brand-200 bg-brand-50/50" : "border-border bg-bg",
                    )}
                  >
                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => setSchedule((prev) => ({
                        ...prev,
                        [key]: { ...prev[key], enabled: !prev[key].enabled },
                      }))}
                      className={cn(
                        "relative w-9 h-5 rounded-full transition-colors flex-shrink-0",
                        day.enabled ? "bg-brand-500" : "bg-border",
                      )}
                    >
                      <span className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                        day.enabled ? "translate-x-4" : "translate-x-0.5",
                      )} />
                    </button>

                    {/* Day name */}
                    <span className={cn(
                      "text-sm font-medium w-20 flex-shrink-0",
                      day.enabled ? "text-text-primary" : "text-text-muted",
                    )}>{label}</span>

                    {/* Time inputs */}
                    {day.enabled ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => setSchedule((prev) => ({
                            ...prev,
                            [key]: { ...prev[key], startTime: e.target.value },
                          }))}
                          className="rounded-xl border border-border bg-white px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-brand-400 transition-all"
                        />
                        <span className="text-text-muted text-xs">—</span>
                        <input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => setSchedule((prev) => ({
                            ...prev,
                            [key]: { ...prev[key], endTime: e.target.value },
                          }))}
                          className="rounded-xl border border-border bg-white px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-brand-400 transition-all"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-text-muted">Indisponibil</span>
                    )}
                  </div>
                );
              })}
            </div>

            {!step3Valid() && (
              <p className="text-xs text-red-500 mt-3">Selectează cel puțin o zi disponibilă.</p>
            )}

            {error && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                {error}
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => goToStep(2)}
                className="rounded-2xl border border-border px-6 py-3 text-sm font-medium text-text-secondary hover:border-brand-300 transition-colors"
              >
                Înapoi
              </button>
              <button
                onClick={handleSubmit}
                disabled={!step3Valid() || submitting}
                className="flex-1 rounded-2xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-40 transition-colors"
              >
                {submitting ? "Se salvează..." : "Finalizează profilul"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
