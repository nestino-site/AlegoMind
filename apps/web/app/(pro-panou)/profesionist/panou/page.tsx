"use client";

import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { IconCalendar, IconMessage, IconUsers, IconArrowRight, IconCheckBadge, IconClock } from "@/components/ui/Icons";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bună dimineața";
  if (h < 18) return "Bună ziua";
  return "Bună seara";
}

const QUICK_ACTIONS = [
  { href: "/profesionist/sedinte",    label: "Ședințele mele",   Icon: IconCalendar, desc: "Programul tău de sesiuni" },
  { href: "/profesionist/mesaje",     label: "Mesaje",            Icon: IconMessage,  desc: "Conversații cu clienții" },
  { href: "/profesionist/clienti",    label: "Clienți",           Icon: IconUsers,    desc: "Istoricul clienților tăi" },
  { href: "/profesionist/inregistrare", label: "Editează profil", Icon: IconClock,    desc: "Actualizează disponibilitatea" },
];

export default function ProDashboardPage() {
  const { user } = useAuth();
  const name = user?.displayName ?? user?.firstName ?? "tu";

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-24 lg:pb-0">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-text-muted text-sm">{getGreeting()}</p>
          <h1 className="text-2xl font-bold text-text-primary mt-0.5">
            Bine ai revenit, {name}
          </h1>
        </div>
        <VerificationBadge />
      </div>

      {/* Verification notice (pending state) */}
      <PendingVerificationBanner />

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Ședințe totale",    value: "0",    sub: "toate timpurile",   muted: true },
          { label: "Clienți activi",    value: "0",    sub: "luna aceasta",       muted: true },
          { label: "Rating mediu",      value: "Nou",  sub: "din recenzii",       muted: true },
          { label: "Venituri / lună",   value: "—",    sub: "în curs de calcul",  muted: true },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-white p-4">
            <p className={`text-2xl font-bold ${stat.muted && (stat.value === "0" || stat.value === "Nou" || stat.value === "—") ? "text-text-muted" : "text-text-primary"}`}>
              {stat.value}
            </p>
            <p className="text-xs font-semibold text-text-secondary mt-1">{stat.label}</p>
            <p className="text-[10px] text-text-muted mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </section>

      {/* Quick actions */}
      <section>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">
          Acțiuni rapide
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map(({ href, label, Icon, desc }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 hover:border-brand-300 hover:shadow-card transition-all group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 group-hover:bg-brand-100 transition-colors">
                <Icon size={18} className="text-brand-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{label}</p>
                <p className="text-xs text-text-muted mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Upcoming sessions placeholder */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">Programare</p>
            <h2 className="text-lg font-bold text-text-primary">Ședințe viitoare</h2>
          </div>
          <Link
            href="/profesionist/sedinte"
            className="flex items-center gap-1 text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors"
          >
            Vezi toate <IconArrowRight size={14} />
          </Link>
        </div>

        <div className="rounded-3xl border border-border bg-white p-10 text-center">
          <div className="h-12 w-12 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
            <IconCalendar size={22} className="text-brand-400" />
          </div>
          <p className="text-sm font-semibold text-text-primary mb-1">Nicio ședință programată</p>
          <p className="text-xs text-text-muted mb-4">
            Clienții îți pot rezerva sesiuni odată ce profilul este aprobat.
          </p>
          <Link
            href="/profesionist/inregistrare"
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Verifică disponibilitatea <IconArrowRight size={13} />
          </Link>
        </div>
      </section>
    </div>
  );
}

function VerificationBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600 flex-shrink-0">
      <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
      În verificare
    </span>
  );
}

function PendingVerificationBanner() {
  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 flex items-start gap-4">
      <div className="h-9 w-9 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
        <IconCheckBadge size={18} className="text-brand-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-800">Profilul tău este în curs de verificare</p>
        <p className="text-xs text-brand-600 mt-0.5 leading-relaxed">
          Echipa noastră revizuiește credențialele în 1–3 zile lucrătoare. Vei primi un email de confirmare când profilul tău este activ.
        </p>
      </div>
    </div>
  );
}
