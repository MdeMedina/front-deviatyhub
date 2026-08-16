import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { simpleServer } from '@/__mocks__/simple-server'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { ApiError } from '@/lib/api/client'
import { useAgentConfig, useUpdateAgentConfig } from '@/lib/api/hooks/use-agent'
import { Channel, IntegrationType, IAgentConfig } from '@/lib/types'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { 
      queries: { retry: false },
      mutations: { retry: false }
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Agent Config Module — Hooks', () => {
  beforeAll(() => simpleServer.listen())
  afterEach(() => simpleServer.resetHandlers())
  afterAll(() => simpleServer.close())

  const mockAgentConfig: IAgentConfig = {
    id: 'agent-config-1',
    clinic_id: 'clinic-1',
    actions: {
      schedule: {
        active: true,
        channels: [Channel.WHATSAPP],
        integrations: [IntegrationType.WHATSAPP, IntegrationType.GOOGLE_CALENDAR]
      },
      reschedule: {
        active: true,
        channels: [Channel.WHATSAPP],
        integrations: [IntegrationType.WHATSAPP, IntegrationType.GOOGLE_CALENDAR]
      },
      cancel: {
        active: true,
        channels: [Channel.WHATSAPP],
        integrations: [IntegrationType.WHATSAPP]
      }
    },
    updated_at: '2026-05-22T14:43:51Z'
  }

  // ==========================================
  // ✅ TEST 1: Consulta exitosa de configuración (GET)
  // ==========================================
  it('successfully fetches agent configuration', async () => {
    simpleServer.use(ENDPOINTS.agentConfig, async () => ({
      status: 200,
      data: { success: true, data: mockAgentConfig },
    }))

    const { result } = renderHook(() => useAgentConfig(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data?.id).toBe('agent-config-1')
    expect(result.current.data?.actions.schedule.active).toBe(true)
    expect(result.current.data?.actions.cancel.channels).toContain(Channel.WHATSAPP)
  })

  // ==========================================
  // ✅ TEST 2: Mutación exitosa de configuración (PATCH)
  // ==========================================
  it('successfully updates agent configuration', async () => {
    let receivedPayload: any = null

    simpleServer.use(ENDPOINTS.agentConfig, async (init: any) => {
      receivedPayload = JSON.parse(init.body)
      return {
        status: 200,
        data: { success: true, data: { ...mockAgentConfig, ...receivedPayload } },
      }
    })

    const { result } = renderHook(() => useUpdateAgentConfig(), { wrapper: createWrapper() })

    const updatePayload: Partial<IAgentConfig> = {
      actions: {
        ...mockAgentConfig.actions,
        schedule: {
          active: true,
          channels: [Channel.WHATSAPP, Channel.INSTAGRAM],
          integrations: [IntegrationType.WHATSAPP, IntegrationType.GOOGLE_CALENDAR]
        }
      }
    }

    const mutationResult = await result.current.mutateAsync(updatePayload)

    expect(receivedPayload).toEqual(updatePayload)
    expect(mutationResult.actions.schedule.channels).toContain(Channel.INSTAGRAM)
  })

  // ==========================================
  // ✅ TEST 3: Desactivación de acción del agente (active: false)
  // ==========================================
  it('successfully updates configuration when an action is deactivated', async () => {
    let receivedPayload: any = null

    simpleServer.use(ENDPOINTS.agentConfig, async (init: any) => {
      receivedPayload = JSON.parse(init.body)
      return {
        status: 200,
        data: { success: true, data: { ...mockAgentConfig, ...receivedPayload } },
      }
    })

    const { result } = renderHook(() => useUpdateAgentConfig(), { wrapper: createWrapper() })

    const updatePayload: Partial<IAgentConfig> = {
      actions: {
        ...mockAgentConfig.actions,
        cancel: {
          active: false,
          channels: [Channel.WHATSAPP],
          integrations: [IntegrationType.WHATSAPP]
        }
      }
    }

    const mutationResult = await result.current.mutateAsync(updatePayload)

    expect(receivedPayload).toEqual(updatePayload)
    expect(mutationResult.actions.cancel.active).toBe(false)
  })

  // ==========================================
  // ❌ TEST 4: Habilitación de integración no conectada (400 Bad Request)
  // ==========================================
  it('throws ApiError when attempting to enable an unconnected integration', async () => {
    simpleServer.use(ENDPOINTS.agentConfig, async () => {
      return {
        status: 400,
        data: {
          success: false,
          error: {
            code: 'INTEGRATION_NOT_CONNECTED',
            message: 'La integración DENTALINK no está configurada o conectada.',
          },
        },
      }
    })

    const { result } = renderHook(() => useUpdateAgentConfig(), { wrapper: createWrapper() })

    const updatePayload: Partial<IAgentConfig> = {
      actions: {
        ...mockAgentConfig.actions,
        schedule: {
          active: true,
          channels: [Channel.WHATSAPP],
          integrations: [IntegrationType.WHATSAPP, IntegrationType.DENTALINK]
        }
      }
    }

    await expect(result.current.mutateAsync(updatePayload)).rejects.toThrow(ApiError)

    try {
      await result.current.mutateAsync(updatePayload)
    } catch (err: any) {
      expect(err.code).toBe('INTEGRATION_NOT_CONNECTED')
      expect(err.message).toBe('La integración DENTALINK no está configurada o conectada.')
    }
  })

  // ==========================================
  // ❌ TEST 5: Cuerpo de mutación inválido (422 Unprocessable Entity)
  // ==========================================
  it('throws ApiError when payload validation fails on backend', async () => {
    simpleServer.use(ENDPOINTS.agentConfig, async () => {
      return {
        status: 422,
        data: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El cuerpo de la solicitud no puede estar vacío.',
          },
        },
      }
    })

    const { result } = renderHook(() => useUpdateAgentConfig(), { wrapper: createWrapper() })

    await expect(result.current.mutateAsync({})).rejects.toThrow(ApiError)

    try {
      await result.current.mutateAsync({})
    } catch (err: any) {
      expect(err.code).toBe('VALIDATION_ERROR')
      expect(err.message).toBe('El cuerpo de la solicitud no puede estar vacío.')
    }
  })
})
