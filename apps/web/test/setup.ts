import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import React from 'react'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Global Mocks for CI/Unit Tests

// Mock React Router
vi.mock('react-router', () => ({
  useFetcher: () => ({
    Form: ({ children, ...props }: any) => React.createElement('form', props, children),
    state: 'idle',
    data: null,
    submit: vi.fn(),
  }),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ children, to, ...props }: any) => React.createElement('a', { href: to, ...props }, children),
  redirect: vi.fn(),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
  useSubmit: () => vi.fn(),
  useNavigation: () => ({ state: 'idle' }),
  Outlet: () => null,
}))

// Mock Framer Motion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion')
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }: any) => React.createElement('div', props, children),
      span: ({ children, ...props }: any) => React.createElement('span', props, children),
      section: ({ children, ...props }: any) => React.createElement('section', props, children),
    },
    useReducedMotion: () => false,
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, {}, children),
  }
})

// Mock react-hook-form
vi.mock('react-hook-form', () => ({
  useForm: () => ({
    control: {},
    handleSubmit: (fn: any) => fn,
    register: vi.fn(),
    reset: vi.fn(),
    watch: () => '',
    formState: { errors: {}, isSubmitting: false },
    setError: vi.fn(),
    clearErrors: vi.fn(),
  }),
  Controller: ({ render }: any) => render({ 
    field: { value: '', onChange: vi.fn(), onBlur: vi.fn(), ref: null }, 
    fieldState: { invalid: false, error: null } 
  }),
  useFormContext: () => ({
    control: {},
  }),
}))

