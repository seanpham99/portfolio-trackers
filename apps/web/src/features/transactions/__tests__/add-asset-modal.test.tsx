import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@test/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AddAssetModal } from "../add-asset-modal";
import { DiscoverableAssetClass, Assets } from "@workspace/shared-types/database";

// --- Mocks ---

// Mock hooks
const mockUseSearchAssets = vi.fn();
const mockUsePopularAssets = vi.fn();
const mockUseDiscoverAssets = vi.fn();
const mockUseAddTransaction = vi.fn();
const mockUseSubmitAssetRequest = vi.fn();
const mockAddMutateAsync = vi.fn();
const mockSubmitMutateAsync = vi.fn();

vi.mock("@/features/portfolio/hooks/use-portfolios", () => ({
  useSearchAssets: (query: string) => mockUseSearchAssets(query),
  useAddTransaction: () => ({
    mutateAsync: mockAddMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/api/hooks/use-popular-assets", () => ({
  usePopularAssets: () => mockUsePopularAssets(),
}));

vi.mock("@/features/portfolio/hooks/use-discovery", () => ({
  useDiscoverAssets: (query: string, assetClass: any) => mockUseDiscoverAssets(query, assetClass),
  useSubmitAssetRequest: () => ({
    mutateAsync: mockSubmitMutateAsync,
    isPending: false,
  }),
}));

// Mock Assets
const mockPopularAssets = [
  { id: "1", symbol: "AAPL", name_en: "Apple Inc.", asset_class: "STOCK", logo_url: "url" },
  { id: "2", symbol: "BTC", name_en: "Bitcoin", asset_class: "CRYPTO", logo_url: "url" },
] as any[];

const mockSearchResults = [
  { id: "3", symbol: "TSLA", name_en: "Tesla Inc.", asset_class: "STOCK" },
] as Assets[];

const mockExternalResults = [
  {
    id: "ext-1",
    symbol: "NEW",
    name_en: "New Stock",
    asset_class: "STOCK",
    market: "US",
    source: "yahoo",
  },
];

describe("AddAssetModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    stageId: "add-asset",
    portfolioId: "p1",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Polyfill ResizeObserver
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );

    // Default hook implementations
    mockUseSearchAssets.mockReturnValue({ data: [], isLoading: false });
    mockUsePopularAssets.mockReturnValue({ data: mockPopularAssets, isLoading: false });
    mockUseDiscoverAssets.mockReturnValue({ data: [], isLoading: false });
  });

  // State: SEARCH (Default)
  it("renders popular assets initially", () => {
    render(<AddAssetModal {...defaultProps} />);

    expect(screen.getByPlaceholderText(/search symbol/i)).toBeInTheDocument();
    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("BTC")).toBeInTheDocument();
  });

  it("renders search results when searching internal registry", () => {
    mockUseSearchAssets.mockImplementation((query) => {
      if (query === "TSLA") return { data: mockSearchResults, isLoading: false };
      return { data: [], isLoading: false };
    });

    render(<AddAssetModal {...defaultProps} />);

    const input = screen.getByPlaceholderText(/search symbol/i);
    fireEvent.change(input, { target: { value: "TSLA" } });

    expect(screen.getByText("TSLA")).toBeInTheDocument();
    expect(screen.getByText("Tesla Inc.")).toBeInTheDocument();
  });

  // State: NO_RESULTS_PICKER (Zero-result pivot)
  it("shows fallback UI when internal search yields no results", () => {
    mockUseSearchAssets.mockReturnValue({ data: [], isLoading: false }); // Empty results

    render(<AddAssetModal {...defaultProps} />);

    const input = screen.getByPlaceholderText(/search symbol/i);
    fireEvent.change(input, { target: { value: "UNKNOWN" } });

    // New Text: "No results found"
    expect(screen.getByText(/No results found/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Search External Providers/i })).toBeInTheDocument();
  });

  // State: EXTERNAL_SEARCH -> EXTERNAL_RESULTS
  it("transitions to external search and shows external results", async () => {
    // 1. Initial State: Empty internal results
    mockUseSearchAssets.mockReturnValue({ data: [], isLoading: false });

    render(<AddAssetModal {...defaultProps} />);
    const input = screen.getByPlaceholderText(/search symbol/i);
    fireEvent.change(input, { target: { value: "NEW" } });

    // 2. Click "Search External Providers"
    fireEvent.click(screen.getByRole("button", { name: /Search External Providers/i }));

    // 3. Verify Asset Type Picker appears
    expect(screen.getByText(/What type of asset is/i)).toBeInTheDocument();
    expect(screen.getByText("US Stock")).toBeInTheDocument();

    // 4. Select Asset Type (simulates external fetch success)
    mockUseDiscoverAssets.mockReturnValue({ data: mockExternalResults, isLoading: false });

    fireEvent.click(screen.getByText("US Stock"));

    // 5. Verify External Results displayed
    await waitFor(() => {
      expect(screen.getByText("External Results")).toBeInTheDocument();
      expect(screen.getByText("New Stock")).toBeInTheDocument();
    });
  });

  // State: EXTERNAL_RESULTS -> CONFIRMATION -> ASSET_FORM -> ADD
  it("selects an external asset, confirms it, and adds it to portfolio", async () => {
    const user = userEvent.setup();

    // Setup state where external results are shown
    mockUseSearchAssets.mockReturnValue({ data: [], isLoading: false });
    mockUseDiscoverAssets.mockReturnValue({ data: mockExternalResults, isLoading: false });

    render(<AddAssetModal {...defaultProps} />);

    // Skip to external results state (simulated by inputs)
    const input = screen.getByPlaceholderText(/search symbol/i);
    await user.type(input, "NEW");
    await user.click(screen.getByRole("button", { name: /Search External Providers/i }));
    await user.click(screen.getByText("US Stock"));

    // Select asset
    await waitFor(() => expect(screen.getByText("NEW")).toBeInTheDocument());
    await user.click(screen.getByText("NEW"));

    // Verify Confirmation Step [NEW]
    await waitFor(() => {
      expect(screen.getByText("Is this the asset you want to add?")).toBeInTheDocument();
      expect(screen.getByText("New Stock")).toBeInTheDocument();
    });

    // Click Confirm
    await user.click(screen.getByRole("button", { name: /Yes, Continue/i }));

    // Verify Form
    await waitFor(() => expect(screen.getByText("Add Transaction")).toBeInTheDocument());
    expect(screen.getByLabelText(/Quantity/i)).toBeInTheDocument();

    // Fill Form
    const qtyInput = screen.getByLabelText(/Quantity/i);
    const priceInput = screen.getByLabelText(/Price/i); // Matches "Price (USD)"

    await user.clear(qtyInput);
    await user.type(qtyInput, "10");
    await user.clear(priceInput);
    await user.type(priceInput, "100");

    // Submit
    const submitBtn = screen.getByRole("button", { name: /Add to Portfolio/i });
    expect(submitBtn).toBeEnabled();
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockAddMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "BUY",
          quantity: 10,
          price: 100,
        })
      );
    });
  });

  // State: EXTERNAL_RESULTS -> QUEUE_SUBMIT (Request Tracking)
  it("handles request tracking when external search is also empty", async () => {
    // Setup: Internal empty, External empty
    mockUseSearchAssets.mockReturnValue({ data: [], isLoading: false });
    mockUseDiscoverAssets.mockReturnValue({ data: [], isLoading: false, isError: false }); // Empty external

    render(<AddAssetModal {...defaultProps} />);

    // Navigate to external search
    const input = screen.getByPlaceholderText(/search symbol/i);
    fireEvent.change(input, { target: { value: "OBSCURE" } });
    fireEvent.click(screen.getByRole("button", { name: /Search External Providers/i }));
    fireEvent.click(screen.getByText("US Stock"));

    // Expected: "No external results found"
    await waitFor(() => {
      expect(screen.getByText(/No external results found/i)).toBeInTheDocument();
    });

    // Click "Request Tracking"
    fireEvent.click(screen.getByRole("button", { name: /Request Tracking/i }));

    // Verify mutation
    await waitFor(() => {
      expect(mockSubmitMutateAsync).toHaveBeenCalledWith({
        symbol: "OBSCURE",
        assetClass: DiscoverableAssetClass.US_STOCK,
      });
      expect(screen.getByText(/Request Submitted!/i)).toBeInTheDocument();
    });
  });

  // State: CONFIRMATION -> NO_RESULTS_PICKER (Pre-fill logic)
  it("pre-fills search query when clicking 'Cant Find' from confirmation screen", async () => {
    // Setup: Internal search returns result
    mockUseSearchAssets.mockReturnValue({ data: mockSearchResults, isLoading: false });

    render(<AddAssetModal {...defaultProps} />);

    // Search and select asset
    const input = screen.getByPlaceholderText(/search symbol/i);
    fireEvent.change(input, { target: { value: "TSLA" } });
    fireEvent.click(screen.getByText("TSLA"));

    // Verify Confirmation
    await waitFor(() => {
      expect(screen.getByText("Is this the asset you want to add?")).toBeInTheDocument();
    });

    // Click "Can't find your asset? Search external."
    fireEvent.click(screen.getByText(/Can't find your asset\? Search external/i));

    // Verify Picker state with pre-filled query
    await waitFor(() => {
      expect(screen.getByText(/What type of asset is/i)).toBeInTheDocument();
      expect(screen.getByText("TSLA")).toBeInTheDocument(); // Should show the symbol
    });
  });
});
