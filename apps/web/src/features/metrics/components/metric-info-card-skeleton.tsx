import { Info } from "lucide-react";

export interface MetricInfoCardSkeletonProps {
  className?: string;
  iconSize?: "sm" | "md";
}

export function MetricInfoCardSkeleton({
  className = "",
  iconSize = "sm",
}: MetricInfoCardSkeletonProps) {
  const iconClasses = iconSize === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full p-1 text-muted-foreground transition-colors ${className}`}
      aria-hidden="true"
    >
      <Info className={iconClasses} />
    </div>
  );
}
