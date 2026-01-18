import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useStaleness } from "./use-staleness";

describe("useStaleness", () => {
  beforeEach(() => {
    // Mock Date.now() to return a fixed timestamp for predictable testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-18T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return stale=false for fresh data (less than 5 minutes old)", () => {
    // 2 minutes ago
    const timestamp = new Date("2026-01-18T09:58:00.000Z").toISOString();
    const { result } = renderHook(() => useStaleness(timestamp));

    expect(result.current.isStale).toBe(false);
    expect(result.current.minutesOld).toBe(2);
  });

  it("should return stale=true for data older than 5 minutes", () => {
    // 10 minutes ago
    const timestamp = new Date("2026-01-18T09:50:00.000Z").toISOString();
    const { result } = renderHook(() => useStaleness(timestamp));

    expect(result.current.isStale).toBe(true);
    expect(result.current.minutesOld).toBe(10);
  });

  it("should return stale=true for exactly 5 minutes (boundary)", () => {
    // Exactly 5 minutes and 1ms ago (just over threshold)
    const timestamp = new Date("2026-01-18T09:54:59.999Z").toISOString();
    const { result } = renderHook(() => useStaleness(timestamp));

    expect(result.current.isStale).toBe(true);
  });

  it("should return stale=false for exactly 4:59 (under threshold)", () => {
    // Just under 5 minutes
    const timestamp = new Date("2026-01-18T09:55:01.000Z").toISOString();
    const { result } = renderHook(() => useStaleness(timestamp));

    expect(result.current.isStale).toBe(false);
  });

  it("should handle undefined timestamp gracefully", () => {
    const { result } = renderHook(() => useStaleness(undefined));

    expect(result.current.isStale).toBe(true);
    expect(result.current.minutesOld).toBe(Infinity);
    expect(result.current.label).toBe("Unknown");
  });

  it("should handle Date object input", () => {
    const timestamp = new Date("2026-01-18T09:58:00.000Z");
    const { result } = renderHook(() => useStaleness(timestamp));

    expect(result.current.isStale).toBe(false);
    expect(result.current.minutesOld).toBe(2);
  });

  it("should return human-readable label using formatDistanceToNow", () => {
    const timestamp = new Date("2026-01-18T09:55:00.000Z").toISOString();
    const { result } = renderHook(() => useStaleness(timestamp));

    // date-fns formatDistanceToNow returns "5 minutes ago" for 5 minutes
    expect(result.current.label).toMatch(/minutes? ago/);
  });
});
