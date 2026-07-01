"use client";

import { useEffect, useState, type FormEvent } from "react";
import { professionalsApi, type CreateProfilePayload } from "@/lib/api/professionals";
import type { ProfessionalType, SessionFormat } from "@/lib/types";

const TYPES: { value: ProfessionalType; label: string }[] = [
  { value: "THERAPIST", label: "Terapeut" },
  { value: "COACH", label: "Coach" },
  { value: "MENTOR", label: "Mentor" },
];

const FORMATS: { value: SessionFormat; label: string }[] = [
  { value: "TEXT", label: "Chat text" },
  { value: "VIDEO", label: "Video" },
  { value: "VOICE", label: "Vocal" },
  { value: "IN_PERSON", label: "Față în față" },
];

export default function EditProfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false); // true when no profile exists yet

  const [type, setType] = useState<ProfessionalType>("THERAPIST");
  const [bio, setBio] = useState("");
  const [specializations, setSpecializations] = useState("");
  const [languages, setLanguages] = useState("");
  const [formats, setFormats] = useState<SessionFormat[]>([]);
  const [pricePerSession, setPricePerSession] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [availableForTrial, setAvailableForTrial] = useState(false);
  const [trialPrice, setTrialPrice] = useState("");
  const [trialDuration, setTrialDuration] = useState("");

  useEffect(() => {
    professionalsApi
      .getMyProfile()
      .then((p) => {
        setType(p.type);
        setBio(p.bio ?? "");
        setSpecializations(p.specializations.join(", "));
        setLanguages(p.languages.join(", "));
        setFormats(p.sessionFormats);
        setPricePerSession(String(p.pricePerSession));
        setYearsExperience(String(p.yearsExperience));
        setAvailableForTrial(p.availableForTrial);
        setTrialPrice(p.trialPrice != null ? String(p.trialPrice) : "");
        setTrialDuration(p.trialDuration != null ? String(p.trialDuration) : "");
      })
      .catch(() => {
        // 404 = no profile created yet; start with blank form
        setIsNew(true);
      })
      .finally(() => setLoading(false));
  }, []);

  function toggleFormat(fmt: SessionFormat) {
    setFormats((prev) =>
      prev.includes(fmt) ? prev.filter((f) => f !== fmt) : [...prev, fmt],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const payload: Partial<CreateProfilePayload> = {
      type,
      bio,
      specializations: specializations.split(",").map((s) => s.trim()).filter(Boolean),
      sessionFormats: formats,
      languages: languages.split(",").map((l) => l.trim()).filter(Boolean),
      pricePerSession: parseFloat(pricePerSession),
      yearsExperience: parseInt(yearsExperience || "0", 10),
      availableForTrial,
      ...(availableForTrial && trialPrice ? { trialPrice: parseFloat(trialPrice) } : {}),
      ...(availableForTrial && trialDuration ? { trialDuration: parseInt(trialDuration, 10) } : {}),
    };

    try {
      if (isNew) {
        await professionalsApi.createProfile(payload as import("@/lib/api/professionals").CreateProfilePayload);
        setIsNew(false);
      } else {
        await professionalsApi.updateProfile(payload);
      }
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
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl border border-border bg-white animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-24 lg:pb-0">
      <div className="mb-8">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">Cont profesionist</p>
        <h1 className="text-2xl font-bold text-text-primary">
          {isNew ? "Creează profilul" : "Editează profilul"}
        </h1>
        {isNew && (
          <p className="text-sm text-amber-600 mt-1">
            Profilul tău nu a fost creat încă. Completează informațiile de mai jos pentru a apărea în căutări.
          </p>
        )}
      </div>

      {success && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {isNew ? "Profilul a fost creat cu succes! Acum ești vizibil în căutări." : "Profilul a fost salvat cu succes."}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-3xl border border-border bg-white p-6 space-y-5">
          <h2 className="text-sm font-semibold text-text-primary">Informații de bază</h2>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2">Tip profesionist</label>
            <div className="flex gap-2 flex-wrap">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold border transition-colors ${
                    type === t.value
                      ? "bg-brand-500 text-white border-brand-500"
                      : "border-border text-text-secondary hover:border-brand-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              required
              placeholder="Descrie-te profesional, experiența și abordarea ta..."
              className="w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Specializări <span className="font-normal text-text-muted">(separate prin virgulă)</span>
            </label>
            <input
              type="text"
              value={specializations}
              onChange={(e) => setSpecializations(e.target.value)}
              required
              placeholder="anxietate, depresie, relații, burnout"
              className="w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Limbi vorbite <span className="font-normal text-text-muted">(separate prin virgulă)</span>
            </label>
            <input
              type="text"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              required
              placeholder="Română, Engleză"
              className="w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2">Formate de sesiune</label>
            <div className="flex gap-2 flex-wrap">
              {FORMATS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => toggleFormat(f.value)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition-colors ${
                    formats.includes(f.value)
                      ? "bg-brand-500 text-white border-brand-500"
                      : "border-border text-text-secondary hover:border-brand-300"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-white p-6 space-y-5">
          <h2 className="text-sm font-semibold text-text-primary">Prețuri și experiență</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Preț / ședință (RON)</label>
              <input
                type="number"
                min="0"
                value={pricePerSession}
                onChange={(e) => setPricePerSession(e.target.value)}
                required
                placeholder="150"
                className="w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Ani de experiență</label>
              <input
                type="number"
                min="0"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                placeholder="5"
                className="w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={availableForTrial}
                onChange={(e) => setAvailableForTrial(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-text-primary">Ofer sesiune de probă</span>
            </label>
          </div>

          {availableForTrial && (
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Preț probă (RON)</label>
                <input
                  type="number"
                  min="0"
                  value={trialPrice}
                  onChange={(e) => setTrialPrice(e.target.value)}
                  placeholder="50"
                  className="w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Durată probă (min)</label>
                <input
                  type="number"
                  min="0"
                  value={trialDuration}
                  onChange={(e) => setTrialDuration(e.target.value)}
                  placeholder="30"
                  className="w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving || formats.length === 0}
          className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-60"
        >
          {saving
            ? "Se salvează..."
            : isNew
            ? "Creează profilul"
            : "Salvează modificările"}
        </button>
      </form>
    </div>
  );
}
