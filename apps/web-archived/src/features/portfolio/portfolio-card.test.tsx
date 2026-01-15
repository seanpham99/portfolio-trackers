import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { PortfolioCard } from "./portfolio-card";
import { PortfolioSummaryDto } from "@workspace/api-types";

describe("PortfolioCard", () => {
  const mockPortfolio: PortfolioSummaryDto = {
    id: "123",
    name: "Growth Fund",
    base_currency: "USD",
    netWorth: 15000,
    change24h: 500,
    change24hPercent: 3.45,
    user_id: "u1",
    created_at: "",
    updated_at: "",
    description: null,
    allocation: [],
  };

  it("renders portfolio details correctly", () => {
    render(
      <MemoryRouter>
        <PortfolioCard portfolio={mockPortfolio} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Growth Fund")).toBeInTheDocument();
    // Check formatting - USD 15,000.00 might adapt based on locale/impl
    expect(screen.getByText(/\$15,000/)).toBeInTheDocument();
    expect(screen.getByText(/\+3.45%/)).toBeInTheDocument();
  });

  it("navigates to detail page on click", () => {
    render(
      <MemoryRouter>
        <PortfolioCard portfolio={mockPortfolio} />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/portfolio/123");
  });

  it("renders loading skeleton", () => {
    render(<PortfolioCard.Skeleton />);
    // Just check if it renders without crashing and has some skeleton elements
    // Using class check or simply pass check
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });
});
