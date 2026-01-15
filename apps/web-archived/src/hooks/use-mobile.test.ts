import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "./use-mobile";

describe("useIsMobile", () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;
  let listeners: Array<() => void> = [];

  beforeEach(() => {
    listeners = [];
    matchMediaMock = vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, handler: () => void) => {
        listeners.push(handler);
      }),
      removeEventListener: vi.fn((event: string, handler: () => void) => {
        listeners = listeners.filter((l) => l !== handler);
      }),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: matchMediaMock,
    });
  });

  afterEach(() => {
    listeners = [];
  });

  it("should return false for desktop viewport", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it("should return true for mobile viewport", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it("should update when viewport changes", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const { result, rerender } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    // Simulate viewport resize to mobile
    act(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 500,
      });
      listeners.forEach((listener) => listener());
    });

    rerender();
    expect(result.current).toBe(true);
  });

  it("should clean up event listener on unmount", () => {
    const { unmount } = renderHook(() => useIsMobile());

    expect(listeners.length).toBeGreaterThan(0);

    unmount();

    // After unmount, listeners should be cleaned up
    expect(listeners.length).toBe(0);
  });
});
