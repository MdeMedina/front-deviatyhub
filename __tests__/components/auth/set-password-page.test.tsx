import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SetPasswordPage from '@/app/(auth)/set-password/page'
import { useRouter, useSearchParams } from 'next/navigation'
import { simpleServer } from '@/__mocks__/simple-server'
import { useUIStore } from '@/lib/stores/ui.store'

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Auth Module — Set Password Page', () => {
  const mockRouter = { push: jest.fn() }

  beforeAll(() => simpleServer.listen())
  afterEach(() => {
    simpleServer.resetHandlers()
    jest.clearAllMocks()
    useUIStore.getState().toasts = []
  })
  afterAll(() => simpleServer.close())

  beforeEach(() => {
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('?token=test-valid-token'))
  })

  it('renders the form correctly when a valid token is provided', () => {
    render(<SetPasswordPage />, { wrapper: createWrapper() })

    expect(screen.getByLabelText(/Nueva Contraseña/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Confirmar Contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Guardar Contraseña/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Guardar Contraseña/i })).toBeDisabled()
  })

  it('renders a warning screen if the token is missing from search parameters', () => {
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(''))

    render(<SetPasswordPage />, { wrapper: createWrapper() })

    expect(screen.getByText(/Enlace inválido/i)).toBeInTheDocument()
    expect(screen.getByText(/No se ha proporcionado un token/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Volver a Iniciar Sesión/i })).toBeInTheDocument()
  })

  it('validates password length dynamically and shows inline errors', () => {
    render(<SetPasswordPage />, { wrapper: createWrapper() })

    const passwordInput = screen.getByLabelText(/Nueva Contraseña/i)
    
    // Type less than 8 characters
    fireEvent.change(passwordInput, { target: { value: 'short' } })
    expect(screen.getByText(/La contraseña debe tener al menos 8 caracteres/i)).toBeInTheDocument()

    // Type 8 or more characters
    fireEvent.change(passwordInput, { target: { value: 'securepwd123' } })
    expect(screen.queryByText(/La contraseña debe tener al menos 8 caracteres/i)).not.toBeInTheDocument()
  })

  it('validates password matching dynamically and shows inline errors', () => {
    render(<SetPasswordPage />, { wrapper: createWrapper() })

    const passwordInput = screen.getByLabelText(/Nueva Contraseña/i)
    const confirmInput = screen.getByLabelText(/Confirmar Contraseña/i)

    fireEvent.change(passwordInput, { target: { value: 'securepwd123' } })
    fireEvent.change(confirmInput, { target: { value: 'different123' } })

    expect(screen.getByText(/Las contraseñas no coinciden/i)).toBeInTheDocument()

    fireEvent.change(confirmInput, { target: { value: 'securepwd123' } })
    expect(screen.queryByText(/Las contraseñas no coinciden/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Guardar Contraseña/i })).not.toBeDisabled()
  })

  it('submits the form successfully and displays success feedback', async () => {
    let requestPayload: any = null
    simpleServer.use('/auth/set-password', async (init: any) => {
      requestPayload = JSON.parse(init.body)
      return {
        status: 200,
        data: { success: true, data: { message: 'Success' } }
      }
    })

    render(<SetPasswordPage />, { wrapper: createWrapper() })

    const passwordInput = screen.getByLabelText(/Nueva Contraseña/i)
    const confirmInput = screen.getByLabelText(/Confirmar Contraseña/i)
    const submitButton = screen.getByRole('button', { name: /Guardar Contraseña/i })

    fireEvent.change(passwordInput, { target: { value: 'securepwd123' } })
    fireEvent.change(confirmInput, { target: { value: 'securepwd123' } })
    
    expect(submitButton).not.toBeDisabled()
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(requestPayload).toEqual({
        token: 'test-valid-token',
        password: 'securepwd123',
        password_confirm: 'securepwd123'
      })
      expect(screen.getByText(/¡Todo listo!/i)).toBeInTheDocument()
      expect(screen.getByText(/Tu contraseña se ha establecido con éxito/i)).toBeInTheDocument()
    })
  })

  it('displays a Toast error when the API request returns a server error', async () => {
    simpleServer.use('/auth/set-password', async () => {
      return {
        status: 400,
        data: {
          success: false,
          error: { code: 'TOKEN_EXPIRED', message: 'El enlace ha expirado' }
        }
      }
    })

    render(<SetPasswordPage />, { wrapper: createWrapper() })

    const passwordInput = screen.getByLabelText(/Nueva Contraseña/i)
    const confirmInput = screen.getByLabelText(/Confirmar Contraseña/i)
    const submitButton = screen.getByRole('button', { name: /Guardar Contraseña/i })

    fireEvent.change(passwordInput, { target: { value: 'securepwd123' } })
    fireEvent.change(confirmInput, { target: { value: 'securepwd123' } })

    fireEvent.click(submitButton)

    await waitFor(() => {
      const toasts = useUIStore.getState().toasts
      expect(toasts).toHaveLength(1)
      expect(toasts[0].title).toBe('Error al cambiar contraseña')
      expect(toasts[0].message).toBe('El enlace ha expirado')
      expect(toasts[0].type).toBe('error')
    })
  })
})
