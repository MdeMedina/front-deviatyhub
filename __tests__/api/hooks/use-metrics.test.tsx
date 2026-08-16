import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMetrics, MetricsPeriod } from '@/lib/api/hooks/use-metrics'
import { simpleServer } from '@/__mocks__/simple-server'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { IMetricsSummary } from '@/lib/types'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Metrics Module — Hook useMetrics (Fase 7.1)', () => {
  beforeAll(() => simpleServer.listen())
  afterEach(() => simpleServer.resetHandlers())
  afterAll(() => simpleServer.close())

  const mockMetricsData = (period: MetricsPeriod): IMetricsSummary => ({
    period,
    from: '2026-05-01',
    to: '2026-05-19',
    conversations_attended: 250,
    avg_response_time_ms: 8500,
    containment_rate: 0.78, // between 0 and 1
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

  // ==========================================
  // ✅ TEST 1: Fetch Correcto al Cambiar Periodo
  // ==========================================
  it('successfully fetches a metrics summary and matches the query parameters when switching period', async () => {
    let capturedParams: any = null

    simpleServer.use(ENDPOINTS.metrics.summary, async (init: any) => {
      capturedParams = init.params
      const period = (init.params?.period || '7d') as MetricsPeriod
      return {
        status: 200,
        data: {
          success: true,
          data: mockMetricsData(period)
        }
      }
    })

    const { result, rerender } = renderHook(
      ({ period }: { period: MetricsPeriod }) => useMetrics(period),
      {
        wrapper: createWrapper(),
        initialProps: { period: '7d' as MetricsPeriod }
      }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.period).toBe('7d')
    expect(capturedParams).toEqual({ period: '7d' })

    // Dynamically rerender with '30d'
    rerender({ period: '30d' as MetricsPeriod })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.period).toBe('30d')
    expect(capturedParams).toEqual({ period: '30d' })
  })

  // ==========================================
  // ✅ TEST 2: Estructura de Interactions By Hour (24 items)
  // ==========================================
  it('ensures that interactions_by_hour array always contains exactly 24 elements representing 0-23 hours', async () => {
    simpleServer.use(ENDPOINTS.metrics.summary, async () => {
      return {
        status: 200,
        data: {
          success: true,
          data: mockMetricsData('7d')
        }
      }
    })

    const { result } = renderHook(() => useMetrics('7d'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const hourlyInteractions = result.current.data?.interactions_by_hour || []
    expect(hourlyInteractions).toHaveLength(24)
    hourlyInteractions.forEach((item, index) => {
      expect(item.hour).toBe(index)
      expect(item.count).toBeGreaterThanOrEqual(0)
    })
  })

  // ==========================================
  // ✅ TEST 3: Validación del Rango de Containment Rate (0 a 1)
  // ==========================================
  it('ensures containment_rate is a floating number between 0.0 and 1.0', async () => {
    simpleServer.use(ENDPOINTS.metrics.summary, async () => {
      return {
        status: 200,
        data: {
          success: true,
          data: mockMetricsData('1d')
        }
      }
    })

    const { result } = renderHook(() => useMetrics('1d'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const rate = result.current.data?.containment_rate
    expect(rate).toBeDefined()
    expect(rate).toBeGreaterThanOrEqual(0.0)
    expect(rate).toBeLessThanOrEqual(1.0)
  })

  // ==========================================
  // ❌ TEST 4: Manejo de Errores de Red / API
  // ==========================================
  it('successfully transitions to isError: true when a network or API error occurs', async () => {
    simpleServer.use(ENDPOINTS.metrics.summary, async () => {
      return {
        status: 500,
        data: {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Ocurrió un error inesperado al procesar las estadísticas.'
          }
        }
      }
    })

    const { result } = renderHook(() => useMetrics('30d'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeDefined()
  })
})
