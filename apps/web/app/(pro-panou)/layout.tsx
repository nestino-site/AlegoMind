"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";
import { IconCalendar, IconMessage, IconUsers, IconStar } from "@/components/ui/Icons";

function IconHome({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 12L12 3l9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const NAV = [
  { href: "/profesionist/panou",      label: "Panou",      Icon: IconHome     },
  { href: "/profesionist/sedinte",    label: "Sedinte",    Icon: IconCalendar },
  { href: "/profesionist/mesaje",     label: "Mesaje",     Icon: IconMessage  },
  { href: "/profesionist/clienti",    label: "Clienti",    Icon: IconUsers    },
  { href: "/profesionist/statistici", label: "Statistici", Icon: IconStar     },
];

export default function ProDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  async function handleLogout() {
    setShowLogoutConfirm(false);
    await logout();
    router.replace("/");
  }

  return (
    <div className="min-h-dvh bg-bg flex">
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r border-border bg-white sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-border">
          <Link href="/profesionist/panou" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-white text-sm font-bold">A</span>
            <span className="font-bold text-text-primary tracking-tight">Alego<span className="text-brand-500">Mind</span></span>
          </Link>
          <span className="text-[10px] text-text-muted mt-1 block">Panou profesionist</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href || (href !== "/profesionist/panou" && pathname.startsWith(href));
            return (
              <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors", active ? "bg-brand-50 text-brand-600" : "text-text-secondary hover:bg-bg hover:text-text-primary")}>
                <Icon size={18} className={active ? "text-brand-500" : "text-text-muted"} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-brand-600">{(user?.displayName ?? user?.firstName ?? "P")[0].toUpperCase()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-text-primary truncate">{user?.displayName ?? user?.firstName ?? "Profesionist"}</p>
              <p className="text-[10px] text-text-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={() => setShowLogoutConfirm(true)} className="w-full rounded-xl px-3 py-2 text-xs font-medium text-text-secondary hover:bg-bg hover:text-text-primary text-left transition-colors">
            Deconectare
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden lg:flex items-center justify-between px-8 h-14 border-b border-border bg-white sticky top-0 z-30">
          <p className="text-sm font-semibold text-text-primary">
            {NAV.find((n) => pathname === n.href || (n.href !== "/profesionist/panou" && pathname.startsWith(n.href)))?.label ?? "Panou"}
          </p>
          <Link href="/profesionist/inregistrare" className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-text-secondary hover:border-brand-300 transition-colors">
            Editeaza profil
          </Link>
        </header>
        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">{children}</main>
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm border-t border-border z-40">
          <div className="flex items-end justify-around px-2 pt-2 pb-2">
            {NAV.map(({ href, label, Icon }) => {
              const active = pathname === href || (href !== "/profesionist/panou" && pathname.startsWith(href));
              return (
                <Link key={href} href={href} className={cn("flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-colors", active ? "text-brand-500" : "text-text-muted")}>
                  <Icon size={20} />
                  <span className="text-[10px] font-medium">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Te deconectezi?"
        message="Vei fi deconectat. Poti reveni oricand."
        confirmLabel="Da, deconecteaza-ma"
        cancelLabel="Raman"
        variant="warning"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
