import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TimeRangeSelector } from "./time-range-selector";

describe("TimeRangeSelector", () => {
  it("renders all time range options", () => {
    const onChange = vi.fn();
    render(<TimeRangeSelector value="3M" onChange={onChange} />);

    expect(screen.getByRole("tab", { name: "1M" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "3M" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "6M" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "1Y" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "ALL" })).toBeInTheDocument();
  });

  it("marks selected tab as active", () => {
    const onChange = vi.fn();
    render(<TimeRangeSelector value="3M" onChange={onChange} />);

    const selectedTab = screen.getByRole("tab", { name: "3M", selected: true });
    expect(selectedTab).toBeInTheDocument();
  });

  it("calls onChange when a different tab is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeRangeSelector value="3M" onChange={onChange} />);

    const oneMonthTab = screen.getByRole("tab", { name: "1M" });
    await user.click(oneMonthTab);

    expect(onChange).toHaveBeenCalledWith("1M");
  });

  it("supports keyboard navigation with arrow keys", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeRangeSelector value="3M" onChange={onChange} />);

    const threeMonthTab = screen.getByRole("tab", { name: "3M" });
    threeMonthTab.focus();

    // Arrow right should move to next tab
    await user.keyboard("{ArrowRight}");
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "6M" })).toHaveFocus();
    });

    // Arrow left should move to previous tab
    await user.keyboard("{ArrowLeft}");
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "3M" })).toHaveFocus();
    });
  });

  it("maintains theme consistency", () => {
    const onChange = vi.fn();
    const { container } = render(
      <TimeRangeSelector value="3M" onChange={onChange} />,
    );

    // shadcn Tabs should have proper TabsList container
    const tabsList = container.querySelector('[role="tablist"]');
    expect(tabsList).toBeInTheDocument();
  });
});
