import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "@test/test-utils";
import Dashboard from "@/routes/_protected._layout.dashboard";
import { usePortfolios } from "@/features/portfolio/hooks/use-portfolios";

// Mock hooks
vi.mock("@/features/portfolio/hooks/use-portfolios", () => ({
  usePortfolios: vi.fn(),
}));

// Mock Link since PortfolioCard uses it
vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
      <a href={to}>{children}</a>
    ),
  };
});

describe("Dashboard Page", () => {
  it("renders loading skeletons when loading", () => {
    (usePortfolios as any).mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<Dashboard />);
    // Expect some skeleton elements
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders empty state when no portfolios", () => {
    (usePortfolios as any).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<Dashboard />);
    expect(
      screen.getByText(/Create Your First Portfolio/i),
    ).toBeInTheDocument();
  });

  it("renders portfolio cards when data exists", () => {
    (usePortfolios as any).mockReturnValue({
      data: [
        {
          id: "1",
          name: "My Portfolio",
          netWorth: 1000,
          change24h: 0,
          change24hPercent: 0,
          base_currency: "USD",
        },
      ],
      isLoading: false,
    });

    render(<Dashboard />);
    expect(screen.getByText("My Portfolio")).toBeInTheDocument();
  });
});
