"use client";

import { IconMessage } from "@/components/ui/Icons";

export default function ConversatiiPage() {
  return (
    <div className="max-w-3xl mx-auto pb-24 lg:pb-0">
      <div className="mb-8">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">Inbox</p>
        <h1 className="text-2xl font-bold text-text-primary">Conversații</h1>
      </div>

      <div className="rounded-3xl border border-border bg-white p-12 text-center">
        <div className="h-14 w-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
          <IconMessage size={24} className="text-brand-400" />
        </div>
        <p className="text-sm font-semibold text-text-primary mb-1">Nicio conversație încă</p>
        <p className="text-xs text-text-muted mb-5 max-w-xs mx-auto leading-relaxed">
          Trimite un mesaj unui furnizor și conversația va apărea aici.
        </p>
        <a
          href="/explorez"
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          Găsește un furnizor
        </a>
      </div>
    </div>
  );
}
