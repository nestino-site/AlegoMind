"use client";

import { useAuth } from "@/lib/context/AuthContext";

export default function ProfilPage() {
  const { user } = useAuth();
  const initials = (user?.displayName ?? user?.firstName ?? "U")[0].toUpperCase();

  return (
    <div className="max-w-2xl mx-auto pb-24 lg:pb-0">
      <div className="mb-8">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">Cont</p>
        <h1 className="text-2xl font-bold text-text-primary">Profilul meu</h1>
      </div>

      {/* Avatar + name */}
      <div className="rounded-3xl border border-border bg-white p-6 mb-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-brand-600">{initials}</span>
          </div>
          <div>
            <p className="font-semibold text-text-primary">
              {user?.displayName ?? user?.firstName ?? "Utilizator"}
            </p>
            <p className="text-xs text-text-muted mt-0.5">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { label: "Prenume", value: user?.firstName ?? "—" },
            { label: "Nume afișat", value: user?.displayName ?? "—" },
            { label: "Email", value: user?.email ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <span className="text-sm text-text-secondary">{label}</span>
              <span className="text-sm font-medium text-text-primary">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Placeholder action */}
      <div className="rounded-2xl border border-border bg-bg p-4 text-center">
        <p className="text-xs text-text-muted">
          Editarea profilului va fi disponibilă în curând.
        </p>
      </div>
    </div>
  );
}
