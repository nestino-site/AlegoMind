import Link from "next/link";
import { ProviderCard } from "@/components/shared/ProviderCard";
import { TypeBadge } from "@/components/ui/TypeBadge";
import {
  IconBrain,
  IconTarget,
  IconLightbulb,
  IconShield,
  IconCheckBadge,
  IconClock,
  IconClipboard,
  IconSparkle,
  IconCalendar,
  IconArrowRight,
  IconSearch,
  IconStar,
  IconUsers,
} from "@/components/ui/Icons";
import type { Provider } from "@/lib/types";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PROVIDERS: Provider[] = [
  {
    id: "1",
    displayName: "Dr. Andrei M.",
    type: "THERAPIST",
    specializations: ["Anxietate", "Depresie"],
    rating: 4.9,
    reviewCount: 128,
    sessionCount: 340,
    experienceYears: 8,
    pricePerSession: 280,
    formats: ["VIDEO", "VOICE", "TEXT"],
    availability: "available",
  },
  {
    id: "2",
    displayName: "Mihai T.",
    type: "COACH",
    specializations: ["Carieră", "Leadership"],
    rating: 4.9,
    reviewCount: 94,
    sessionCount: 210,
    experienceYears: 6,
    pricePerSession: 230,
    formats: ["VIDEO", "IN_PERSON"],
    availability: "available",
  },
  {
    id: "3",
    displayName: "Sara M.",
    type: "MENTOR",
    specializations: ["AI & Tech", "Startup"],
    rating: 4.8,
    reviewCount: 57,
    sessionCount: 120,
    experienceYears: 5,
    pricePerSession: 200,
    formats: ["VIDEO", "TEXT"],
    availability: "busy",
  },
  {
    id: "4",
    displayName: "Dr. Elena R.",
    type: "THERAPIST",
    specializations: ["Stres", "Relații"],
    rating: 4.7,
    reviewCount: 83,
    sessionCount: 190,
    experienceYears: 7,
    pricePerSession: 260,
    formats: ["VIDEO", "IN_PERSON"],
    availability: "available",
  },
  {
    id: "5",
    displayName: "Lena P.",
    type: "COACH",
    specializations: ["Dezvoltare personală", "Mindset"],
    rating: 4.6,
    reviewCount: 41,
    sessionCount: 95,
    experienceYears: 4,
    pricePerSession: 180,
    formats: ["TEXT", "VIDEO"],
    availability: "available",
  },
  {
    id: "6",
    displayName: "Ali R.",
    type: "MENTOR",
    specializations: ["Inginerie AI", "Carieră Tech"],
    rating: 4.9,
    reviewCount: 62,
    sessionCount: 140,
    experienceYears: 9,
    pricePerSession: 320,
    formats: ["VIDEO", "VOICE"],
    availability: "busy",
  },
];

