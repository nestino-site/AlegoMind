"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/shared/Navbar";
import {
  IconSearch, IconCalendar, IconMessage, IconUsers, IconShield,
} from "@/components/ui/Icons";

const NAV = [
  { href: "/acasa",        label: "Acasă",       Icon: IconShield   },
  { href: "/explorez",     label: "Explorez",    Icon: IconSearch   },
  { href: "/conversatii",  label: "Conversații", Icon: IconMessage  },
  { href: "/sesiuni",      label: "Ședințe",     Icon: IconCalendar },
  { href: "/profil",       label: "Profil",      Icon: IconUsers    },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname  = usePathname();
  const router    = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/");
  }

  // While auth state is loading, render nothing to avoid flash
  if (loading) {
    return (
      <div className="min-h-dvh bg-bg" />
    );
  }

  // Authenticated: render with full dashboard sidebar (same as dashboard layout)
  if (user) {
    return (
      <div className="min-h-dvh bg-bg flex">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r border-border bg-white sticky top-0 h-screen">
          <div className="px-5 py-5 border-b border-border">
            <Link href="/acasa" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-white text-sm font-bold">A</span>
              <span className="font-bold text-text-primary tracking-tight">Alego<span className="text-brand-500">Mind</span></span>
            </Link>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {NAV.map(({ href, label, Icon }) => {
              const active = pathname === href || (href !== "/acasa" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-50 text-brand-600"
                      : "text-text-secondary hover:bg-bg hover:text-text-primary",
                  )}
                >
                  <Icon size={18} className={active ? "text-brand-500" : "text-text-muted"} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 py-4 border-t border-border">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-brand-600">
                  {(user.displayName ?? user.firstName ?? "U")[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-text-primary truncate">
                  {user.displayName ?? user.firstName ?? "Utilizator"}
                </p>
                <p className="text-[10px] text-text-muted truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full rounded-xl px-3 py-2 text-xs font-medium text-text-secondary hover:bg-bg hover:text-text-primary text-left transition-colors"
            >
              Deconectare
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="hidden lg:flex items-center justify-between px-8 h-14 border-b border-border bg-white sticky top-0 z-30">
            <div className="relative w-72">
              <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="search"
                placeholder="Caută furnizori, subiecte..."
                className="w-full rounded-xl border border-border bg-bg py-2 pl-9 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>
            <Link
              href="/explorez"
              className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              Rezervă ședință
            </Link>
          </header>

          <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
            {children}
          </main>

          {/* Bottom nav (mobile) */}
          <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm border-t border-border z-40">
            <div className="flex items-end justify-around px-2 pt-2 pb-2">
              {NAV.map(({ href, label, Icon }) => {
                const active = pathname === href || (href !== "/acasa" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-colors",
                      active ? "text-brand-500" : "text-text-muted",
                    )}
                  >
                    <Icon size={20} />
                    <span className="text-[10px] font-medium">{label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    );
  }

  // Unauthenticated: render with public navbar
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}
