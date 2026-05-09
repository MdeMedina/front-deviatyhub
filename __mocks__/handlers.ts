import { http, HttpResponse } from 'msw'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { makeUser, makeConversation } from './factories'

export const handlers = [
  // Auth: Login
  http.post(ENDPOINTS.auth.login, async () => {
    return HttpResponse.json({
      success: true,
      data: {
        access_token: 'mocked-access-token',
        refresh_token: 'mocked-refresh-token',
        expires_in: 3600,
        user: makeUser({ email: 'mock@example.com' })
      }
    })
  }),

  // Auth: Me
  http.get(ENDPOINTS.auth.me, () => {
    return HttpResponse.json({
      success: true,
      data: makeUser()
    })
  }),

  // Conversations: List
  http.get(ENDPOINTS.conversations.list, () => {
    return HttpResponse.json({
      success: true,
      data: Array.from({ length: 5 }, () => makeConversation())
    })
  }),

  // Error Simulation Example
  http.get(`${process.env.NEXT_PUBLIC_API_URL}/test/error`, () => {
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'TEST_ERROR',
          message: 'This is a simulated error'
        }
      },
      { status: 400 }
    )
  }),
]
