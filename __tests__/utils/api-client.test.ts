import { apiClient, ApiError } from '@/lib/api/client'
import { useAuthStore } from '@/lib/stores/auth.store'

// Mock the auth store
jest.mock('@/lib/stores/auth.store', () => ({
  useAuthStore: {
    getState: jest.fn()
  }
}))

describe('Infrastructure — API Client', () => {
  const mockUpdateTokens = jest.fn()
  const mockClearSession = jest.fn()

  beforeEach(() => {
    global.fetch = jest.fn()
    jest.clearAllMocks()
    ;(useAuthStore.getState as jest.Mock).mockReturnValue({
      access_token: 'valid-token',
      refresh_token: 'valid-refresh',
      updateTokens: mockUpdateTokens,
      clearSession: mockClearSession
    })
  })

  it('successfully attaches the Authorization header to the outgoing request', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { result: 'ok' } })
    } as Response)

    await apiClient.get('http://api.test/data')

    expect(global.fetch).toHaveBeenCalledWith(
      'http://api.test/data',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer valid-token'
        })
      })
    )
  })

  it('successfully returns the unpacked data field from a successful response', async () => {
    const expectedData = { id: 1, name: 'Test' }
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: expectedData })
    } as Response)

    const result = await apiClient.get('http://api.test/data')
    expect(result).toEqual(expectedData)
  })

  it('successfully triggers a token refresh and retries the original request on a 401 response', async () => {
    // 1. Initial request fails with 401
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ success: false, error: { code: 'UNAUTHORIZED' } })
    } as Response)

    // 2. Refresh request succeeds
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { access_token: 'new-token', refresh_token: 'new-refresh' }
      })
    } as Response)

    // 3. Retried request succeeds
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { result: 'retry-ok' } })
    } as Response)

    const result = await apiClient.get('http://api.test/data')

    expect(mockUpdateTokens).toHaveBeenCalledWith('new-token', 'new-refresh')
    expect(result).toEqual({ result: 'retry-ok' })
    expect(global.fetch).toHaveBeenCalledTimes(3) // Original + Refresh + Retry
  })

  it('successfully throws an ApiError with descriptive code when the server returns an error', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'The data is invalid' }
      })
    } as Response)

    try {
      await apiClient.post('http://api.test/data', { foo: 'bar' })
    } catch (error) {
      const apiError = error as ApiError
      expect(apiError).toBeInstanceOf(ApiError)
      expect(apiError.code).toBe('INVALID_INPUT')
      expect(apiError.message).toBe('The data is invalid')
    }
  })
})
