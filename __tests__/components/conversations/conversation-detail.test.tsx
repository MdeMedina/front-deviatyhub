import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ConversationDetail } from '@/components/conversations/ConversationDetail'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { simpleServer } from '@/__mocks__/simple-server'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { ConversationStatus, MessageRole } from '@/lib/types'
import { useAuthStore } from '@/lib/stores/auth.store'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Conversations Module — ConversationDetail', () => {
  beforeAll(() => simpleServer.listen())
  afterEach(() => simpleServer.resetHandlers())
  afterAll(() => simpleServer.close())

  const mockDetail = {
    id: 'conv-123',
    status: ConversationStatus.OPEN,
    current_step: 'INICIO',
    channel: 'WHATSAPP',
    contact: { id: 'c1', name: 'Jane Doe', phone: '+56912345678' },
    messages: [
      { id: 'm1', role: MessageRole.USER, content: 'Hola!', sent_at: new Date().toISOString() }
    ]
  }

  it('renders EmptyState when no conversationId is provided', () => {
    render(<ConversationDetail conversationId={null} />, { wrapper: createWrapper() })
    expect(screen.getByText('Selecciona un chat')).toBeInTheDocument()
  })

  it('renders detailed conversation and messages', async () => {
    simpleServer.use(ENDPOINTS.conversations.byId('conv-123'), async () => ({
      status: 200,
      data: { success: true, data: mockDetail }
    }))

    useAuthStore.setState({
      user: { role: { permissions: { conversations: { takeover: true } } } } as any,
      isAuthenticated: true
    })

    render(<ConversationDetail conversationId="conv-123" />, { wrapper: createWrapper() })

    expect(await screen.findAllByText('Jane Doe')).toHaveLength(2)
    expect(screen.getByText('Hola!')).toBeInTheDocument()
    expect(screen.getByText('Tomar Control')).toBeInTheDocument()
  })

  it('handles takeover mutation correctly', async () => {
    useAuthStore.setState({
      user: { role: { permissions: { conversations: { takeover: true } } } } as any,
      isAuthenticated: true
    })

    simpleServer.use(ENDPOINTS.conversations.byId('conv-123'), async () => ({
      status: 200,
      data: { success: true, data: mockDetail }
    }))

    let takeoverCalled = false
    simpleServer.use(ENDPOINTS.conversations.takeover('conv-123'), async () => {
      takeoverCalled = true
      return { status: 200, data: { success: true, data: {} } }
    })

    render(<ConversationDetail conversationId="conv-123" />, { wrapper: createWrapper() })

    const takeoverBtn = await screen.findByText('Tomar Control')
    fireEvent.click(takeoverBtn)

    await waitFor(() => expect(takeoverCalled).toBe(true))
  })

  it('shows message input only when status is HUMAN_TAKEOVER', async () => {
    const detailInTakeover = { ...mockDetail, status: ConversationStatus.HUMAN_TAKEOVER }
    
    simpleServer.use(ENDPOINTS.conversations.byId('conv-123'), async () => ({
      status: 200,
      data: { success: true, data: detailInTakeover }
    }))

    render(<ConversationDetail conversationId="conv-123" />, { wrapper: createWrapper() })

    expect(await screen.findByPlaceholderText('Escribe un mensaje...')).toBeInTheDocument()
    expect(screen.queryByText('El bot está manejando esta conversación.')).not.toBeInTheDocument()
  })
})
