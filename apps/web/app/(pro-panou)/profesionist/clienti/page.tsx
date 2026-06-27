"use client";

import { IconUsers } from "@/components/ui/Icons";

export default function ProClientiPage() {
  return (
    <div className="max-w-3xl mx-auto pb-24 lg:pb-0">
      <div className="mb-8">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">CRM</p>
        <h1 className="text-2xl font-bold text-text-primary">Clienții mei</h1>
      </div>

      <div className="rounded-3xl border border-border bg-white p-12 text-center">
        <div className="h-14 w-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
          <IconUsers size={24} className="text-brand-400" />
        </div>
        <p className="text-sm font-semibold text-text-primary mb-1">Niciun client încă</p>
        <p className="text-xs text-text-muted max-w-xs mx-auto leading-relaxed">
          Clienții care au rezervat ședințe cu tine vor apărea aici.
        </p>
      </div>
    </div>
  );
}
