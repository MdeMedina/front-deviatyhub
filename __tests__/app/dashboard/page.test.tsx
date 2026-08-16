import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DashboardPage from '@/app/(dashboard)/dashboard/page'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth.store'
import { simpleServer } from '@/__mocks__/simple-server'
import { ENDPOINTS } from '@/lib/api/endpoints'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/dashboard'),
}))

// Mock framer-motion to bypass animations
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { 
      queries: { retry: false, staleTime: 0 }, 
      mutations: { retry: false } 
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Dashboard Page — Home Screen', () => {
  const mockRouter = { push: jest.fn() }

  beforeAll(() => simpleServer.listen())
  afterEach(() => {
    simpleServer.resetHandlers()
    jest.clearAllMocks()
    act(() => {
      useAuthStore.getState().clearSession()
    })
  })
  afterAll(() => simpleServer.close())

  beforeEach(() => {
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    // Setup typical authenticated session
    act(() => {
      useAuthStore.getState().setSession({
        user: {
          id: 'dr-medina',
          email: 'miguel.medina@deviaty.com',
          clinic_id: 'clinic-1',
          active: true,
          role: {
            id: 'role-superadmin',
            name: 'Superadmin',
            is_superadmin: true,
            permissions: {} as any
          }
        },
        access_token: 'mock-access',
        refresh_token: 'mock-refresh',
        expires_in: 3600
      })
    })
  })

  it('renders a loading skeleton when data is in flight', () => {
    // Keep queries in infinite flight
    simpleServer.use(ENDPOINTS.clinic.config, () => new Promise(() => {}))
    simpleServer.use(ENDPOINTS.metrics.summary, () => new Promise(() => {}))

    render(<DashboardPage />, { wrapper: createWrapper() })

    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument()
  })

  it('renders welcoming header and user greeting when clinic details are loaded', async () => {
    simpleServer.use(ENDPOINTS.clinic.config, async () => ({
      status: 200,
      data: { success: true, data: { name: 'Clinica Dental San Miguel' } }
    }))
    simpleServer.use(ENDPOINTS.metrics.summary, async () => ({
      status: 200,
      data: {
        success: true,
        data: {
          period: '7d',
          conversations_attended: 42,
          containment_rate: 0.85,
          appointments_scheduled: 12
        }
      }
    }))

    render(<DashboardPage />, { wrapper: createWrapper() })

    // Wait for the skeleton to disappear and the welcome banner to appear
    await waitFor(() => {
      expect(screen.getByText(/Clinica Dental San Miguel/i)).toBeInTheDocument()
      expect(screen.getByTestId('user-greeting')).toHaveTextContent('miguel.medina')
    })
  })

  it('displays real-time KPIs populated with correct metrics values', async () => {
    simpleServer.use(ENDPOINTS.clinic.config, async () => ({
      status: 200,
      data: { success: true, data: { name: 'Clinica Dental San Miguel' } }
    }))
    simpleServer.use(ENDPOINTS.metrics.summary, async () => ({
      status: 200,
      data: {
        success: true,
        data: {
          period: '7d',
          conversations_attended: 154,
          containment_rate: 0.92,
          appointments_scheduled: 38
        }
      }
    }))

    render(<DashboardPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('conversations-kpi')).toHaveTextContent('154')
      expect(screen.getByTestId('containment-kpi')).toHaveTextContent('92%')
      expect(screen.getByTestId('appointments-kpi')).toHaveTextContent('38')
    })
  })

  it('gracefully handles metrics API failure and displays fallback counters', async () => {
    simpleServer.use(ENDPOINTS.clinic.config, async () => ({
      status: 200,
      data: { success: true, data: { name: 'Clinica Dental San Miguel' } }
    }))
    simpleServer.use(ENDPOINTS.metrics.summary, async () => ({
      status: 400,
      data: { success: false, error: { message: 'Bad request' } }
    }))

    render(<DashboardPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('conversations-kpi')).toHaveTextContent('--')
      expect(screen.getByTestId('containment-kpi')).toHaveTextContent('--')
      expect(screen.getByTestId('appointments-kpi')).toHaveTextContent('--')
      expect(screen.getByText(/Clinica Dental San Miguel/i)).toBeInTheDocument()
    })
  })

  it('renders all crucial platform shortcuts pointing to valid routes', async () => {
    simpleServer.use(ENDPOINTS.clinic.config, async () => ({
      status: 200,
      data: { success: true, data: { name: 'Clinica Dental San Miguel' } }
    }))
    simpleServer.use(ENDPOINTS.metrics.summary, async () => ({
      status: 200,
      data: { success: true, data: {} }
    }))

    render(<DashboardPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Bandeja de Entrada/i })).toHaveAttribute('href', '/conversations')
      expect(screen.getByRole('link', { name: /Agenda Médica/i })).toHaveAttribute('href', '/agenda')
      expect(screen.getByRole('link', { name: /Base de Conocimiento/i })).toHaveAttribute('href', '/knowledge-base')
      expect(screen.getByRole('link', { name: /Métricas y Reportes/i })).toHaveAttribute('href', '/metrics')
    })
  })
})
