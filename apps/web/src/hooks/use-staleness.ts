import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";

/** Staleness threshold in milliseconds (5 minutes per Story 4.4) */
const STALENESS_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Return value from useStaleness hook
 */
export interface StalenessInfo {
  /** Whether the data is considered stale (older than 5 minutes) */
  isStale: boolean;
  /** Age of the data in minutes */
  minutesOld: number;
  /** Human-readable relative time label (e.g., "5 minutes ago") */
  label: string;
  /** Original timestamp as Date object */
  timestamp: Date;
}

/**
 * Hook to calculate staleness information from a timestamp
 * Implements Story 4.4 - Data Source Reliability & Staleness Controls
 *
 * @param timestamp - ISO 8601 timestamp string or Date indicating when data was last fetched
 * @returns StalenessInfo object with staleness status and formatted display values
 *
 * @example
 * ```tsx
 * const { isStale, label } = useStaleness(meta.staleness);
 * if (isStale) {
 *   return <StalenessBadge label={label} />;
 * }
 * ```
 */
export function useStaleness(timestamp: string | Date | undefined): StalenessInfo {
  return useMemo(() => {
    if (!timestamp) {
      return {
        isStale: true,
        minutesOld: Infinity,
        label: "Unknown",
        timestamp: new Date(0),
      };
    }

    const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const ageMs = now - date.getTime();
    const minutesOld = Math.floor(ageMs / 60000);

    const isStale = ageMs > STALENESS_THRESHOLD_MS;
    const label = formatDistanceToNow(date, { addSuffix: true });

    return {
      isStale,
      minutesOld,
      label,
      timestamp: date,
    };
  }, [timestamp]);
}
