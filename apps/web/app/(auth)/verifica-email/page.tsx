"use client";

import { Suspense, useState, useRef, useEffect, type KeyboardEvent, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { authApi } from "@/lib/api/auth";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}

function VerifyEmailForm() {
  const router      = useRouter();
  const params      = useSearchParams();
  const { setAuth } = useAuth();

  const [email, setEmail]       = useState(params.get("email") ?? "");
  const [editEmail, setEditEmail] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [code, setCode]           = useState(["", "", "", "", "", ""]);
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [resent, setResent]       = useState(false);

  const inputs   = useRef<(HTMLInputElement | null)[]>([]);
  const emailRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isEditing) emailRef.current?.focus();
  }, [isEditing]);

  // ── OTP handlers ────────────────────────────────────────────────────────────

  function handleDigit(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...code];
    next[index] = value;
    setCode(next);
    if (value && index < 5) inputs.current[index + 1]?.focus();
    if (value && index === 5 && next.every(Boolean)) verify(next.join(""));
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      verify(pasted);
    }
  }

  async function verify(fullCode: string) {
    if (!email) { setError("Email lipsă."); return; }
    setError(null);
    setLoading(true);
    try {
      const tokens = await authApi.verifyEmail({ email, code: fullCode });
      setAuth(tokens);
      router.replace(
        tokens.user.accountType === "SEEKER"
          ? "/onboarding/tip"
          : "/profesionist/inregistrare",
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Cod invalid sau expirat.");
      setCode(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  // ── Resend / edit email ──────────────────────────────────────────────────────

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setResent(false);
    setError(null);
    try {
      await authApi.resendVerification(email);
      setResent(true);
      setCode(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } catch {
      setError("Nu s-a putut retrimite codul. Încearcă din nou.");
    } finally {
      setResending(false);
    }
  }

  function startEdit() {
    setEditEmail(email);
    setIsEditing(true);
    setResent(false);
    setError(null);
  }

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = editEmail.trim();
    if (!trimmed || trimmed === email) { setIsEditing(false); return; }

    setResending(true);
    setError(null);
    try {
      await authApi.resendVerification(trimmed);
      setEmail(trimmed);
      setIsEditing(false);
      setResent(true);
      setCode(["", "", "", "", "", ""]);
      setTimeout(() => inputs.current[0]?.focus(), 50);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Nu s-a putut trimite codul la această adresă.");
    } finally {
      setResending(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-3xl border border-border p-8 shadow-card text-center">

        {/* Icon */}
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 border border-brand-100">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-brand-500">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
            <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
          </svg>
        </div>

        <h1 className="text-xl font-bold text-text-primary mb-2">Verifică emailul</h1>
        <p className="text-sm text-text-secondary mb-4">
          Am trimis un cod de 6 cifre la
        </p>

        {/* Email display / edit ──────────────────────────────────────────── */}
        {isEditing ? (
          <form onSubmit={handleEmailSubmit} className="mb-6 text-left">
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 text-center">
              Adresă email
            </label>
            <div className="flex gap-2">
              <input
                ref={emailRef}
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
                placeholder="tu@email.ro"
                className="flex-1 rounded-2xl border border-brand-400 bg-bg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-100 transition-all"
              />
              <button
                type="submit"
                disabled={resending || !editEmail.trim()}
                className="rounded-2xl bg-brand-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-40 transition-colors flex-shrink-0"
              >
                {resending ? "..." : "Trimite"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-2xl border border-border px-3 py-2.5 text-xs font-medium text-text-secondary hover:border-brand-300 transition-colors flex-shrink-0"
              >
                Anulează
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-2 mb-8">
            <p className="text-sm font-semibold text-text-primary">{email}</p>
            <button
              onClick={startEdit}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium text-brand-500 hover:bg-brand-50 transition-colors"
              aria-label="Editează adresa de email"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Editează
            </button>
          </div>
        )}

        {/* OTP inputs */}
        <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={isEditing}
              className="h-12 w-10 rounded-xl border border-border bg-bg text-center text-lg font-bold text-text-primary focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all disabled:opacity-40"
            />
          ))}
        </div>

        {/* Feedback banners */}
        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
            {error}
          </div>
        )}
        {resent && !error && (
          <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-700">
            Cod trimis la <strong>{email}</strong>. Verifică inbox-ul.
          </div>
        )}

        <button
          onClick={() => { const full = code.join(""); if (full.length === 6) verify(full); }}
          disabled={loading || isEditing || code.some((d) => !d)}
          className="w-full rounded-2xl bg-brand-500 py-3.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-40 transition-colors mb-4"
        >
          {loading ? "Se verifică..." : "Verifică codul"}
        </button>

        <p className="text-xs text-text-muted">
          Nu ai primit codul?{" "}
          <button
            onClick={handleResend}
            disabled={resending || isEditing}
            className="font-semibold text-brand-500 hover:text-brand-600 disabled:opacity-50 transition-colors"
          >
            {resending ? "Se trimite..." : "Retrimite"}
          </button>
        </p>

      </div>
    </div>
  );
}
