"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** "sheet" slides up from bottom (mobile default), "dialog" is centered */
  variant?: "sheet" | "dialog";
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  variant = "sheet",
  className,
}: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex"
      style={variant === "sheet" ? { alignItems: "flex-end" } : { alignItems: "center", justifyContent: "center" }}
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        className={cn(
          "relative z-10 bg-white shadow-modal w-full",
          variant === "sheet"
            ? "rounded-t-3xl max-h-[90dvh] overflow-y-auto"
            : "rounded-3xl max-w-sm mx-4 max-h-[85dvh] overflow-y-auto",
          className,
        )}
      >
        {/* Drag handle (sheet only) */}
        {variant === "sheet" && (
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-gray-200" />
          </div>
        )}

        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 id="modal-title" className="text-base font-semibold text-text-primary">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              aria-label="Închide"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M12 4L4 12M4 4l8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        )}

        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
