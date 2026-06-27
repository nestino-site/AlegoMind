"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function ConfirmatPage() {
  useParams<{ bookingId: string }>();

  return (
    <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-500 mb-6">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path
            d="M10 21l7 7 13-14"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-text-primary mb-2">Ședință rezervată! 🎉</h1>
      <p className="text-text-secondary mb-8">
        Vei primi un email de confirmare în curând.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Link
          href="/sesiuni"
          className="flex-1 rounded-2xl bg-brand-500 py-3 text-center text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          Ședințele mele
        </Link>
        <Link
          href="/acasa"
          className="flex-1 rounded-2xl border border-border bg-white py-3 text-center text-sm font-semibold text-text-secondary hover:border-brand-300 hover:text-brand-500 transition-colors"
        >
          Înapoi acasă
        </Link>
      </div>
    </div>
  );
}
