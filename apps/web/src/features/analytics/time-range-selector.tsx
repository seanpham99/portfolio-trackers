import type { TimeRange } from "./analytics.types";
import { Button } from "@repo/ui/components/button";

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "1M", label: "1M" },
  { value: "3M", label: "3M" },
  { value: "6M", label: "6M" },
  { value: "1Y", label: "1Y" },
  { value: "ALL", label: "ALL" },
];

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div
      className="inline-flex rounded-lg border border-border bg-surface-elevated p-1"
      role="group"
      aria-label="Time range selector"
    >
      {TIME_RANGES.map((range) => (
        <Button
          key={range.value}
          variant={value === range.value ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange(range.value)}
          className={
            value === range.value
              ? "bg-emerald-600 hover:bg-emerald-500 text-white"
              : "text-muted-foreground hover:text-foreground hover:bg-overlay-medium"
          }
          aria-pressed={value === range.value}
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
}
