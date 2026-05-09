import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useConversations, useConversationDetail, useTakeover } from '@/lib/api/hooks/use-conversations'
import { simpleServer } from '@/__mocks__/simple-server'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { Channel, ConversationStatus, ConversationStep } from '@/lib/types'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Conversations Module — Hook useConversations', () => {
  beforeAll(() => simpleServer.listen())
  afterEach(() => simpleServer.resetHandlers())
  afterAll(() => simpleServer.close())

  it('successfully fetches a list of conversations', async () => {
    const mockConversations = [
      {
        id: 'conv-1',
        channel: Channel.WHATSAPP,
        status: ConversationStatus.OPEN,
        current_step: ConversationStep.INICIO,
        contact: { id: 'c1', name: 'John Doe' },
        last_message: { id: 'm1', content: 'Hello', sent_at: new Date().toISOString() },
        appointment_id: null,
        started_at: new Date().toISOString()
      }
    ]

    simpleServer.use(ENDPOINTS.conversations.list, async () => ({
      status: 200,
      data: {
        success: true,
        data: {
          data: mockConversations,
          meta: { page: 1, limit: 10, total: 1, total_pages: 1 }
        }
      }
    }))

    const { result } = renderHook(() => useConversations(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.data).toHaveLength(1)
    expect(result.current.data?.data[0].id).toBe('conv-1')
  })

  it('applies filters correctly to the API request', async () => {
    let capturedParams: any = null
    
    simpleServer.use(ENDPOINTS.conversations.list, async (init: any) => {
      // In our simpleServer, init contains the searchParams if we logic it, 
      // but apiClient passes params in the second arg which goes to init.params in our mock
      capturedParams = init.params
      return {
        status: 200,
        data: { 
          success: true, 
          data: {
            data: [], 
            meta: { page: 1, limit: 10, total: 0, total_pages: 0 } 
          }
        }
      }
    })

    const filters = { status: ConversationStatus.HUMAN_TAKEOVER, channel: Channel.INSTAGRAM }
    renderHook(() => useConversations(filters), { wrapper: createWrapper() })

    await waitFor(() => expect(capturedParams).toEqual(filters))
  })

  describe('Hook useConversationDetail', () => {
    it('successfully fetches detailed conversation data', async () => {
      const mockDetail = {
        id: 'conv-123',
        contact: { id: 'c1', name: 'Jane', phone: '123', email: 'j@j.com' },
        messages: [{ id: 'm1', content: 'Hi', role: 'USER', sent_at: new Date().toISOString() }],
        status: 'OPEN'
      }

      simpleServer.use(ENDPOINTS.conversations.byId('conv-123'), async () => ({
        status: 200,
        data: { success: true, data: mockDetail }
      }))

      const { result } = renderHook(() => useConversationDetail('conv-123'), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.id).toBe('conv-123')
      expect(result.current.data?.messages).toHaveLength(1)
    })

    it('does not fetch when id is missing', () => {
      const { result } = renderHook(() => useConversationDetail(''), { wrapper: createWrapper() })
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isFetching).toBe(false)
    })
  })

  describe('Hook useTakeover', () => {
    it('successfully triggers takeover mutation', async () => {
      let mutationCalled = false
      simpleServer.use(ENDPOINTS.conversations.takeover('c1'), async () => {
        mutationCalled = true
        return { status: 200, data: { success: true, data: { status: 'HUMAN_TAKEOVER' } } }
      })

      const { result } = renderHook(() => useTakeover('c1'), { wrapper: createWrapper() })
      
      await result.current.takeover.mutateAsync()
      expect(mutationCalled).toBe(true)
    })

    it('successfully triggers sendMessage mutation', async () => {
      let sentContent = ''
      simpleServer.use(ENDPOINTS.conversations.message('c1'), async (init: any) => {
        const body = JSON.parse(init.body)
        sentContent = body.content
        return { status: 200, data: { success: true, data: { id: 'm-new' } } }
      })

      const { result } = renderHook(() => useTakeover('c1'), { wrapper: createWrapper() })
      
      await result.current.sendMessage.mutateAsync('Hello human')
      expect(sentContent).toBe('Hello human')
    })
  })
})
