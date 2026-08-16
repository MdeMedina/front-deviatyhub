import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConversationDetail } from '@/components/features/conversations/ConversationDetail'
import { useConversationDetail, useTakeover } from '@/lib/api/hooks/use-conversations'
import { useAuthStore } from '@/lib/stores/auth.store'
import { makeConversation, makeMessage } from '@/__mocks__/factories'

// Mock hooks
jest.mock('@/lib/api/hooks/use-conversations')
jest.mock('@/lib/stores/auth.store')

describe('ConversationDetail Component (Fase 4.6)', () => {
  const mockMutateTakeover = jest.fn()
  const mockMutateRelease = jest.fn()
  const mockMutateSendMessage = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    useTakeover.mockReturnValue({
      takeover: { mutate: mockMutateTakeover, isPending: false },
      release: { mutate: mockMutateRelease, isPending: false },
      sendMessage: { mutate: mockMutateSendMessage, isPending: false },
    })

    useAuthStore.mockReturnValue({
      hasPermission: () => true // Por defecto tiene permisos
    })
  })

  // ✅ TEST 1: Control de Toma de Mando
  it('shows Takeover button when OPEN and executes mutation on click', () => {
    const mockConv = makeConversation({ status: 'OPEN' })
    useConversationDetail.mockReturnValue({
      data: mockConv,
      isLoading: false,
      isError: false,
    })

    render(<ConversationDetail conversationId={mockConv.id} />)

    const btn = screen.getByRole('button', { name: /Tomar Control Manual/i })
    expect(btn).toBeInTheDocument()

    fireEvent.click(btn)
    expect(mockMutateTakeover).toHaveBeenCalled()
  })

  // ✅ TEST 2: Habilitación de Envío Manual
  it('enables chat input and send button only when HUMAN_TAKEOVER', () => {
    const mockConv = makeConversation({ status: 'HUMAN_TAKEOVER' })
    useConversationDetail.mockReturnValue({
      data: mockConv,
      isLoading: false,
      isError: false,
    })

    render(<ConversationDetail conversationId={mockConv.id} />)

    const input = screen.getByPlaceholderText(/Escribe un mensaje/i)
    const sendBtn = screen.getByRole('button', { name: /Enviar/i })

    expect(input).toBeInTheDocument()
    expect(sendBtn).toBeDisabled() // Input starts empty

    fireEvent.change(input, { target: { value: 'Hola paciente' } })
    expect(sendBtn).not.toBeDisabled()

    fireEvent.submit(sendBtn)
    expect(mockMutateSendMessage).toHaveBeenCalledWith('Hola paciente', expect.any(Object))
  })

  // ✅ TEST 3: Visibilidad Restringida por Permisos
  it('hides Takeover button if user lacks conversations.takeover permission', () => {
    const mockConv = makeConversation({ status: 'OPEN' })
    useConversationDetail.mockReturnValue({
      data: mockConv,
      isLoading: false,
      isError: false,
    })

    // Remove permission
    useAuthStore.mockReturnValue({
      hasPermission: () => false
    })

    render(<ConversationDetail conversationId={mockConv.id} />)

    // Ensure AI banner is there, but button is NOT
    expect(screen.getByText(/El Agente de IA está atendiendo/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Tomar Control Manual/i })).not.toBeInTheDocument()
  })

  // ❌ TEST 4: Validación de Input Vacío
  it('keeps send button disabled if input is empty or just whitespace', () => {
    const mockConv = makeConversation({ status: 'HUMAN_TAKEOVER' })
    useConversationDetail.mockReturnValue({
      data: mockConv,
      isLoading: false,
      isError: false,
    })

    render(<ConversationDetail conversationId={mockConv.id} />)

    const input = screen.getByPlaceholderText(/Escribe un mensaje/i)
    const sendBtn = screen.getByRole('button', { name: /Enviar/i })

    fireEvent.change(input, { target: { value: '    ' } }) // Only spaces
    expect(sendBtn).toBeDisabled()
  })

  // ❌ TEST 5: Estado de Carga durante la Liberación
  it('disables release button and shows loading state when release is pending', () => {
    const mockConv = makeConversation({ status: 'HUMAN_TAKEOVER' })
    useConversationDetail.mockReturnValue({
      data: mockConv,
      isLoading: false,
      isError: false,
    })

    // Simulate pending release
    useTakeover.mockReturnValue({
      takeover: { mutate: mockMutateTakeover, isPending: false },
      release: { mutate: mockMutateRelease, isPending: true }, // <--- pending
      sendMessage: { mutate: mockMutateSendMessage, isPending: false },
    })

    render(<ConversationDetail conversationId={mockConv.id} />)

    const releaseBtn = screen.getByRole('button', { name: /Procesando/i }) // Because of Button loading prop
    expect(releaseBtn).toBeDisabled()
    
    // Also input should be disabled
    const input = screen.getByPlaceholderText(/Escribe un mensaje/i)
    expect(input).toBeDisabled()
  })
})
