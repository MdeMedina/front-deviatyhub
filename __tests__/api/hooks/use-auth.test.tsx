import React from 'react'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLogin, useSetPassword } from '@/lib/api/hooks/use-auth'
import { simpleServer } from '@/__mocks__/simple-server'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { useRouter } from 'next/navigation'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Auth Module — Hooks useLogin & useSetPassword', () => {
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

  describe('Hook useLogin', () => {
    it('successfully logs in a user and sets session', async () => {
      const mockResponse = {
        access_token: 'valid-access-token',
        refresh_token: 'valid-refresh-token',
        expires_in: 3600,
        user: {
          id: 'user-1',
          email: 'admin@clinic.com',
          clinic_id: 'clinic-123',
          active: true,
          role: {
            id: 'role-1',
            name: 'Administrador',
            is_superadmin: true,
            permissions: {
              knowledge_base: { view: true, edit: true },
              agent_actions: { view: true, edit: true },
              simulator: { view: true },
              metrics: { view: true },
              integrations: { view: true },
              security: { view: true },
              users: { view: true, edit: true, create: true, delete: true },
              clinic_config: { view: true, edit: true },
              conversations: { view: true, takeover: true },
              agenda: { view: true, edit: true }
            }
          }
        }
      }

      let payloadCaptured: any = null
      simpleServer.use(ENDPOINTS.auth.login, async (init: any) => {
        payloadCaptured = JSON.parse(init.body)
        return {
          status: 200,
          data: { success: true, data: mockResponse }
        }
      })

      const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() })
      
      const credentials = { email: 'admin@clinic.com', password: 'password123' }
      await act(async () => {
        await result.current.mutateAsync(credentials)
      })

      expect(payloadCaptured).toEqual(credentials)
    })
  })

  describe('Hook useSetPassword', () => {
    it('successfully triggers set password mutation', async () => {
      let payloadCaptured: any = null
      let mutationCalled = false

      simpleServer.use(ENDPOINTS.auth.setPassword, async (init: any) => {
        mutationCalled = true
        payloadCaptured = JSON.parse(init.body)
        return {
          status: 200,
          data: { success: true, data: { message: 'Password set successfully' } }
        }
      })

      const { result } = renderHook(() => useSetPassword(), { wrapper: createWrapper() })
      
      const credentials = {
        token: 'test-invitation-token',
        password: 'newsecurepassword123',
        password_confirm: 'newsecurepassword123'
      }
      
      await act(async () => {
        await result.current.mutateAsync(credentials)
      })

      expect(mutationCalled).toBe(true)
      expect(payloadCaptured).toEqual(credentials)
    })
  })
})
