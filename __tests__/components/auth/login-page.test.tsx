import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LoginPage from '@/app/(auth)/login/page'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth.store'
import { simpleServer } from '@/__mocks__/simple-server'

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Auth Module — Login Page', () => {
  const mockRouter = { push: jest.fn() }
  
  beforeAll(() => simpleServer.listen())
  afterEach(() => {
    simpleServer.resetHandlers()
    jest.clearAllMocks()
    const { act } = require('@testing-library/react')
    act(() => {
      useAuthStore.getState().clearSession()
    })
  })
  afterAll(() => simpleServer.close())

  beforeEach(() => {
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  it('renders correctly with all fields', () => {
    render(<LoginPage />, { wrapper: createWrapper() })
    
    expect(screen.getByLabelText(/Correo Electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument()
  })

  it('successfully logs in and redirects on valid credentials', async () => {
    // Setup mock server for success
    simpleServer.use('/auth/login', async () => ({
      status: 200,
      data: {
        success: true,
        data: {
          access_token: 'valid-token',
          refresh_token: 'refresh-token',
          user: { email: 'test@deviaty.com', role: { name: 'Admin', is_superadmin: true } }
        }
      }
    }))

    render(<LoginPage />, { wrapper: createWrapper() })
    
    fireEvent.change(screen.getByPlaceholderText(/ejemplo@clínica.com/i), { target: { value: 'test@deviaty.com' } })
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'password123' } })
    
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows error toast on invalid credentials', async () => {
    // Setup mock server for error
    simpleServer.use('/auth/login', async () => ({
      status: 401,
      data: { success: false, error: { code: 'UNAUTHORIZED', message: 'Credenciales inválidas' } }
    }))

    render(<LoginPage />, { wrapper: createWrapper() })
    
    fireEvent.change(screen.getByPlaceholderText(/ejemplo@clínica.com/i), { target: { value: 'wrong@deviaty.com' } })
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'wrong' } })
    
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      // Check if button is enabled again (loading finished)
      expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).not.toBeDisabled()
    })
  })
})
