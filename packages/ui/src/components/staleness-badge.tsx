"use client";

import * as React from "react";
import { RefreshCw, Clock, WifiOff } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";

export interface StalenessBadgeProps {
  /** Whether the data is stale */
  isStale: boolean;
  /** Human-readable label (e.g., "5 minutes ago") */
  label: string;
  /** Callback when user clicks refresh */
  onRefresh?: () => void;
  /** Whether a refresh is in progress */
  isRefreshing?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * StalenessBadge - Visual indicator for stale data (Story 4.4)
 *
 * Implements "Calm" UX philosophy:
 * - Shows yellow/orange warning badge when data is stale
 * - Provides refresh functionality with navigator.onLine check
 * - Displays non-blocking offline message when needed
 *
 * @example
 * ```tsx
 * const { isStale, label } = useStaleness(meta.staleness);
 * <StalenessBadge
 *   isStale={isStale}
 *   label={label}
 *   onRefresh={() => queryClient.invalidateQueries(['portfolio'])}
 * />
 * ```
 */
export function StalenessBadge({
  isStale,
  label,
  onRefresh,
  isRefreshing = false,
  className,
}: StalenessBadgeProps) {
  const [isOffline, setIsOffline] = React.useState(false);

  // Don't render if data is fresh
  if (!isStale) {
    return null;
  }

  const handleRefresh = () => {
    // Check navigator.onLine before attempting refresh
    if (typeof window !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
      // Clear offline message after 3 seconds
      setTimeout(() => setIsOffline(false), 3000);
      return;
    }

    setIsOffline(false);
    onRefresh?.();
  };

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-2", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
                "text-xs font-medium",
                "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
                "border border-amber-500/30",
                "transition-all duration-200",
                "hover:bg-amber-500/25 hover:border-amber-500/50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
              aria-label={`Data is stale. Last updated ${label}. Click to refresh.`}
            >
              <Clock className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Last updated:</span>
              <span>{label}</span>
              {onRefresh && (
                <RefreshCw
                  className={cn("size-3.5 ml-0.5", isRefreshing && "animate-spin")}
                  aria-hidden="true"
                />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Data may be outdated. Click to refresh.</p>
          </TooltipContent>
        </Tooltip>

        {/* Offline indicator - non-blocking toast-like message */}
        {isOffline && (
          <div
            role="alert"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
              "text-xs font-medium",
              "bg-slate-500/15 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400",
              "border border-slate-500/30",
              "animate-in fade-in slide-in-from-left-2 duration-300",
            )}
          >
            <WifiOff className="size-3.5" aria-hidden="true" />
            <span>You are offline</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
