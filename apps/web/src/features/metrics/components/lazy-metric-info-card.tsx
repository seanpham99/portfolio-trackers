"use client";

import { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { MetricInfoCardSkeleton } from "./metric-info-card-skeleton";
import type { MetricInfoCardProps } from "./metric-info-card";

const MetricInfoCardBase = dynamic(
  () => import("./metric-info-card").then((mod) => mod.MetricInfoCard),
  { ssr: false }
);

export function MetricInfoCard(props: MetricInfoCardProps) {
  /*
   * useSyncExternalStore is used here to avoid the "setState in useEffect" warning
   * while safely handling hydration mismatch steps.
   * Server: returns false (getServerSnapshot)
   * Client: returns true (getSnapshot)
   */
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!isMounted) {
    return <MetricInfoCardSkeleton className={props.className} iconSize={props.iconSize} />;
  }

  return <MetricInfoCardBase {...props} />;
}