const TESTIMONIALS = [
  {
    body: "Am găsit terapeuta perfectă în mai puțin de 24 de ore. Procesul a fost simplu și discret — exact de ce aveam nevoie.",
    author: "Maria C.",
    role: "Utilizator verificat",
    rating: 5,
  },
  {
    body: "Coach-ul meu m-a ajutat să clarific direcția carierei în doar 3 ședințe. Recomand cu căldură oricui se simte blocat.",
    author: "Radu T.",
    role: "Utilizator verificat",
    rating: 5,
  },
  {
    body: "Ca profesionist în domeniu, platforma îmi oferă un panou clar și clienți potriviți profilului meu. Colaborarea este excelentă.",
    author: "Dr. Ioana M.",
    role: "Terapeut verificat",
    rating: 5,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="bg-hero-gradient border-b border-border">
        <div className="container-app pt-20 pb-10 lg:pt-32 lg:pb-14">
          <div className="max-w-2xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-1.5 text-xs font-semibold text-brand-600 mb-8 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
              Confidențial · Verificat · Uman
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-text-primary leading-[1.1] tracking-tight mb-6">
              Nu ești singur.
              <br />
              <span className="text-brand-500">Sprijin real</span> când ai nevoie.
            </h1>

            <p className="text-lg text-text-secondary leading-relaxed mb-10 max-w-lg mx-auto">
              Găsește terapeutul, coach-ul sau mentorul potrivit pentru tine.
              Anonim sau cu identitate — tu alegi.
            </p>

            <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto mb-4">
              <div className="relative flex-1">
                <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="search"
                  placeholder="Anxietate, carieră, mindset..."
                  className="w-full rounded-2xl border border-border bg-white py-3.5 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted shadow-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                />
              </div>
              <button
                type="submit"
                className="rounded-2xl bg-brand-500 px-7 py-3.5 text-sm font-semibold text-white hover:bg-brand-600 active:scale-[0.98] transition-all shadow-sm flex-shrink-0"
              >
                Caută
              </button>
            </form>

            <p className="text-xs text-text-muted">
              Peste{" "}
              <span className="font-semibold text-text-secondary">110 furnizori</span>
              {" "}·{" "}
              <Link href="/explorez" className="underline underline-offset-2 hover:text-text-secondary transition-colors">
                Vezi toți
              </Link>
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="border-t border-border bg-white/70 backdrop-blur-sm">
          <div className="container-app py-5">
            <div className="grid grid-cols-3 divide-x divide-border max-w-xl mx-auto">
              {[
                { value: "110+", label: "Furnizori verificați" },
                { value: "2 400+", label: "Ședințe realizate" },
                { value: "4.8", label: "Rating mediu" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center py-1 px-4">
                  <span className="text-xl font-extrabold text-text-primary">{stat.value}</span>
                  <span className="text-xs text-text-muted mt-0.5 text-center leading-tight">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICE CATEGORIES ────────────────────────────────────────────── */}
      <section className="section bg-white">
        <div className="container-app">
          <div className="max-w-xl mx-auto text-center mb-12">
            <p className="section-title mb-3">Servicii</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-text-primary">
              Ce fel de sprijin cauți?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {[
              {
                Icon: IconBrain,
                label: "Terapie",
                description: "Terapeuți licențiați pentru sănătate mentală, anxietate și depresie.",
                count: 48,
                type: "THERAPIST" as const,
                iconBg: "bg-brand-50",
                iconColor: "text-brand-500",
              },
              {
                Icon: IconTarget,
                label: "Coaching",
                description: "Life coachi pentru carieră, performanță și echilibru personal.",
                count: 34,
                type: "COACH" as const,
                iconBg: "bg-emerald-50",
                iconColor: "text-emerald-600",
              },
              {
                Icon: IconLightbulb,
                label: "Mentorat",
                description: "Mentori experimentați în tech, business și dezvoltare profesională.",
                count: 27,
                type: "MENTOR" as const,
                iconBg: "bg-amber-50",
                iconColor: "text-amber-600",
              },
            ].map(({ Icon, label, description, count, type, iconBg, iconColor }) => (
              <Link
                key={type}
                href={`/explorez?type=${type}`}
                className="group flex flex-col gap-4 rounded-3xl border border-border bg-surface p-7 hover:border-brand-300 hover:shadow-card-hover transition-all"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}>
                  <Icon className={iconColor} size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-text-primary group-hover:text-brand-600 transition-colors">
                      {label}
                    </h3>
                    <TypeBadge type={type} />
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
                </div>
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
                  <span className="text-xs text-text-muted">{count} disponibili</span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-brand-500 group-hover:gap-2 transition-all">
                    Explorează <IconArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PROVIDERS ────────────────────────────────────────────── */}
      <section className="section bg-bg">
        <div className="container-app">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="section-title mb-2">Furnizori</p>
              <h2 className="text-2xl lg:text-3xl font-bold text-text-primary">
                Recomandați pentru tine
              </h2>
            </div>
            <Link
              href="/explorez"
              className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
            >
              Vezi toți
              <IconArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MOCK_PROVIDERS.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} variant="list" />
            ))}
          </div>

          <div className="mt-10 text-center sm:hidden">
            <Link href="/explorez" className="text-sm font-semibold text-brand-500">
              Vezi toți furnizorii
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="section bg-white">
        <div className="container-app">
          <div className="max-w-xl mx-auto text-center mb-14">
            <p className="section-title mb-3">Proces simplu</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-text-primary">
              De la primul pas la prima ședință
            </h2>
          </div>

          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Connector line — desktop only */}
            <div className="hidden sm:block absolute top-6 left-[calc(33.33%+1.5rem)] right-[calc(33.33%+1.5rem)] h-px bg-border" />

            {[
              {
                Icon: IconClipboard,
                step: "01",
                title: "Descrie ce simți",
                body: "Răspunde la câteva întrebări despre nevoile tale. Anonim, fără presiune. Durează 2 minute.",
              },
              {
                Icon: IconSparkle,
                step: "02",
                title: "Găsim potrivirea",
                body: "Algoritmul recomandă furnizori verificați care se potrivesc cu profilul și preferințele tale.",
              },
              {
                Icon: IconCalendar,
                step: "03",
                title: "Rezervă o ședință",
                body: "Alege formatul — video, voce, text sau fizic — și rezervă direct din platformă, instant.",
              },
            ].map(({ Icon, step, title, body }) => (
              <div key={step} className="flex flex-col items-center text-center gap-4 relative">
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 border border-brand-100">
                  <Icon className="text-brand-500" size={22} />
                </div>
                <div>
                  <span className="text-xs font-bold text-brand-400 tracking-widest mb-1 block">{step}</span>
                  <h3 className="font-semibold text-text-primary mb-2">{title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/inregistrare"
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-7 py-3.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors shadow-sm"
            >
              Începe gratuit
              <IconArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TRUST PILLARS ─────────────────────────────────────────────────── */}
      <section className="section bg-bg border-y border-border">
        <div className="container-app">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                Icon: IconShield,
                color: "text-brand-500",
                bg: "bg-brand-50",
                title: "Confidențialitate totală",
                body: "Datele tale sunt protejate și criptate. Poți folosi platforma complet anonim — fără nume real.",
              },
              {
                Icon: IconCheckBadge,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
                title: "Furnizori verificați",
                body: "Toți terapeuții, coachii și mentorii trec printr-un proces riguros de verificare a calificărilor.",
              },
              {
                Icon: IconClock,
                color: "text-amber-600",
                bg: "bg-amber-50",
                title: "Disponibil oricând",
                body: "Ședințe prin text, video, voce sau față în față. Tu alegi formatul și orarul potrivit.",
              },
            ].map(({ Icon, color, bg, title, body }) => (
              <div key={title} className="flex gap-4 bg-white rounded-3xl border border-border p-6">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={color} size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">{title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section className="section bg-white">
        <div className="container-app">
          <div className="max-w-xl mx-auto text-center mb-12">
            <p className="section-title mb-3">Recenzii</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-text-primary">
              Ce spun utilizatorii noștri
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-6"
              >
                {/* Stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <IconStar key={j} size={14} className="text-amber-400 fill-amber-400" strokeWidth={0} />
                  ))}
                </div>
                <p className="text-sm text-text-secondary leading-relaxed flex-1">
                  &ldquo;{t.body}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-600">
                    {t.author[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-primary">{t.author}</p>
                    <p className="text-xs text-text-muted">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────────────── */}
      <section className="section bg-[#181935]">
        <div className="container-app">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/20 border border-brand-400/30">
                <IconUsers className="text-brand-300" size={22} />
              </div>
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 tracking-tight">
              Fă primul pas azi.
            </h2>
            <p className="text-[#9BA4D4] mb-10 max-w-md mx-auto leading-relaxed">
              Înregistrare gratuită. Fără card. Fără obligații.
              Primul pas spre mai bine durează 2 minute.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/inregistrare"
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-8 py-3.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors shadow-lg"
              >
                Creează cont gratuit
                <IconArrowRight size={16} />
              </Link>
              <Link
                href="/explorez"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/8 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/15 transition-colors backdrop-blur-sm"
              >
                Explorează furnizorii
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-border">
        <div className="container-app py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-500 text-white text-xs font-bold">A</span>
                <span className="font-bold text-text-primary">Alego<span className="text-brand-500">Mind</span></span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed max-w-[180px]">
                Platforma română pentru sănătate mentală, coaching și mentorat.
              </p>
            </div>

            {/* Platform */}
            <div>
              <p className="text-xs font-semibold text-text-primary mb-3 uppercase tracking-wider">Platformă</p>
              <ul className="space-y-2">
                {[
                  { label: "Explorează", href: "/explorez" },
                  { label: "Cum funcționează", href: "/#cum-functioneaza" },
                  { label: "Prețuri", href: "/#preturi" },
                  { label: "Asistent AI", href: "/asistent" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-xs text-text-muted hover:text-text-secondary hover:underline transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* For professionals */}
            <div>
              <p className="text-xs font-semibold text-text-primary mb-3 uppercase tracking-wider">Profesioniști</p>
              <ul className="space-y-2">
                {[
                  { label: "Devino furnizor", href: "/inregistrare" },
                  { label: "Panou de control", href: "/profesionist/panou" },
                  { label: "Editează profil", href: "/profesionist/inregistrare" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-xs text-text-muted hover:text-text-secondary hover:underline transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-xs font-semibold text-text-primary mb-3 uppercase tracking-wider">Legal</p>
              <ul className="space-y-2">
                {[
                  { label: "Termeni și condiții", href: "/termeni" },
                  { label: "Confidențialitate", href: "/confidentialitate" },
                  { label: "Cookie-uri", href: "/cookie-uri" },
                  { label: "Contact", href: "/contact" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-xs text-text-muted hover:text-text-secondary hover:underline transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-text-muted">© 2026 AlegoMind. Toate drepturile rezervate.</p>
            <p className="text-xs text-text-muted">Construit cu grijă în România.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
