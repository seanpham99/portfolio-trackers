import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MetricInfoCard } from "./metric-info-card";
import { MetricKeys } from "../constants/metric-definitions";

describe("MetricInfoCard", () => {
  describe("rendering", () => {
    it("should render an info button for a valid metric key", () => {
      render(<MetricInfoCard metricKey={MetricKeys.NET_WORTH} />);

      const button = screen.getByRole("button", {
        name: /view calculation details for net worth/i,
      });
      expect(button).toBeInTheDocument();
    });

    it("should render nothing for an invalid metric key", () => {
      // @ts-expect-error - testing runtime behavior with invalid key
      const { container } = render(<MetricInfoCard metricKey="INVALID_KEY" />);
      expect(container).toBeEmptyDOMElement();
    });

    it("should apply custom className when provided", () => {
      render(<MetricInfoCard metricKey={MetricKeys.NET_WORTH} className="custom-class" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
    });
  });

  describe("icon sizes", () => {
    it("should render small icon by default", () => {
      render(<MetricInfoCard metricKey={MetricKeys.NET_WORTH} />);

      const icon = screen.getByRole("button").querySelector("svg");
      expect(icon).toHaveClass("h-3.5", "w-3.5");
    });

    it("should render medium icon when iconSize is md", () => {
      render(<MetricInfoCard metricKey={MetricKeys.NET_WORTH} iconSize="md" />);

      const icon = screen.getByRole("button").querySelector("svg");
      expect(icon).toHaveClass("h-4", "w-4");
    });
  });

  describe("accessibility", () => {
    it("should have proper aria-label for screen readers", () => {
      render(<MetricInfoCard metricKey={MetricKeys.COST_BASIS} />);

      const button = screen.getByRole("button", {
        name: /view calculation details for cost basis/i,
      });
      expect(button).toBeInTheDocument();
    });

    it("should mark the icon as aria-hidden", () => {
      render(<MetricInfoCard metricKey={MetricKeys.NET_WORTH} />);

      const icon = screen.getByRole("button").querySelector("svg");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("should be focusable via keyboard", async () => {
      const user = userEvent.setup();
      render(<MetricInfoCard metricKey={MetricKeys.NET_WORTH} />);

      const button = screen.getByRole("button");

      await user.tab();
      expect(button).toHaveFocus();
    });
  });

  describe("hover card content", () => {
    it("should display formula, source, and methodology on hover", async () => {
      const user = userEvent.setup();
      render(<MetricInfoCard metricKey={MetricKeys.COST_BASIS} />);

      const trigger = screen.getByRole("button");
      await user.hover(trigger);

      // Wait for hover card to appear
      await screen.findByText("Formula");
      expect(screen.getByText("Data Source")).toBeInTheDocument();
      expect(screen.getByText("Methodology")).toBeInTheDocument();

      // Check formula content
      expect(screen.getAllByText(/cost basis/i)[0]).toBeInTheDocument();
      expect(screen.getByText(/fifo/i)).toBeInTheDocument();
    });

    it("should not display methodology section when not applicable", async () => {
      const user = userEvent.setup();
      render(<MetricInfoCard metricKey={MetricKeys.DAILY_CHANGE} />);

      const trigger = screen.getByRole("button");
      await user.hover(trigger);

      // Wait for hover card to appear
      await screen.findByText("Formula");
      expect(screen.getByText("Data Source")).toBeInTheDocument();

      // Methodology should not be shown for DAILY_CHANGE
      expect(screen.queryByText("Methodology")).not.toBeInTheDocument();
    });
  });
});
