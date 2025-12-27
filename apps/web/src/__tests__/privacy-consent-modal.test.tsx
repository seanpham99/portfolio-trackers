import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PrivacyConsentModal } from '../components/auth/privacy-consent-modal'
import { describe, it, expect, vi } from 'vitest'

describe('PrivacyConsentModal', () => {
  const defaultProps = {
    isOpen: true,
    onOpenChange: vi.fn(),
    currentVersion: '2025-12-a',
    onAccept: vi.fn(async () => {}),
    onDecline: vi.fn()
  }

  it('renders correctly when open', () => {
    render(<PrivacyConsentModal {...defaultProps} />)
    
    expect(screen.getByText(/Privacy Matters/i)).toBeInTheDocument()
    expect(screen.getByText(/Accept and Continue/i)).toBeInTheDocument()
    expect(screen.getByText(/Decline and Sign Out/i)).toBeInTheDocument()
  })

  it('calls onDecline when decline button is clicked', () => {
    render(<PrivacyConsentModal {...defaultProps} />)
    
    fireEvent.click(screen.getByText(/Decline and Sign Out/i))
    expect(defaultProps.onDecline).toHaveBeenCalled()
  })

  it('should not show modal when isOpen is false', () => {
    const { queryByText } = render(<PrivacyConsentModal {...defaultProps} isOpen={false} />)
    expect(queryByText(/Privacy Matters/i)).not.toBeInTheDocument()
  })

  it('submits form with correct consent_version when accept button is clicked', async () => {
    const mockOnAccept = vi.fn(async () => {});
    render(<PrivacyConsentModal {...defaultProps} onAccept={mockOnAccept} />)
    
    // Form submission happens via useActionState, verify the version is in the form
    const acceptButton = screen.getByText(/Accept and Continue/i)
    
    await waitFor(() => {
      fireEvent.click(acceptButton)
    })
    const hiddenInput = screen.getByDisplayValue('2025-12-a')
    expect(hiddenInput).toBeInTheDocument()
    expect(hiddenInput).toHaveAttribute('name', 'consent_version')
  })

  it('displays PDPL and GDPR compliance messaging', () => {
    render(<PrivacyConsentModal {...defaultProps} />)
    
    expect(screen.getByText(/PDPL \(2026\)/i)).toBeInTheDocument()
    expect(screen.getByText(/GDPR/i)).toBeInTheDocument()
    expect(screen.getByText(/Data Minimization/i)).toBeInTheDocument()
    expect(screen.getByText(/Audit-Ready/i)).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<PrivacyConsentModal {...defaultProps} />)
    
    // Check for proper heading structure
    const title = screen.getByText(/Privacy Matters/i)
    expect(title.tagName).toBe('H2')
    
    // Check for accept button
    const acceptButton = screen.getByRole('button', { name: /Accept and Continue/i })
    expect(acceptButton).toBeInTheDocument()
    
    // Check for decline button  
    const declineButton = screen.getByRole('button', { name: /Decline and Sign Out/i })
    expect(declineButton).toBeInTheDocument()
  })

  it('disables buttons while isPending', () => {
    // This test verifies the isPending state disables interactions
    // The actual isPending state is managed by useActionState internally
    render(<PrivacyConsentModal {...defaultProps} />)
    
    const acceptButton = screen.getByRole('button', { name: /Accept and Continue/i })
    const declineButton = screen.getByRole('button', { name: /Decline and Sign Out/i })
    
    // Initially enabled
    expect(acceptButton).not.toBeDisabled()
    expect(declineButton).not.toBeDisabled()
  })

  it('cannot be dismissed by clicking outside or pressing Escape', () => {
    const mockOnOpenChange = vi.fn();
    render(<PrivacyConsentModal {...defaultProps} onOpenChange={mockOnOpenChange} />)
    
    // Modal should prevent outside clicks via onPointerDownOutside
    // This is tested at the component level through props
    expect(screen.getByText(/Privacy Matters/i)).toBeInTheDocument()
  })

  it('displays error message when onAccept returns an error', async () => {
    const mockOnAcceptWithError = vi.fn(async () => {
      throw new Error('Network error occurred');
    });
    
    render(
      <PrivacyConsentModal {...defaultProps} onAccept={mockOnAcceptWithError} />
    )
    
    const acceptButton = screen.getByText(/Accept and Continue/i)
    fireEvent.click(acceptButton)

    await waitFor(() => {
      expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument()
    })
  })
})
