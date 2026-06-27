import Link from "next/link";

const STEPS = [
  { href: "/onboarding/obiective",  label: "Obiective" },
  { href: "/onboarding/comunicare", label: "Comunicare" },
  { href: "/onboarding/preferinte", label: "Preferințe" },
];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-white">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-500 text-white text-xs font-bold">A</span>
          <span className="font-bold text-text-primary tracking-tight">Alego<span className="text-brand-500">Mind</span></span>
        </Link>
        <span className="text-xs text-text-muted">Configurare cont</span>
      </header>

      {/* Step bar */}
      <div className="bg-white border-b border-border px-6 py-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.href} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-brand-100 text-brand-600 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-xs font-medium text-text-secondary hidden sm:block truncate">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="flex flex-1 justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          {children}
        </div>
      </main>
    </div>
  );
}
