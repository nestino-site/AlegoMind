import { cn } from "@/lib/utils";
import type { ProfessionalType } from "@/lib/types";

const config: Record<ProfessionalType, { label: string; classes: string }> = {
  THERAPIST: {
    label: "Terapeut",
    classes: "bg-brand-100 text-brand-600 ring-brand-200",
  },
  COACH: {
    label: "Coach",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  MENTOR: {
    label: "Mentor",
    classes: "bg-amber-50 text-amber-700 ring-amber-200",
  },
};

interface TypeBadgeProps {
  type: ProfessionalType;
  className?: string;
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  const { label, classes } = config[type];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1",
        classes,
        className,
      )}
    >
      {label}
    </span>
  );
}
