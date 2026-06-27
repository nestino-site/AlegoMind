"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/",
    label: "Acasă",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M9 21V12h6v9"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/explorez",
    label: "Explorez",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.7" />
        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/conversatii",
    label: "Conversații",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/sedinte",
    label: "Ședințe",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M16 2v4M8 2v4M3 10h18"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/profil",
    label: "Profil",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

interface BottomNavProps {
  unreadChats?: number;
}

export function BottomNav({ unreadChats = 0 }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 bg-white/95 backdrop-blur-sm border-t border-border safe-area-pb">
      <ul className="flex items-end justify-around px-1 pt-2 pb-safe">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 rounded-2xl transition-colors min-w-[54px]",
                  active ? "text-brand-600" : "text-text-muted",
                )}
              >
                <span className="relative">
                  {item.icon}
                  {item.label === "Conversații" && unreadChats > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadChats > 9 ? "9+" : unreadChats}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-medium leading-none",
                    active ? "text-brand-600" : "text-text-muted",
                  )}
                >
                  {item.label}
                </span>
                {active && (
                  <span className="h-1 w-1 rounded-full bg-brand-600 mt-0.5" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
