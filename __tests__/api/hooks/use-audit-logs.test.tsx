import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { simpleServer } from '@/__mocks__/simple-server'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { ApiError } from '@/lib/api/client'
import { useAuditLogs } from '@/lib/api/hooks/use-audit-logs'
import { IAuditLog } from '@/lib/types'

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

describe('useAuditLogs Hook', () => {
  beforeAll(() => simpleServer.listen())
  afterEach(() => simpleServer.resetHandlers())
  afterAll(() => simpleServer.close())

  const mockLogs: IAuditLog[] = [
    {
      id: 'log-1',
      user_email: 'john@deviaty.com',
      action: 'UPDATE',
      entity: 'Doctor',
      created_at: '2026-05-26T16:00:00Z',
      changes: { before: null, after: null },
    },
  ]

  it('successfully fetches audit logs for a given period', async () => {
    simpleServer.use(ENDPOINTS.security.auditLogs, async (init: any) => {
      // Expect that fetch URL has '?period=7d'
      return {
        status: 200,
        data: { success: true, data: mockLogs },
      }
    })

    const { result } = renderHook(() => useAuditLogs('7d'), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockLogs)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/core/security/audit-logs?period=7d'),
      expect.any(Object)
    )
  })

  it('propagates ApiError when API call fails', async () => {
    simpleServer.use(ENDPOINTS.security.auditLogs, async () => ({
      status: 500,
      data: { success: false, error: { code: 'SERVER_ERROR', message: 'Fail' } },
    }))

    const { result } = renderHook(() => useAuditLogs('30d'), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeInstanceOf(ApiError)
  })
})
