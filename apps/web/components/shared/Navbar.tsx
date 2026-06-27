"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";

const NAV_LINKS = [
  { href: "/explorez",          label: "Explorează" },
  { href: "/cum-functioneaza",  label: "Cum funcționează" },
  { href: "/preturi",           label: "Prețuri" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/");
  }

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-nav">
      <div className="container-app flex h-16 items-center justify-between gap-6">
        {/* Logo */}
        <Link href={user ? "/acasa" : "/"} className="flex items-center gap-2.5 flex-shrink-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-white text-sm font-bold shadow-sm">
            A
          </span>
          <span className="text-lg font-bold text-text-primary tracking-tight">
            Alego<span className="text-brand-500">Mind</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl px-3.5 py-2 text-sm font-medium text-text-secondary hover:bg-bg hover:text-text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/acasa"
                className="rounded-xl px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Panou
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:border-brand-300 transition-colors"
              >
                Deconectare
              </button>
            </>
          ) : (
            <>
              <Link
                href="/autentificare"
                className="rounded-xl px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Autentificare
              </Link>
              <Link
                href="/inregistrare"
                className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors shadow-sm"
              >
                Începe gratuit
              </Link>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden p-2 rounded-xl hover:bg-bg transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Meniu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            {mobileOpen ? (
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-white px-6 py-4 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-bg hover:text-text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 mt-1 border-t border-border flex flex-col gap-2">
            {user ? (
              <>
                <Link href="/acasa" className="rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-bg text-center transition-colors">
                  Panou
                </Link>
                <button onClick={handleLogout} className="rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-text-secondary">
                  Deconectare
                </button>
              </>
            ) : (
              <>
                <Link href="/autentificare" className="rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-bg text-center transition-colors">
                  Autentificare
                </Link>
                <Link href="/inregistrare" className="rounded-xl bg-brand-500 px-3 py-2.5 text-sm font-semibold text-white text-center hover:bg-brand-600 transition-colors">
                  Începe gratuit
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
