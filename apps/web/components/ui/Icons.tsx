import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function IconBrain({ className, size = 24, strokeWidth = 1.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9.5 2a4.5 4.5 0 00-4.5 4.5v.5a4 4 0 000 8v.5A4.5 4.5 0 009.5 20h5A4.5 4.5 0 0019 15.5V15a4 4 0 000-8v-.5A4.5 4.5 0 0014.5 2h-5z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M12 2v20M8 7.5h2M8 12h3M8 16.5h2M14 7.5h2M14 12h2M14 16.5h2" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconTarget({ className, size = 24, strokeWidth = 1.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconLightbulb({ className, size = 24, strokeWidth = 1.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 21h6M12 3a7 7 0 014.95 11.95 4 4 0 00-1.45 3.05H8.5a4 4 0 00-1.45-3.05A7 7 0 0112 3z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
    </svg>
  );
}

export function IconShield({ className, size = 24, strokeWidth = 1.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L4 5.5v6.5c0 4.97 3.36 9.63 8 10.5 4.64-.87 8-5.53 8-10.5V5.5L12 2z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCheckBadge({ className, size = 24, strokeWidth = 1.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 12l2 2 4-4M12 2a10 10 0 100 20A10 10 0 0012 2z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconClock({ className, size = 24, strokeWidth = 1.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconClipboard({ className, size = 24, strokeWidth = 1.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="8" y="2" width="8" height="4" rx="1" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M8 3H6a2 2 0 00-2 2v15a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconSparkle({ className, size = 24, strokeWidth = 1.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.64 5.64l2.12 2.12M16.24 16.24l2.12 2.12M5.64 18.36l2.12-2.12M16.24 7.76l2.12-2.12" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  );
}

export function IconCalendar({ className, size = 24, strokeWidth = 1.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconStar({ className, size = 24, strokeWidth = 1.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
    </svg>
  );
}

export function IconUsers({ className, size = 24, strokeWidth = 1.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M3 20c0-4 2.7-7 6-7s6 3 6 7" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M16 3.13a4 4 0 010 7.75M21 20c0-3.37-2-6-5-6.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconArrowRight({ className, size = 16, strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSearch({ className, size = 18, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconVideo({ className, size = 16, strokeWidth = 1.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M16 10l5-3v10l-5-3V10z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
    </svg>
  );
}

export function IconMessage({ className, size = 16, strokeWidth = 1.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
    </svg>
  );
}

export function IconPhone({ className, size = 16, strokeWidth = 1.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 10.9 19.79 19.79 0 012 2.32 2 2 0 014 .13h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
    </svg>
  );
}

export function IconMapPin({ className, size = 16, strokeWidth = 1.7 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  );
}

export function IconChevronLeft({ className, size = 20, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSend({ className, size = 18, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
