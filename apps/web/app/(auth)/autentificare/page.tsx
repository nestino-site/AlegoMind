"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { authApi } from "@/lib/api/auth";
import type { AuthUser } from "@/lib/types";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setAuth } = useAuth();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const tokens = await authApi.login({ email, password });
      setAuth(tokens);

      if (tokens.user.accountType === "PROFESSIONAL") {
        const next = params.get("next");
        router.replace(next ?? "/profesionist/panou");
        return;
      }

      // SEEKER — a seeker who closed the browser mid-onboarding has no
      // matchingPreference yet, so send them back to finish it instead of /acasa.
      try {
        const me = (await authApi.me(tokens.accessToken)) as AuthUser & {
          matchingPreference: unknown | null;
        };
        if (me.matchingPreference === null) {
          router.replace("/onboarding/tip");
        } else {
          const next = params.get("next");
          router.replace(next ?? "/acasa");
        }
      } catch {
        router.replace("/acasa");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-3xl border border-border p-8 shadow-card">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-1">Bine ai revenit</h1>
          <p className="text-sm text-text-secondary">Continuă-ți parcursul pe AlegoMind.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Email
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-text-secondary">Parolă</label>
              <Link
                href="/parola-uitata"
                className="text-xs text-brand-500 hover:text-brand-600 transition-colors"
              >
                Ai uitat parola?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-2xl border border-border bg-bg px-4 py-3 pr-11 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-secondary transition-colors"
                aria-label={showPw ? "Ascunde parola" : "Arată parola"}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  {showPw ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                      <path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.7"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/>
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-danger/20 bg-red-50 px-4 py-3 text-xs text-danger">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-brand-500 py-3.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60 transition-colors mt-2"
          >
            {loading ? "Se conectează..." : "Autentificare"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-text-muted">
          Nu ai cont?{" "}
          <Link href="/inregistrare" className="font-semibold text-brand-500 hover:text-brand-600 transition-colors">
            Creează unul gratuit
          </Link>
        </p>
      </div>
    </div>
  );
}
