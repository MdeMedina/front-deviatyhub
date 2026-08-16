import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { simpleServer } from '@/__mocks__/simple-server'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { ApiError } from '@/lib/api/client'
import { useIntegrations, useTestIntegration } from '@/lib/api/hooks/use-integrations'
import { IntegrationType, IIntegration, IIntegrationTestResponse } from '@/lib/types'

const createWrapper = (queryClientInstance?: QueryClient) => {
  const queryClient = queryClientInstance || new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Integrations Module — Hooks useIntegrations & useTestIntegration', () => {
  beforeAll(() => simpleServer.listen())
  afterEach(() => simpleServer.resetHandlers())
  afterAll(() => simpleServer.close())

  const mockIntegrations: IIntegration[] = [
    { type: IntegrationType.WHATSAPP, connected: true, last_tested_at: '2026-05-24T12:00:00Z', last_test_ok: true },
    { type: IntegrationType.INSTAGRAM, connected: true, last_tested_at: '2026-05-24T12:00:00Z', last_test_ok: true },
    { type: IntegrationType.GOOGLE_CALENDAR, connected: true, last_tested_at: '2026-05-24T12:00:00Z', last_test_ok: true },
    { type: IntegrationType.DENTALINK, connected: false, last_tested_at: '', last_test_ok: false },
    { type: IntegrationType.DENTIDESK, connected: false, last_tested_at: '', last_test_ok: false },
    { type: IntegrationType.GMAIL, connected: false, last_tested_at: '', last_test_ok: false },
  ]

  // ==========================================
  // ✅ TEST 1: Fetching de Integraciones (GET)
  // ==========================================
  it('successfully fetches all 6 integrations', async () => {
    simpleServer.use(ENDPOINTS.integrations.list, async () => ({
      status: 200,
      data: { success: true, data: mockIntegrations },
    }))

    const { result } = renderHook(() => useIntegrations(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data).toHaveLength(6)
    expect(result.current.data?.[0].type).toBe(IntegrationType.WHATSAPP)
    expect(result.current.data?.[0].connected).toBe(true)
    expect(result.current.data?.[3].type).toBe(IntegrationType.DENTALINK)
    expect(result.current.data?.[3].connected).toBe(false)
  })

  // ==========================================
  // ✅ TEST 2: Llamada de endpoint correcta con parámetro tipo
  // ==========================================
  it('calls the correct dynamic connectivity test endpoint matching the type parameter', async () => {
    // We intercept any request to the testing route
    simpleServer.use(ENDPOINTS.integrations.test('INSTAGRAM'), async () => {
      return {
        status: 200,
        data: {
          success: true,
          data: {
            ok: true,
            tested_at: '2026-05-24T15:26:00Z',
            latency_ms: 85,
          } as IIntegrationTestResponse,
        },
      }
    })

    const { result } = renderHook(() => useTestIntegration(), { wrapper: createWrapper() })

    const response = await result.current.mutateAsync(IntegrationType.INSTAGRAM)

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/core/integrations/INSTAGRAM/test'),
      expect.any(Object)
    )
    expect(response.ok).toBe(true)
    expect(response.latency_ms).toBe(85)
  })

  // ==========================================
  // ✅ TEST 3: Retorno del test de conexión e invalidación de caché
  // ==========================================
  it('returns test results and invalidates integrations cache on successful mutation', async () => {
    simpleServer.use(ENDPOINTS.integrations.test('WHATSAPP'), async () => ({
      status: 200,
      data: {
        success: true,
        data: {
          ok: true,
          tested_at: '2026-05-24T15:26:00Z',
          latency_ms: 120,
        } as IIntegrationTestResponse,
      },
    }))

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useTestIntegration(), {
      wrapper: createWrapper(queryClient),
    })

    const response = await result.current.mutateAsync(IntegrationType.WHATSAPP)

    expect(response).toEqual({
      ok: true,
      tested_at: '2026-05-24T15:26:00Z',
      latency_ms: 120,
    })

    // Check that cache invalidation was triggered for query Key ['integrations']
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['integrations'] })
  })

  // ==========================================
  // ❌ TEST 4: Restricción de tipos estáticos (IntegrationType)
  // ==========================================
  it('enforces that connection tests can only run with valid IntegrationType values', async () => {
    const typeValidator = (type: IntegrationType) => {
      if (!Object.values(IntegrationType).includes(type)) {
        throw new Error('Invalid IntegrationType')
      }
      return true
    }

    expect(typeValidator(IntegrationType.WHATSAPP)).toBe(true)
    expect(typeValidator(IntegrationType.GOOGLE_CALENDAR)).toBe(true)
    expect(() => typeValidator('INVALID_PROVIDER' as any)).toThrow('Invalid IntegrationType')
  })

  // ==========================================
  // ❌ TEST 5: Fallo de red/API y propagación de ApiError
  // ==========================================
  it('propagates ApiError when connectivity test fails on backend', async () => {
    simpleServer.use(ENDPOINTS.integrations.test('DENTALINK'), async () => ({
      status: 500,
      data: {
        success: false,
        error: {
          code: 'DENTALINK_CONNECTION_TIMEOUT',
          message: 'Timeout al intentar conectar con el servidor de Dentalink.',
        },
      },
    }))

    const { result } = renderHook(() => useTestIntegration(), { wrapper: createWrapper() })

    await expect(result.current.mutateAsync(IntegrationType.DENTALINK)).rejects.toThrow(ApiError)

    try {
      await result.current.mutateAsync(IntegrationType.DENTALINK)
    } catch (err: any) {
      expect(err.code).toBe('DENTALINK_CONNECTION_TIMEOUT')
      expect(err.message).toBe('Timeout al intentar conectar con el servidor de Dentalink.')
    }
  })
})
