import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Login from '../routes/_auth.login'

describe('Login Component', () => {

  it('renders login form elements', () => {
    render(<Login />)
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument()
  })

  it('renders Google and Email options', () => {
    render(<Login />)
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
    expect(screen.getByText(/Or continue with email/i)).toBeInTheDocument()
  })
})
