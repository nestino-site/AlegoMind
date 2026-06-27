"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
}

const sizeClasses = {
  sm: "h-8 px-3 text-sm rounded-xl",
  md: "h-11 px-5 text-sm rounded-2xl",
  lg: "h-13 px-6 text-base rounded-2xl",
};

export function PrimaryButton({
  className,
  size = "md",
  fullWidth,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all",
        "bg-brand-600 text-white hover:bg-brand-700 active:scale-[0.98]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2",
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      )}
      {children}
    </button>
  );
}

export function SecondaryButton({
  className,
  size = "md",
  fullWidth,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all",
        "bg-brand-100 text-brand-700 hover:bg-brand-200 active:scale-[0.98]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2",
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-300 border-t-brand-700" />
      )}
      {children}
    </button>
  );
}

export function GhostButton({
  className,
  size = "md",
  fullWidth,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all",
        "bg-transparent text-text-secondary hover:bg-gray-100 active:scale-[0.98]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2",
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {children}
    </button>
  );
}
