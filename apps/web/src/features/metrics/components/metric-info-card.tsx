"use client";

import { Info } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@workspace/ui/components/hover-card";
import { type MetricKey, getMetricDefinition } from "../constants/metric-definitions";

export interface MetricInfoCardProps {
  /** The metric key to display information for */
  metricKey: MetricKey;
  /** Optional custom class for the trigger button */
  className?: string;
  /** Optional size for the info icon */
  iconSize?: "sm" | "md";
}

/**
 * MetricInfoCard displays calculation methodology and data source information
 * for portfolio metrics via an accessible HoverCard.
 *
 * @example
 * ```tsx
 * <MetricInfoCard metricKey="NET_WORTH" />
 * ```
 *
 * @see FR3: Transparent Calculations - Drill-down with visible formulas
 */
export function MetricInfoCard({
  metricKey,
  className = "",
  iconSize = "sm",
}: MetricInfoCardProps) {
  const definition = getMetricDefinition(metricKey);

  if (!definition) {
    return null;
  }

  const iconClasses = iconSize === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center justify-center rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${className}`}
          aria-label={`View calculation details for ${definition.label}`}
        >
          <Info className={iconClasses} aria-hidden="true" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" align="start" sideOffset={8}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Info className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">{definition.label}</h4>
          </div>

          {/* Formula */}
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Formula
            </p>
            <p className="rounded-md bg-muted/50 px-3 py-2 font-mono text-xs text-foreground">
              {definition.formula}
            </p>
          </div>

          {/* Data Source */}
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Data Source
            </p>
            <p className="text-xs text-muted-foreground">{definition.source}</p>
          </div>

          {/* Methodology (if applicable) */}
          {definition.methodology && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Methodology
              </p>
              <p className="text-xs text-muted-foreground">{definition.methodology}</p>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
