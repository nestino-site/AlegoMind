import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Minimal header */}
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-500 text-white text-xs font-bold">
            A
          </span>
          <span className="font-bold text-text-primary tracking-tight">
            Alego<span className="text-brand-500">Mind</span>
          </span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        {children}
      </main>

      <footer className="py-4 text-center text-xs text-text-muted">
        © 2026 AlegoMind
      </footer>
    </div>
  );
}
