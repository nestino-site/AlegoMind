"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";

type Step = "email" | "reset";

export default function ParolaUitataPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setStep("reset");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "A apărut o eroare.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.resetPassword({ email, code, newPassword });
      setSuccess(true);
      setTimeout(() => router.push("/autentificare"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Cod invalid sau expirat.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="rounded-3xl border border-border bg-white p-8 shadow-card">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-base font-semibold text-text-primary mb-1">Parolă resetată!</p>
          <p className="text-sm text-text-muted">Te redirecționăm la autentificare...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-3xl border border-border bg-white p-8 shadow-card">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-text-primary mb-1">
            {step === "email" ? "Ai uitat parola?" : "Resetează parola"}
          </h1>
          <p className="text-sm text-text-muted">
            {step === "email"
              ? "Introdu adresa de email și îți trimitem un cod de resetare."
              : `Am trimis un cod la ${email}. Introdu-l mai jos.`}
          </p>
        </div>

        {step === "email" ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Adresă email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="email@exemplu.com"
                className="w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-60"
            >
              {loading ? "Se trimite..." : "Trimite codul"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Cod primit pe email
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                placeholder="123456"
                className="w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Parolă nouă
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Minim 8 caractere"
                className="w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-60"
            >
              {loading ? "Se salvează..." : "Resetează parola"}
            </button>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="w-full text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Nu ai primit codul? Reîncearcă
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-xs text-text-muted">
          Ți-ai amintit parola?{" "}
          <Link href="/autentificare" className="font-semibold text-brand-500 hover:text-brand-600">
            Autentifică-te
          </Link>
        </p>
      </div>
    </div>
  );
}
