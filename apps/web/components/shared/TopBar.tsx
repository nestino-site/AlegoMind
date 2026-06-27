"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface TopBarProps {
  greeting?: string;
  userName?: string;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
  avatarUrl?: string;
  className?: string;
}

export function TopBar({
  greeting,
  userName,
  onSearch,
  showSearch = true,
  avatarUrl,
  className,
}: TopBarProps) {
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <header className={cn("px-4 pt-4 pb-3 bg-white", className)}>
      {/* Greeting row */}
      {(greeting || userName) && (
        <div className="flex items-center justify-between mb-3">
          <div>
            {greeting && (
              <p className="text-xs text-text-secondary">{greeting}</p>
            )}
            {userName && (
              <h1 className="text-lg font-bold text-text-primary">
                Bună, {userName} 👋
              </h1>
            )}
          </div>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName}
              className="h-9 w-9 rounded-full object-cover ring-2 ring-brand-200"
            />
          ) : userName ? (
            <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center">
              <span className="text-sm font-bold text-brand-600">
                {userName[0].toUpperCase()}
              </span>
            </div>
          ) : null}
        </div>
      )}

      {/* Search input */}
      {showSearch && (
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.7" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={handleChange}
            placeholder="Caută furnizori, subiecte..."
            className={cn(
              "w-full rounded-2xl bg-surface py-2.5 pl-9 pr-4 text-sm text-text-primary",
              "placeholder:text-text-muted border border-border",
              "focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100",
              "transition-colors",
            )}
          />
        </div>
      )}
    </header>
  );
}
