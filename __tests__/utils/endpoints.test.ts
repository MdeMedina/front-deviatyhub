
describe('Infrastructure — API Endpoints', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv, NEXT_PUBLIC_API_URL: 'http://api.test' }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('successfully generates the correct base URL for core modules', async () => {
    const { ENDPOINTS } = await import('@/lib/api/endpoints')
    expect(ENDPOINTS.auth.login).toBe('http://api.test/auth/login')
    expect(ENDPOINTS.conversations.list).toBe('http://api.test/core/conversations')
    expect(ENDPOINTS.agenda.appointments).toBe('http://api.test/core/agenda/appointments')
  })

  it('successfully resolves dynamic routes with provided parameters', async () => {
    const { ENDPOINTS } = await import('@/lib/api/endpoints')
    const userId = 'user-123'
    const convId = 'conv-456'
    const treatId = 'treat-789'
    const offerId = 'offer-000'

    expect(ENDPOINTS.auth.user(userId)).toBe(`http://api.test/auth/users/${userId}`)
    expect(ENDPOINTS.conversations.byId(convId)).toBe(`http://api.test/core/conversations/${convId}`)
    expect(ENDPOINTS.treatments.offer(treatId, offerId)).toBe(`http://api.test/core/treatments/${treatId}/offers/${offerId}`)
  })

  it('ensures all defined endpoints are consistent strings or functions', async () => {
    const { ENDPOINTS } = await import('@/lib/api/endpoints')
    Object.values(ENDPOINTS).forEach(module => {
      Object.values(module).forEach(endpoint => {
        const type = typeof endpoint
        expect(['string', 'function']).toContain(type)
      })
    })
  })
})
