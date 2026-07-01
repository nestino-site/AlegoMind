"use client";

import { useState, type FormEvent } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="container-app py-12 lg:py-20 max-w-4xl">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-text-primary mb-3">Contact</h1>
        <p className="text-text-secondary text-base max-w-md mx-auto leading-relaxed">
          Ai o întrebare sau ai nevoie de ajutor? Scrie-ne și îți răspundem în cel mai scurt timp.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-white p-6">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Informații de contact</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-text-muted mb-0.5">Email general</p>
                <a href="mailto:hello@alegomind.ro" className="text-sm font-medium text-brand-500 hover:underline">
                  hello@alegomind.ro
                </a>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-0.5">Suport</p>
                <a href="mailto:suport@alegomind.ro" className="text-sm font-medium text-brand-500 hover:underline">
                  suport@alegomind.ro
                </a>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-0.5">Legal & GDPR</p>
                <a href="mailto:privacy@alegomind.ro" className="text-sm font-medium text-brand-500 hover:underline">
                  privacy@alegomind.ro
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-white p-6">
            <h2 className="text-sm font-semibold text-text-primary mb-2">Program răspuns</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Luni – Vineri, 9:00 – 18:00<br />
              Timp mediu de răspuns: 24 de ore
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-white p-7">
          {sent ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-base font-semibold text-text-primary mb-1">Mesaj trimis!</p>
              <p className="text-sm text-text-muted">Îți vom răspunde în cel mai scurt timp.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-sm font-semibold text-text-primary mb-4">Trimite un mesaj</h2>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Nume</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Numele tău"
                  className="w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@exemplu.com"
                  className="w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Mesaj</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={5}
                  placeholder="Cu ce te putem ajuta?"
                  className="w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
              >
                Trimite mesajul
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
