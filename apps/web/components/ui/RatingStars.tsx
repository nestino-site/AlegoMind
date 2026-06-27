import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md";
  className?: string;
}

export function RatingStars({ rating, reviewCount, size = "sm", className }: RatingStarsProps) {
  const filled = Math.round(rating);
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span
        className={cn(
          "font-semibold text-amber-500",
          size === "sm" ? "text-sm" : "text-base",
        )}
      >
        ★ {rating.toFixed(1)}
      </span>
      {reviewCount !== undefined && (
        <span className="text-xs text-text-muted">({reviewCount})</span>
      )}
      <span className="sr-only">{filled} din 5 stele</span>
    </span>
  );
}
