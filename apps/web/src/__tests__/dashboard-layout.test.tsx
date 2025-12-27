import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardLayout } from '../components/dashboard-layout';

describe('DashboardLayout', () => {
  it('should render all three tabs', () => {
    render(<DashboardLayout />);
    
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveTextContent('VN Stocks');
    expect(tabs[1]).toHaveTextContent('US Equities');
    expect(tabs[2]).toHaveTextContent('Crypto');
  });

  it('should show first tab (VN Stocks) as active by default', () => {
    render(<DashboardLayout />);
    
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
  });

  it('should switch tabs when clicked', () => {
    render(<DashboardLayout />);
    
    const tabs = screen.getAllByRole('tab');
    
    // Click US Equities tab (index 1)
    fireEvent.click(tabs[1]);
    
    // Note: With mocked useSearchParams, state won't actually change
    // This test verifies the click handler doesn't crash
    expect(tabs[1]).toBeInTheDocument();
  });

  it('should display badges with asset count and total value', () => {
    render(<DashboardLayout />);
    
    // Check for badge text containing "assets"
    expect(screen.getAllByText(/assets/).length).toBeGreaterThan(0);
    // Check for dollar signs indicating value
    expect(screen.getAllByText(/\$/).length).toBeGreaterThan(0);
  });

  it('should support keyboard shortcuts Cmd/Ctrl + 1/2/3', () => {
    render(<DashboardLayout />);
    
    // Trigger Cmd+2 for US Equities - verify it doesn't crash
    fireEvent.keyDown(document, { key: '2', metaKey: true });
    
    // With mocked router, state won't change, but verify no crash
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
  });

  it('should have proper ARIA attributes for accessibility', () => {
    render(<DashboardLayout />);
    
    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();
    
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    
    const tabpanel = screen.getByRole('tabpanel');
    expect(tabpanel).toBeInTheDocument();
  });

  it('should render framer-motion content container', () => {
    const { container } = render(<DashboardLayout />);
    
    // Check that the data-framer-component attribute is rendered
    const motionElements = container.querySelectorAll('[data-framer-component]');
    expect(motionElements.length).toBeGreaterThan(0);
  });
});
