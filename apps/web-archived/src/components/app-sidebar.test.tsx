import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { BrowserRouter } from "react-router";
import { SidebarProvider } from "@repo/ui/components/sidebar";
import { AppSidebar } from "./app-sidebar";
import type { User } from "@supabase/supabase-js";

// Mock window.matchMedia for mobile detection
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Mock user data
const mockUser: User = {
  id: "123",
  email: "test@example.com",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "2024-01-01T00:00:00Z",
} as User;

// Wrapper with BrowserRouter and SidebarProvider for testing
function renderWithProviders(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      <SidebarProvider>{ui}</SidebarProvider>
    </BrowserRouter>,
  );
}

describe("AppSidebar", () => {
  it("renders all navigation menu items", () => {
    renderWithProviders(<AppSidebar user={mockUser} />);

    expect(screen.getByRole("link", { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /history/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /analytics/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /settings/i })).toBeInTheDocument();
  });

  it("displays app branding in header", () => {
    renderWithProviders(<AppSidebar user={mockUser} />);

    expect(screen.getByText("FinSight")).toBeInTheDocument();
  });

  it("displays user email in footer", () => {
    renderWithProviders(<AppSidebar user={mockUser} />);

    expect(screen.getByText(mockUser.email!)).toBeInTheDocument();
  });

  it("displays user avatar with first letter of email", () => {
    renderWithProviders(<AppSidebar user={mockUser} />);

    // Avatar fallback should show "T" (first letter of test@example.com)
    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("opens user dropdown menu on click", async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn();
    renderWithProviders(<AppSidebar user={mockUser} onSignOut={onSignOut} />);

    // Click on user menu button
    const userMenuButton = screen.getByRole("button", {
      name: new RegExp(mockUser.email!, "i"),
    });
    await user.click(userMenuButton);

    // Dropdown menu items should appear
    expect(
      screen.getByRole("menuitem", { name: /profile/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /sign out/i }),
    ).toBeInTheDocument();
  });

  it("calls onSignOut when sign out is clicked", async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn();
    renderWithProviders(<AppSidebar user={mockUser} onSignOut={onSignOut} />);

    // Open dropdown
    const userMenuButton = screen.getByRole("button", {
      name: new RegExp(mockUser.email!, "i"),
    });
    await user.click(userMenuButton);

    // Click Sign Out
    const signOutItem = screen.getByRole("menuitem", { name: /sign out/i });
    await user.click(signOutItem);

    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it("renders with proper semantic structure", () => {
    const { container } = renderWithProviders(<AppSidebar user={mockUser} />);

    // shadcn Sidebar should have proper ARIA attributes
    const sidebar = container.querySelector('[data-slot="sidebar"]');
    expect(sidebar).toBeInTheDocument();
  });
});
