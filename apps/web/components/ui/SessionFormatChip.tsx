import { cn } from "@/lib/utils";
import type { SessionFormat } from "@/lib/types";
import { IconMessage, IconVideo, IconPhone, IconMapPin } from "./Icons";

const config: Record<SessionFormat, { Icon: React.FC<{ className?: string; size?: number }>; label: string }> = {
  TEXT:      { Icon: IconMessage, label: "Chat" },
  VIDEO:     { Icon: IconVideo,   label: "Video" },
  VOICE:     { Icon: IconPhone,   label: "Voce" },
  IN_PERSON: { Icon: IconMapPin,  label: "Fizic" },
};

interface SessionFormatChipProps {
  format: SessionFormat;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function SessionFormatChip({ format, active, onClick, className }: SessionFormatChipProps) {
  const { Icon, label } = config[format];
  const Tag = onClick ? "button" : "span";

  return (
    <Tag
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-brand-100 text-brand-600 ring-1 ring-brand-300"
          : "bg-gray-100 text-text-secondary",
        onClick && "cursor-pointer hover:bg-brand-50",
        className,
      )}
    >
      <Icon size={12} className="flex-shrink-0" />
      {label}
    </Tag>
  );
}
