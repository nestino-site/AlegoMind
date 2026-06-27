import { cn } from "@/lib/utils";
import type { AvailabilityStatus } from "@/lib/types";

const config: Record<AvailabilityStatus, { color: string; label: string }> = {
  available: { color: "bg-emerald-400", label: "Disponibil" },
  busy:      { color: "bg-gray-300",    label: "Ocupat" },
  offline:   { color: "bg-gray-200",    label: "Offline" },
};

interface AvailabilityDotProps {
  status: AvailabilityStatus;
  showLabel?: boolean;
  className?: string;
}

export function AvailabilityDot({ status, showLabel, className }: AvailabilityDotProps) {
  const { color, label } = config[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "h-2 w-2 rounded-full flex-shrink-0",
          color,
          status === "available" && "ring-2 ring-emerald-200",
        )}
        aria-hidden="true"
      />
      {showLabel && (
        <span className="text-xs text-text-secondary">{label}</span>
      )}
    </span>
  );
}
