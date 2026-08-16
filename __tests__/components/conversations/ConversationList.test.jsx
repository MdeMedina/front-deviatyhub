import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConversationList } from '@/components/features/conversations/ConversationList'
import { useConversations } from '@/lib/api/hooks/use-conversations'
import { useConversationSocketListeners } from '@/lib/socket/hooks/use-socket-listeners'
import { makeConversation } from '@/__mocks__/factories'

// Mock hooks
jest.mock('@/lib/api/hooks/use-conversations')
jest.mock('@/lib/socket/hooks/use-socket-listeners')

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

describe('ConversationList Component (Fase 4.5)', () => {
  const mockOnSelect = jest.fn()
  const mockRefetch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    useConversationSocketListeners.mockReturnValue(undefined)
  })

  // ✅ TEST 1: Renderiza Empty State
  it('renders EmptyState when no conversations are found', () => {
    useConversations.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
    })

    render(<ConversationList onSelect={mockOnSelect} />)

    expect(screen.getByText(/No hay conversaciones/i)).toBeInTheDocument()
  })

  // ✅ TEST 2: Aplicación de Filtros
  it('updates status filter and triggers a new fetch', () => {
    useConversations.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
    })

    render(<ConversationList onSelect={mockOnSelect} />)

    const humanTab = screen.getByText(/En curso/i)
    fireEvent.click(humanTab)

    expect(useConversations).toHaveBeenLastCalledWith({ status: 'HUMAN_TAKEOVER' })
  })

  // ✅ TEST 3: Renderizado de Elementos Exitosos
  it('renders list with correct data and badges', () => {
    const mockConvs = [
      makeConversation({ id: '1', contact: { name: 'Miguel Medina' }, status: 'OPEN' }),
      makeConversation({ id: '2', contact: { name: 'Ana Lopez' }, status: 'HUMAN_TAKEOVER' }),
    ]

    useConversations.mockReturnValue({
      data: { data: mockConvs },
      isLoading: false,
      isError: false,
    })

    render(<ConversationList onSelect={mockOnSelect} />)

    expect(screen.getByText('Miguel Medina')).toBeInTheDocument()
    expect(screen.getByText('Ana Lopez')).toBeInTheDocument()
    expect(screen.getByText('IA')).toBeInTheDocument()
    expect(screen.getByText('Humano')).toBeInTheDocument()
  })

  // ❌ TEST 4: Estado de Carga Initial
  it('displays loading spinner', () => {
    useConversations.mockReturnValue({
      isLoading: true,
      isError: false,
    })

    render(<ConversationList onSelect={mockOnSelect} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  // ❌ TEST 5: Estado de Error de Red
  it('shows error state and retry logic', () => {
    useConversations.mockReturnValue({
      isError: true,
      refetch: mockRefetch,
      isLoading: false,
    })

    render(<ConversationList onSelect={mockOnSelect} />)

    expect(screen.getByText(/Error de conexión/i)).toBeInTheDocument()
    fireEvent.click(screen.getByText(/Reintentar/i))
    expect(mockRefetch).toHaveBeenCalled()
  })
})
