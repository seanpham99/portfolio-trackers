import { render, screen, fireEvent } from "@testing-library/react";
import { ConnectionCard } from "./connection-card";
import { ConnectionDto, ConnectionStatus, ExchangeId } from "@workspace/shared-types/api";
import { describe, it, expect, vi } from "vitest";

// Mock hooks
const mockDeleteMutate = vi.fn();
const mockSyncMutate = vi.fn();

vi.mock("../hooks/use-connections", () => ({
  useDeleteConnection: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
  }),
  useSyncConnection: () => ({
    mutate: mockSyncMutate,
    isPending: false,
  }),
}));

// Mock staleness hook
vi.mock("@/hooks/use-staleness", () => ({
  useStaleness: () => ({
    isStale: false,
    label: "2 minutes ago",
  }),
}));

describe("ConnectionCard", () => {
  const mockConnection: ConnectionDto = {
    id: "123",
    exchange: ExchangeId.binance,
    apiKeyMasked: "key***123",
    status: ConnectionStatus.active,
    lastSyncedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  it("renders connection details", () => {
    render(<ConnectionCard connection={mockConnection} />);
    expect(screen.getByText("Binance")).toBeDefined();
    expect(screen.getByText("key***123")).toBeDefined();
    expect(screen.getByText("active")).toBeDefined();
    expect(screen.getByText("Synced 2 minutes ago")).toBeDefined();
  });

  it("calls sync mutation when Sync Now is clicked", () => {
    render(<ConnectionCard connection={mockConnection} />);

    const syncBtn = screen.getByText("Sync Now");
    fireEvent.click(syncBtn);

    expect(mockSyncMutate).toHaveBeenCalledWith("123", expect.any(Object));
  });

  it("shows delete confirmation dialog and calls delete on confirm", async () => {
    render(<ConnectionCard connection={mockConnection} />);

    // Click remove on card
    const removeBtn = screen.getByRole("button", { name: /Remove/i });
    fireEvent.click(removeBtn);

    // Check dialog appears
    expect(screen.getByText("Remove Connection?")).toBeDefined();

    // Find confirmation button
    const buttons = screen.getAllByText("Remove");
    const confirmBtn = buttons[buttons.length - 1]; // The one in the dialog (rendered last)

    if (!confirmBtn) {
      throw new Error("Confirm button not found");
    }

    fireEvent.click(confirmBtn);

    expect(mockDeleteMutate).toHaveBeenCalledWith("123", expect.any(Object));
  });

  it("shows stale badge when data is older than 5 minutes", () => {
    // Mock staleness hook to return stale
    vi.mock("@/hooks/use-staleness", () => ({
      useStaleness: () => ({
        isStale: true,
        label: "15 minutes ago",
      }),
    }));

    const staleConnection: ConnectionDto = {
      ...mockConnection,
      lastSyncedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min ago
    };

    render(<ConnectionCard connection={staleConnection} />);

    // Check for stale badge
    expect(screen.getByText("Stale")).toBeDefined();
    // Check for amber warning styling
    expect(screen.getByText("Synced 15 minutes ago")).toBeDefined();
  });
});
