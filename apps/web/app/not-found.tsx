import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Minimal nav */}
      <header className="border-b border-border bg-white">
        <div className="container-app flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-500 text-white text-xs font-bold">A</span>
            <span className="font-bold text-text-primary tracking-tight">
              Alego<span className="text-brand-500">Mind</span>
            </span>
          </Link>
          <Link
            href="/autentificare"
            className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
          >
            Autentifică-te
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 rounded-3xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-extrabold text-brand-400">?</span>
          </div>

          <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-3">
            Eroare 404
          </p>
          <h1 className="text-2xl font-bold text-text-primary mb-3">
            Pagina nu a fost găsită
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed mb-8 max-w-xs mx-auto">
            Pagina pe care o cauți nu există sau a fost mutată. Verifică adresa sau întoarce-te acasă.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/acasa"
              className="rounded-2xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              Înapoi acasă
            </Link>
            <Link
              href="/explorez"
              className="rounded-2xl border border-border bg-white px-6 py-3 text-sm font-semibold text-text-secondary hover:border-brand-300 hover:text-text-primary transition-colors"
            >
              Explorează furnizorii
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
