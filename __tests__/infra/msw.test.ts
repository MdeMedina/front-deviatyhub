import { apiClient, ApiError } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { simpleServer } from '../../__mocks__/simple-server'
import { makeUser, makeConversation } from '../../__mocks__/factories'

describe('Infrastructure — Mock Server & Factories', () => {
  beforeAll(() => simpleServer.listen())
  afterEach(() => simpleServer.resetHandlers())
  afterAll(() => simpleServer.close())

  it('successfully intercepts a login request and returns factory-generated data', async () => {
    simpleServer.use(ENDPOINTS.auth.login, async () => ({
      data: {
        success: true,
        data: {
          access_token: 'mocked-access-token',
          user: makeUser({ email: 'mock@example.com' })
        }
      }
    }))

    const data = await apiClient.post<any>(ENDPOINTS.auth.login, {
      email: 'test@example.com',
      password: 'password'
    })

    expect(data.access_token).toBe('mocked-access-token')
    expect(data.user.email).toBe('mock@example.com')
  })

  it('successfully handles a 400 Bad Request error and throws ApiError', async () => {
    const errorUrl = 'http://api.test/error'
    simpleServer.use(errorUrl, async () => ({
      status: 400,
      data: {
        success: false,
        error: {
          code: 'TEST_ERROR',
          message: 'This is a simulated error'
        }
      }
    }))
    
    try {
      await apiClient.get(errorUrl)
      throw new Error('Should have thrown an ApiError')
    } catch (error) {
      if (!(error instanceof ApiError)) throw error
      expect(error.code).toBe('TEST_ERROR')
      expect(error.message).toBe('This is a simulated error')
    }
  })

  it('ensures factories produce consistent but random data across calls', () => {
    const user1 = makeUser()
    const user2 = makeUser()
    expect(user1.id).not.toBe(user2.id)
    expect(user1.email).not.toBe(user2.email)
  })
})
