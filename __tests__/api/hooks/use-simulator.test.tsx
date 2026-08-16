import React from 'react'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { simpleServer } from '@/__mocks__/simple-server'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { ApiError } from '@/lib/api/client'
import { useSimulator } from '@/lib/api/hooks/use-simulator'
import { ISimulatorResponse } from '@/lib/types'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useSimulator Hook — Chat Simulation', () => {
  beforeAll(() => simpleServer.listen())
  afterEach(() => simpleServer.resetHandlers())
  afterAll(() => simpleServer.close())

  // ==========================================
  // ✅ TEST 1: Primer mensaje genera y almacena session_id
  // ==========================================
  it('successfully starts a session with the first message and stores session_id', async () => {
    let requestPayload: any = null

    simpleServer.use(ENDPOINTS.simulator, async (init: any) => {
      requestPayload = JSON.parse(init.body)
      return {
        status: 200,
        data: {
          success: true,
          data: {
            session_id: 'session-abc-123',
            response: 'Hola, soy el asistente virtual. ¿En qué te puedo ayudar hoy?',
            tools_used: []
          } as ISimulatorResponse
        }
      }
    })

    const { result } = renderHook(() => useSimulator(), { wrapper: createWrapper() })

    expect(result.current.sessionId).toBeNull()

    // Send first message
    let response: any
    await act(async () => {
      response = await result.current.sendMessage.mutateAsync('Hola bot')
    })

    expect(requestPayload).toEqual({ message: 'Hola bot', session_id: null })
    expect(response.session_id).toBe('session-abc-123')
    expect(result.current.sessionId).toBe('session-abc-123')
  })

  // ==========================================
  // ✅ TEST 2: Mensajes subsiguientes reutilizan el session_id
  // ==========================================
  it('reuses the session_id for subsequent messages', async () => {
    const payloadsSent: any[] = []

    simpleServer.use(ENDPOINTS.simulator, async (init: any) => {
      const parsedBody = JSON.parse(init.body)
      payloadsSent.push(parsedBody)
      return {
        status: 200,
        data: {
          success: true,
          data: {
            session_id: 'session-abc-123',
            response: 'Respuesta simulada',
            tools_used: ['check_availability']
          } as ISimulatorResponse
        }
      }
    })

    const { result } = renderHook(() => useSimulator(), { wrapper: createWrapper() })

    // Message 1
    await act(async () => {
      await result.current.sendMessage.mutateAsync('Mensaje uno')
    })
    // Message 2
    await act(async () => {
      await result.current.sendMessage.mutateAsync('Mensaje dos')
    })

    expect(payloadsSent).toHaveLength(2)
    expect(payloadsSent[0]).toEqual({ message: 'Mensaje uno', session_id: null })
    expect(payloadsSent[1]).toEqual({ message: 'Mensaje dos', session_id: 'session-abc-123' })
    expect(result.current.sessionId).toBe('session-abc-123')
  })

  // ==========================================
  // ✅ TEST 3: resetSession limpia session_id
  // ==========================================
  it('clears session_id when resetSession is called', async () => {
    simpleServer.use(ENDPOINTS.simulator, async () => {
      return {
        status: 200,
        data: {
          success: true,
          data: {
            session_id: 'session-abc-123',
            response: 'Hola',
            tools_used: []
          } as ISimulatorResponse
        }
      }
    })

    const { result } = renderHook(() => useSimulator(), { wrapper: createWrapper() })

    // Send message to set the session
    await act(async () => {
      await result.current.sendMessage.mutateAsync('Inicia sesión')
    })
    expect(result.current.sessionId).toBe('session-abc-123')

    // Reset session
    act(() => {
      result.current.resetSession()
    })
    expect(result.current.sessionId).toBeNull()
  })

  // ==========================================
  // ❌ TEST 4: Mensaje vacío bloquea la mutación
  // ==========================================
  it('prevents executing the mutation if the message is empty or whitespace', async () => {
    let apiCalled = false
    simpleServer.use(ENDPOINTS.simulator, async () => {
      apiCalled = true
      return { status: 200, data: { success: true, data: {} } }
    })

    const { result } = renderHook(() => useSimulator(), { wrapper: createWrapper() })

    // Attempt to send empty message
    await expect(result.current.sendMessage.mutateAsync('')).rejects.toThrow(
      'El mensaje no puede estar vacío.'
    )

    // Attempt to send spaces message
    await expect(result.current.sendMessage.mutateAsync('   ')).rejects.toThrow(
      'El mensaje no puede estar vacío.'
    )

    expect(apiCalled).toBe(false)
  })

  // ==========================================
  // ❌ TEST 5: Fallo en el backend/agente propaga el error
  // ==========================================
  it('propagates ApiError when the backend simulator endpoint fails', async () => {
    simpleServer.use(ENDPOINTS.simulator, async () => {
      return {
        status: 500,
        data: {
          success: false,
          error: {
            code: 'AGENT_SIMULATION_FAILED',
            message: 'Ocurrió un error interno al simular la respuesta del bot.'
          }
        }
      }
    })

    const { result } = renderHook(() => useSimulator(), { wrapper: createWrapper() })

    await expect(result.current.sendMessage.mutateAsync('Hola fallido')).rejects.toThrow(ApiError)

    try {
      await result.current.sendMessage.mutateAsync('Hola fallido')
    } catch (err: any) {
      expect(err.code).toBe('AGENT_SIMULATION_FAILED')
      expect(err.message).toBe('Ocurrió un error interno al simular la respuesta del bot.')
    }
  })
})
