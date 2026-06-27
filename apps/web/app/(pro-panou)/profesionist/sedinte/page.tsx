"use client";

import { IconCalendar } from "@/components/ui/Icons";

export default function ProSedintePage() {
  return (
    <div className="max-w-3xl mx-auto pb-24 lg:pb-0">
      <div className="mb-8">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">Programare</p>
        <h1 className="text-2xl font-bold text-text-primary">Ședințele mele</h1>
      </div>

      <div className="flex gap-1 rounded-2xl border border-border bg-bg p-1 max-w-xs mb-6">
        {["Viitoare", "Trecute"].map((tab, i) => (
          <button
            key={tab}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${
              i === 0
                ? "bg-white text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-white p-12 text-center">
        <div className="h-14 w-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
          <IconCalendar size={24} className="text-brand-400" />
        </div>
        <p className="text-sm font-semibold text-text-primary mb-1">Nicio ședință programată</p>
        <p className="text-xs text-text-muted max-w-xs mx-auto leading-relaxed">
          Ședințele rezervate de clienți vor apărea aici după aprobarea profilului.
        </p>
      </div>
    </div>
  );
}
