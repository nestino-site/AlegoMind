import Link from "next/link";

export default function ProfesionistLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <header className="flex items-center justify-between px-6 h-14 border-b border-border bg-white flex-shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-500 text-white text-xs font-bold">A</span>
          <span className="font-bold text-text-primary tracking-tight text-sm">
            Alego<span className="text-brand-500">Mind</span>
          </span>
        </Link>
        <span className="text-xs text-text-muted">Configurare profil profesionist</span>
      </header>
      <main className="flex-1 flex items-start justify-center px-4 py-10">
        {children}
      </main>
    </div>
  );
}
