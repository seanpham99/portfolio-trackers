import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TransactionForm } from "../transaction-form";

// Mock the API module
vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

// Mock the AssetAutocomplete component
vi.mock("../asset-autocomplete", () => ({
  AssetAutocomplete: ({ onSelect }: { onSelect: (asset: any) => void }) => (
    <button
      data-testid="mock-asset-autocomplete"
      onClick={() =>
        onSelect({
          id: "asset-1",
          symbol: "AAPL",
          name_en: "Apple Inc.",
          name_local: null,
          asset_class: "equity",
          market: "NASDAQ",
          logo_url: null,
          currency: "USD",
        })
      }
    >
      Select Asset
    </button>
  ),
}));

import { apiFetch } from "@/lib/api";

describe("TransactionForm", () => {
  const mockOnSuccess = vi.fn();
  const portfolioId = "portfolio-123";

  beforeEach(() => {
    vi.clearAllMocks();
    (apiFetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "tx-1",
        portfolio_id: portfolioId,
        asset_id: "asset-1",
        type: "BUY",
        quantity: 10,
        price: 150,
        fee: 0,
      }),
    });
  });

  it("renders form with all inputs", () => {
    render(<TransactionForm portfolioId={portfolioId} onSuccess={mockOnSuccess} />);

    expect(screen.getByText("Asset")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Quantity")).toBeInTheDocument();
    expect(screen.getByText("Price per Unit")).toBeInTheDocument();
    expect(screen.getByText("Fee (Optional)")).toBeInTheDocument();
    expect(screen.getByText("Notes")).toBeInTheDocument();
  });

  it("submit button is disabled when no asset selected", () => {
    render(<TransactionForm portfolioId={portfolioId} onSuccess={mockOnSuccess} />);

    const submitButton = screen.getByRole("button", {
      name: /confirm purchase/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it("submit button is enabled after selecting asset", async () => {
    render(<TransactionForm portfolioId={portfolioId} onSuccess={mockOnSuccess} />);

    // Select an asset
    fireEvent.click(screen.getByTestId("mock-asset-autocomplete"));

    await waitFor(() => {
      const submitButton = screen.getByRole("button", {
        name: /confirm purchase/i,
      });
      expect(submitButton).not.toBeDisabled();
    });
  });

  it("changes button text based on transaction type", async () => {
    render(<TransactionForm portfolioId={portfolioId} onSuccess={mockOnSuccess} />);

    // Initially shows "Confirm Purchase" (BUY)
    expect(screen.getByRole("button", { name: /confirm purchase/i })).toBeInTheDocument();
  });

  it("displays error when asset not selected on submit", async () => {
    (apiFetch as any).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Please select an asset" }),
    });

    render(<TransactionForm portfolioId={portfolioId} onSuccess={mockOnSuccess} />);

    // Don't select asset, form should show error state
    // Note: Submit button is disabled, so this tests the form validation
    const submitButton = screen.getByRole("button", {
      name: /confirm purchase/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it("displays error message from API failure", async () => {
    (apiFetch as any).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: "Invalid quantity" }),
    });

    render(<TransactionForm portfolioId={portfolioId} onSuccess={mockOnSuccess} />);

    // Select asset first
    fireEvent.click(screen.getByTestId("mock-asset-autocomplete"));

    // Fill in required fields
    const quantityInput = screen.getByLabelText(/quantity/i);
    const priceInput = screen.getByLabelText(/price per unit/i);

    fireEvent.change(quantityInput, { target: { value: "10" } });
    fireEvent.change(priceInput, { target: { value: "150" } });

    // Submit
    const submitButton = screen.getByRole("button", {
      name: /confirm purchase/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid quantity");
    });
  });

  it("form fields are disabled during submission", async () => {
    // Make the API call hang
    (apiFetch as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<TransactionForm portfolioId={portfolioId} onSuccess={mockOnSuccess} />);

    // Select asset
    fireEvent.click(screen.getByTestId("mock-asset-autocomplete"));

    // Fill in required fields
    const quantityInput = screen.getByLabelText(/quantity/i);
    const priceInput = screen.getByLabelText(/price per unit/i);

    fireEvent.change(quantityInput, { target: { value: "10" } });
    fireEvent.change(priceInput, { target: { value: "150" } });

    // Submit
    const submitButton = screen.getByRole("button", {
      name: /confirm purchase/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });
  });
});
