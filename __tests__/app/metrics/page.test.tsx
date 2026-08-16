import React from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MetricsPage from '@/app/(dashboard)/metrics/page'
import { useRouter } from 'next/navigation'
import { simpleServer } from '@/__mocks__/simple-server'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { IMetricsSummary } from '@/lib/types'
import { MetricsPeriod } from '@/lib/api/hooks/use-metrics'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/metrics'),
}))

// Mock framer-motion to bypass animations dynamically for any tag
jest.mock('framer-motion', () => {
  const React = require('react')
  const dummyComponent = (tagName: string) => {
    // eslint-disable-next-line react/display-name
    return React.forwardRef(({ children, whileHover, whileTap, animate, initial, exit, transition, ...props }: any, ref: any) => {
      // Filter out framer-motion specific props to prevent console warnings
      return React.createElement(tagName, { ...props, ref }, children)
    })
  }
  
  const motion = new Proxy(
    {},
    {
      get: (target, key) => {
        return dummyComponent(key as string)
      },
    }
  )

  return {
    motion,
    AnimatePresence: ({ children }: any) => <>{children}</>,
  }
})

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

describe('Metrics Page — Analytics Screen', () => {
  const mockRouter = { push: jest.fn() }

  beforeAll(() => simpleServer.listen())
  afterEach(() => {
    simpleServer.resetHandlers()
    jest.clearAllMocks()
  })
  afterAll(() => simpleServer.close())

  beforeEach(() => {
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  const mockMetricsData = (period: MetricsPeriod): IMetricsSummary => ({
    period,
    from: '2026-05-01',
    to: '2026-05-19',
    conversations_attended: 250,
    avg_response_time_ms: 8500, // 8.5s
    containment_rate: 0.78, // 78%
    human_takeovers: 55,
    appointments_scheduled: 180,
    appointments_rescheduled: 30,
    appointments_cancelled: 12,
    out_of_hours_conversations: 45,
    intentions_distribution: [
      { intention: 'Agendar Cita', count: 120, percentage: 48.0 },
      { intention: 'Anular Cita', count: 30, percentage: 12.0 },
      { intention: 'Consultar Horario', count: 100, percentage: 40.0 }
    ],
    interactions_by_hour: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: 10 + i * 2
    }))
  })

  it('renders a loading skeleton when metrics are in flight', () => {
    // Keep query in infinite flight
    simpleServer.use(ENDPOINTS.metrics.summary, () => new Promise(() => {}))

    render(<MetricsPage />, { wrapper: createWrapper() })

    expect(screen.getByTestId('metrics-loading')).toBeInTheDocument()
  })

  it('renders all metrics cards, charts, and header with mock statistics', async () => {
    simpleServer.use(ENDPOINTS.metrics.summary, async () => ({
      status: 200,
      data: {
        success: true,
        data: mockMetricsData('7d')
      }
    }))

    render(<MetricsPage />, { wrapper: createWrapper() })

    // Wait for the skeleton to disappear and the metrics page to load
    await waitFor(() => {
      expect(screen.getByTestId('metrics-page-title')).toHaveTextContent(/Métricas de Rendimiento/i)
      // Check individual MetricCard rendering
      expect(screen.getByText(/Conversaciones Atendidas/i)).toBeInTheDocument()
      expect(screen.getByText('250')).toBeInTheDocument()
      
      expect(screen.getByText(/Tasa de Contención/i)).toBeInTheDocument()
      expect(screen.getByText('78%')).toBeInTheDocument()

      expect(screen.getByText(/Tiempo de Respuesta/i)).toBeInTheDocument()
      expect(screen.getByText('8.5s')).toBeInTheDocument()

      expect(screen.getByText(/Citas Agendadas/i)).toBeInTheDocument()
      expect(screen.getByText('180')).toBeInTheDocument()

      expect(screen.getByText(/Citas Reprogramadas/i)).toBeInTheDocument()
      expect(screen.getByText('30')).toBeInTheDocument()

      expect(screen.getByText(/Citas Canceladas/i)).toBeInTheDocument()
      expect(screen.getByText('12')).toBeInTheDocument()

      expect(screen.getByText(/Derivación a Humano/i)).toBeInTheDocument()
      expect(screen.getByText('55')).toBeInTheDocument()

      expect(screen.getByText(/Fuera de Horario/i)).toBeInTheDocument()
      expect(screen.getByText('45')).toBeInTheDocument()
    })

    // Check that charts are also rendered
    expect(screen.getByTestId('intentions-chart-container')).toBeInTheDocument()
    expect(screen.getByTestId('heatmap-container')).toBeInTheDocument()
  })

  it('updates all cards dynamically when switching between period buttons', async () => {
    let capturedParams: any = null
    simpleServer.use(ENDPOINTS.metrics.summary, async (init: any) => {
      capturedParams = init.params
      const currentPeriod = (init.params?.period || '7d') as MetricsPeriod
      const countMultiplier = currentPeriod === '1d' ? 1 : currentPeriod === '7d' ? 7 : 30
      
      const customData = mockMetricsData(currentPeriod)
      customData.conversations_attended = 10 * countMultiplier
      
      return {
        status: 200,
        data: {
          success: true,
          data: customData
        }
      }
    })

    render(<MetricsPage />, { wrapper: createWrapper() })

    // Default period is 7d, conversations should be 70
    await waitFor(() => {
      expect(screen.getByText('70')).toBeInTheDocument()
    })

    // Click 24 Horas button ('1d' period)
    const btn24h = screen.getByTestId('period-select-1d')
    fireEvent.click(btn24h)

    // Wait for update, conversations should become 10
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument()
      expect(capturedParams).toEqual({ period: '1d' })
    })

    // Click 30 Días button ('30d' period)
    const btn30d = screen.getByTestId('period-select-30d')
    fireEvent.click(btn30d)

    // Wait for update, conversations should become 300
    await waitFor(() => {
      expect(screen.getByText('300')).toBeInTheDocument()
      expect(capturedParams).toEqual({ period: '30d' })
    })
  })

  it('gracefully renders an error state with a working Retry button on API failure', async () => {
    let callCount = 0
    simpleServer.use(ENDPOINTS.metrics.summary, async () => {
      callCount++
      if (callCount === 1) {
        return {
          status: 500,
          data: {
            success: false,
            error: { message: 'Internal server error' }
          }
        }
      } else {
        return {
          status: 200,
          data: {
            success: true,
            data: mockMetricsData('7d')
          }
        }
      }
    })

    render(<MetricsPage />, { wrapper: createWrapper() })

    // First, verify error panel is displayed
    await waitFor(() => {
      expect(screen.getByTestId('metrics-error-state')).toBeInTheDocument()
      expect(screen.getByText(/Error al cargar las métricas/i)).toBeInTheDocument()
    })

    // Click on retry button
    const retryBtn = screen.getByRole('button', { name: /Reintentar Carga/i })
    fireEvent.click(retryBtn)

    // Verify recovery and rendering of correct metrics
    await waitFor(() => {
      expect(screen.queryByTestId('metrics-error-state')).not.toBeInTheDocument()
      expect(screen.getByText('250')).toBeInTheDocument()
    })
  })
})
