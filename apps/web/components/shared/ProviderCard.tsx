"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Provider } from "@/lib/types";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { AvailabilityDot } from "@/components/ui/AvailabilityDot";
import { RatingStars } from "@/components/ui/RatingStars";
import { SessionFormatChip } from "@/components/ui/SessionFormatChip";
import { messagesApi } from "@/lib/api/messages";

interface ProviderCardProps {
  provider: Provider;
  variant?: "list" | "featured" | "compact";
  className?: string;
}

function Avatar({ provider, size }: { provider: Provider; size: "sm" | "lg" }) {
  const dim = size === "lg" ? "h-16 w-16" : "h-12 w-12";
  const text = size === "lg" ? "text-2xl" : "text-lg";
  return (
    <div className={`relative flex-shrink-0 ${dim} rounded-2xl bg-brand-50 border border-border overflow-hidden`}>
      {provider.avatarUrl ? (
        <Image
          src={provider.avatarUrl}
          alt={provider.displayName}
          fill
          className="object-cover"
        />
      ) : (
        <span className={`flex h-full w-full items-center justify-center ${text} font-bold text-brand-500`}>
          {provider.displayName[0]}
        </span>
      )}
    </div>
  );
}

export function ProviderCard({ provider, variant = "list", className }: ProviderCardProps) {
  const router = useRouter();
  const [messaging, setMessaging] = useState(false);

  async function handleMessage(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (messaging) return;
    setMessaging(true);
    try {
      const conv = await messagesApi.createConversation(provider.id);
      router.push(`/conversatii/${conv.id}`);
    } catch {
      setMessaging(false);
    }
  }

  if (variant === "compact") {
    return (
      <Link
        href={`/profesionist/${provider.id}`}
        className={cn(
          "flex flex-col items-center gap-3 rounded-2xl border border-border bg-white p-4",
          "min-w-[130px] flex-shrink-0 hover:border-brand-300 hover:shadow-card transition-all",
          className,
        )}
      >
        <div className="relative">
          <Avatar provider={provider} size="sm" />
          <AvailabilityDot status={provider.availability} className="absolute -bottom-0.5 -right-0.5" />
        </div>
        <div className="w-full text-center">
          <p className="text-xs font-semibold text-text-primary truncate">{provider.displayName}</p>
          <TypeBadge type={provider.type} className="mt-1" />
        </div>
        <RatingStars rating={provider.rating} size="sm" />
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link
        href={`/profesionist/${provider.id}`}
        className={cn(
          "flex items-center gap-4 rounded-2xl border border-border bg-white p-4",
          "hover:border-brand-300 hover:shadow-card transition-all",
          className,
        )}
      >
        <div className="relative flex-shrink-0">
          <Avatar provider={provider} size="lg" />
          <AvailabilityDot status={provider.availability} className="absolute -bottom-0.5 -right-0.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-text-primary truncate">{provider.displayName}</p>
            <TypeBadge type={provider.type} />
          </div>
          <p className="text-xs text-text-secondary truncate">
            {provider.specializations.slice(0, 2).join(" · ")}
          </p>
          <div className="flex items-center justify-between mt-2">
            <RatingStars rating={provider.rating} reviewCount={provider.reviewCount} size="sm" />
            <span className="text-xs font-semibold text-brand-500">{provider.pricePerSession} RON</span>
          </div>
        </div>
      </Link>
    );
  }

  // list — grid card. The whole card navigates to the profile via an
  // absolutely-positioned overlay Link; the CTA row sits above it with
  // pointer-events re-enabled so those two links stay independently
  // clickable. (A wrapping <Link> wasn't used here because the CTAs are
  // themselves <Link>s, and nesting an <a> inside another <a> is invalid
  // HTML — browsers handle that inconsistently.)
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-3xl border border-border bg-white p-5 hover:border-brand-300 hover:shadow-card-hover transition-all",
        className,
      )}
    >
      <Link
        href={`/profesionist/${provider.id}`}
        className="absolute inset-0 z-0 rounded-3xl"
        aria-label={`Vezi profilul lui ${provider.displayName}`}
      />

      <div className="pointer-events-none relative z-10 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex gap-4 mb-4">
          <div className="relative flex-shrink-0">
            <Avatar provider={provider} size="lg" />
            <AvailabilityDot status={provider.availability} className="absolute -bottom-0.5 -right-0.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0">
                <p className="font-semibold text-text-primary leading-tight">{provider.displayName}</p>
                <TypeBadge type={provider.type} className="mt-1" />
              </div>
              <span className="text-sm font-bold text-brand-500 flex-shrink-0 ml-1">
                {provider.pricePerSession}<span className="text-xs font-medium text-text-muted"> RON</span>
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1.5 truncate">
              {provider.specializations.join(" · ")}
            </p>
          </div>
        </div>

        {/* Rating + availability */}
        <div className="flex items-center justify-between mb-3">
          <RatingStars rating={provider.rating} reviewCount={provider.reviewCount} size="sm" />
          <AvailabilityDot status={provider.availability} showLabel />
        </div>

        {/* Format chips */}
        <div className="flex gap-1.5 flex-wrap mb-4">
          {provider.formats.map((fmt) => (
            <SessionFormatChip key={fmt} format={fmt} />
          ))}
        </div>
      </div>

      {/* CTAs — pointer-events-auto overrides the pointer-events-none above */}
      <div className="relative z-10 pointer-events-auto flex gap-2 mt-auto">
        <button
          onClick={handleMessage}
          disabled={messaging}
          className="flex-1 rounded-xl border border-border py-2 text-center text-xs font-semibold text-text-secondary hover:border-brand-300 hover:text-brand-500 transition-colors disabled:opacity-60"
        >
          {messaging ? "..." : "Mesaj"}
        </button>
        <Link
          href={`/rezervare/${provider.id}/tip`}
          className="flex-1 rounded-xl bg-brand-500 py-2 text-center text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          Rezervă
        </Link>
      </div>
    </div>
  );
}
