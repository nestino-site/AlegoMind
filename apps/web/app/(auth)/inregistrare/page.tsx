"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { cn } from "@/lib/utils";
import { IconCheckBadge, IconBrain, IconTarget, IconLightbulb } from "@/components/ui/Icons";
import type { ProfessionalType } from "@/lib/types";

type Step = "role" | "account";
type Role = "SEEKER" | "PROFESSIONAL";

const PROFESSIONAL_TYPES: { type: ProfessionalType; label: string; desc: string; Icon: React.FC<{ size?: number; className?: string }> }[] = [
  { type: "THERAPIST", label: "Terapeut", desc: "Licențiat în sănătate mentală", Icon: IconBrain },
  { type: "COACH",     label: "Coach",    desc: "Life coach sau coach de carieră", Icon: IconTarget },
  { type: "MENTOR",    label: "Mentor",   desc: "Expert în industrie sau tech", Icon: IconLightbulb },
];

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep]               = useState<Step>("role");
  const [role, setRole]               = useState<Role | null>(null);
  const [profType, setProfType]       = useState<ProfessionalType | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName]     = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPw, setShowPw]           = useState(false);
  const [agreed, setAgreed]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  function handleRoleContinue() {
    if (!role) return;
    if (role === "PROFESSIONAL" && profType) {
      localStorage.setItem("am_pro_type", profType);
    }
    if (role === "PROFESSIONAL") setIsAnonymous(false);
    setStep("account");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!role || !agreed) return;
    setError(null);
    setLoading(true);
    try {
      await authApi.register({
        email,
        password,
        accountType: role,
        displayName: displayName || undefined,
        firstName: isAnonymous ? undefined : firstName || undefined,
        isAnonymous,
      });
      // Redirect to email verification, passing email as query
      router.push(`/verifica-email?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută");
    } finally {
      setLoading(false);
    }
  }

  const pwStrong = password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password);

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-3xl border border-border p-8 shadow-card">

        {/* ── Step 1: Role ──────────────────────────────── */}
        {step === "role" && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-text-primary mb-1">Bun venit!</h1>
              <p className="text-sm text-text-secondary">Cum dorești să te alături platformei?</p>
            </div>

            <div className="space-y-3 mb-6">
              {/* Seeker */}
              <button
                onClick={() => { setRole("SEEKER"); setProfType(null); }}
                className={cn(
                  "w-full text-left rounded-2xl border p-4 transition-all",
                  role === "SEEKER"
                    ? "border-brand-400 bg-brand-50 ring-2 ring-brand-200"
                    : "border-border hover:border-brand-300",
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-text-primary text-sm">Caut sprijin</p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Terapeut, coach sau mentor potrivit pentru mine
                    </p>
                  </div>
                  {role === "SEEKER" && (
                    <IconCheckBadge className="text-brand-500 flex-shrink-0" size={20} />
                  )}
                </div>
              </button>

              {/* Professional */}
              <button
                onClick={() => setRole("PROFESSIONAL")}
                className={cn(
                  "w-full text-left rounded-2xl border p-4 transition-all",
                  role === "PROFESSIONAL"
                    ? "border-brand-400 bg-brand-50 ring-2 ring-brand-200"
                    : "border-border hover:border-brand-300",
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-text-primary text-sm">Sunt profesionist</p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Ofer servicii ca terapeut, coach sau mentor
                    </p>
                  </div>
                  {role === "PROFESSIONAL" && (
                    <IconCheckBadge className="text-brand-500 flex-shrink-0" size={20} />
                  )}
                </div>
              </button>

              {/* Professional sub-type */}
              {role === "PROFESSIONAL" && (
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {PROFESSIONAL_TYPES.map(({ type, label, desc, Icon }) => (
                    <button
                      key={type}
                      onClick={() => setProfType(type)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition-all",
                        profType === type
                          ? "border-brand-400 bg-brand-50"
                          : "border-border hover:border-brand-300",
                      )}
                    >
                      <Icon size={18} className={profType === type ? "text-brand-500" : "text-text-muted"} />
                      <div>
                        <p className="text-xs font-semibold text-text-primary">{label}</p>
                        <p className="text-[10px] text-text-muted leading-tight">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleRoleContinue}
              disabled={!role || (role === "PROFESSIONAL" && !profType)}
              className="w-full rounded-2xl bg-brand-500 py-3.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-40 transition-colors"
            >
              Continuă
            </button>

            <p className="mt-4 text-center text-xs text-text-muted">
              Ai deja cont?{" "}
              <Link href="/autentificare" className="font-semibold text-brand-500 hover:text-brand-600">
                Autentifică-te
              </Link>
            </p>
          </>
        )}

        {/* ── Step 2: Account ───────────────────────────── */}
        {step === "account" && (
          <>
            <div className="flex items-center gap-3 mb-8">
              <button
                onClick={() => setStep("role")}
                className="p-1.5 rounded-xl hover:bg-bg transition-colors text-text-muted"
                aria-label="Înapoi"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Creează contul</h1>
                <p className="text-xs text-text-secondary mt-0.5">
                  {role === "SEEKER" ? "Cont pentru cei care caută sprijin" : "Cont profesionist"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Anonymous toggle — hidden for professionals */}
              {role === "SEEKER" && (
                <label className="flex items-center gap-3 rounded-2xl border border-border bg-bg px-4 py-3 cursor-pointer hover:border-brand-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="h-4 w-4 rounded accent-brand-500"
                  />
                  <div>
                    <p className="text-xs font-semibold text-text-primary">Rămân anonim</p>
                    <p className="text-xs text-text-muted">Folosesc doar un pseudonim — fără nume real</p>
                  </div>
                </label>
              )}

              {/* Name fields */}
              {isAnonymous ? (
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                    Pseudonim public <span className="text-danger">*</span>
                  </label>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="ex. Utilizator123"
                    required
                    className="input-base w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                      Prenume <span className="text-danger">*</span>
                    </label>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Andrei"
                      required={!isAnonymous}
                      className="w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                      Nume afișat
                    </label>
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Andrei P."
                      className="w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Email <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.ro"
                  required
                  className="w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Parolă <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 caractere"
                    required
                    className="w-full rounded-2xl border border-border bg-bg px-4 py-3 pr-11 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-secondary"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      {showPw ? (
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.7"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/>
                        </>
                      )}
                    </svg>
                  </button>
                </div>
                {/* Strength bar */}
                {password && (
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-colors",
                          password.length < 4 ? "bg-border" :
                          !pwStrong && i <= 2 ? "bg-warning" :
                          pwStrong ? "bg-success" : "bg-border",
                        )}
                      />
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-text-muted mt-1.5">
                  Minim 8 caractere, o literă mare, o literă mică, o cifră.
                </p>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-brand-500 flex-shrink-0"
                />
                <span className="text-xs text-text-secondary">
                  Sunt de acord cu{" "}
                  <Link href="/termeni" className="text-brand-500 hover:underline">Termenii de utilizare</Link>
                  {" "}și{" "}
                  <Link href="/confidentialitate" className="text-brand-500 hover:underline">Politica de confidențialitate</Link>
                </span>
              </label>

              {error && (
                <div className="rounded-2xl border border-danger/20 bg-red-50 px-4 py-3 text-xs text-danger">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !agreed}
                className="w-full rounded-2xl bg-brand-500 py-3.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-40 transition-colors"
              >
                {loading ? "Se creează contul..." : "Creează cont"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
