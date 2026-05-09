import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ConversationList } from '@/components/conversations/ConversationList'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { simpleServer } from '@/__mocks__/simple-server'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { ConversationStatus, Channel, ConversationStep } from '@/lib/types'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Conversations Module — ConversationList', () => {
  beforeAll(() => simpleServer.listen())
  afterEach(() => simpleServer.resetHandlers())
  afterAll(() => simpleServer.close())

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

  it('renders EmptyState when no conversations are found', async () => {
    simpleServer.use(ENDPOINTS.conversations.list, async () => ({
      status: 200,
      data: {
        success: true,
        data: { data: [], meta: { page: 1, limit: 10, total: 0, total_pages: 0 } }
      }
    }))

    render(<ConversationList onSelect={() => {}} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Sin resultados')).toBeInTheDocument()
    })
  })

  it('renders a list of conversations and handles selection', async () => {
    simpleServer.use(ENDPOINTS.conversations.list, async () => ({
      status: 200,
      data: {
        success: true,
        data: { data: mockConversations, meta: { page: 1, limit: 10, total: 1, total_pages: 1 } }
      }
    }))

    const handleSelect = jest.fn()
    render(<ConversationList onSelect={handleSelect} />, { wrapper: createWrapper() })

    const john = await screen.findByText('John Doe')
    expect(john).toBeInTheDocument()
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText(ConversationStatus.OPEN)).toBeInTheDocument()

    fireEvent.click(john)
    expect(handleSelect).toHaveBeenCalledWith('conv-1')
  })

  it('applies status filter when clicking tabs', async () => {
    let lastParams: any = null
    simpleServer.use(ENDPOINTS.conversations.list, async (init: any) => {
      lastParams = init.params
      return {
        status: 200,
        data: {
          success: true,
          data: { data: [], meta: { page: 1, limit: 10, total: 0, total_pages: 0 } }
        }
      }
    })

    render(<ConversationList onSelect={() => {}} />, { wrapper: createWrapper() })

    const openTab = screen.getByText('Abiertos')
    fireEvent.click(openTab)

    await waitFor(() => {
      expect(lastParams.status).toBe(ConversationStatus.OPEN)
    })
  })
})
