import { screen, fireEvent, waitFor } from "@testing-library/react";
import { render } from "@test/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AssetAutocomplete } from "../asset-autocomplete";

// Mock the API module
vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

// Mock the debounce hook
vi.mock("@/hooks/use-debounce", () => ({
  useDebounce: (value: string) => value,
}));

import { apiFetch } from "@/lib/api";

const mockAssets = [
  {
    id: "1",
    symbol: "AAPL",
    name_en: "Apple Inc.",
    name_local: null,
    asset_class: "equity",
    market: "NASDAQ",
    logo_url: null,
    currency: "USD",
  },
  {
    id: "2",
    symbol: "BTC",
    name_en: "Bitcoin",
    name_local: null,
    asset_class: "crypto",
    market: "CRYPTO",
    logo_url: null,
    currency: "USD",
  },
];

describe("AssetAutocomplete", () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (apiFetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockAssets,
    });
  });

  it("renders with placeholder text", () => {
    render(<AssetAutocomplete onSelect={mockOnSelect} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Select asset...");
  });

  it("displays search input when opened", async () => {
    render(<AssetAutocomplete onSelect={mockOnSelect} />);

    fireEvent.click(screen.getByRole("combobox"));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search assets/i)).toBeInTheDocument();
    });
  });

  it("fetches assets when typing", async () => {
    render(<AssetAutocomplete onSelect={mockOnSelect} />);

    fireEvent.click(screen.getByRole("combobox"));
    const input = await screen.findByPlaceholderText(/search assets/i);

    fireEvent.change(input, { target: { value: "AAPL" } });

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith("/assets/search?q=AAPL");
    });
  });

  it("displays assets from search results", async () => {
    render(<AssetAutocomplete onSelect={mockOnSelect} />);

    fireEvent.click(screen.getByRole("combobox"));
    const input = await screen.findByPlaceholderText(/search assets/i);

    fireEvent.change(input, { target: { value: "A" } });

    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeInTheDocument();
      expect(screen.getByText("Apple Inc.")).toBeInTheDocument();
    });
  });

  it("calls onSelect when an asset is selected", async () => {
    render(<AssetAutocomplete onSelect={mockOnSelect} />);

    fireEvent.click(screen.getByRole("combobox"));
    const input = await screen.findByPlaceholderText(/search assets/i);

    fireEvent.change(input, { target: { value: "AAPL" } });

    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("AAPL"));

    expect(mockOnSelect).toHaveBeenCalledWith(mockAssets[0]);
  });

  it("displays error message on auth failure", async () => {
    (apiFetch as any).mockResolvedValue({
      ok: false,
      status: 401,
    });

    render(<AssetAutocomplete onSelect={mockOnSelect} />);

    fireEvent.click(screen.getByRole("combobox"));
    const input = await screen.findByPlaceholderText(/search assets/i);

    fireEvent.change(input, { target: { value: "test" } });

    await waitFor(() => {
      expect(screen.getByText(/please sign in/i)).toBeInTheDocument();
    });
  });

  it("displays no results message when empty", async () => {
    (apiFetch as any).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    render(<AssetAutocomplete onSelect={mockOnSelect} />);

    fireEvent.click(screen.getByRole("combobox"));
    const input = await screen.findByPlaceholderText(/search assets/i);

    fireEvent.change(input, { target: { value: "xyz" } });

    await waitFor(() => {
      expect(screen.getByText(/no assets found/i)).toBeInTheDocument();
    });
  });
});
