import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ConversationsPage from '@/app/(dashboard)/conversations/page'
import { useRouter, useSearchParams } from 'next/navigation'

// Mock de child components para aislar el layout
jest.mock('@/components/features/conversations/ConversationList', () => ({
  ConversationList: ({ onSelect, selectedId }) => (
    <div data-testid="mock-list" data-selected={selectedId}>
      <button onClick={() => onSelect('mock-456')} data-testid="mock-select-btn">
        Select Conversation
      </button>
    </div>
  )
}))

jest.mock('@/components/features/conversations/ConversationDetail', () => ({
  ConversationDetail: ({ conversationId }) => (
    <div data-testid="mock-detail" data-conversation-id={conversationId}>
      {conversationId ? `Detalle de ${conversationId}` : 'EmptyState Renderizado'}
    </div>
  )
}))

// Mock de next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

describe('ConversationsPage (Fase 4.7)', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    useRouter.mockReturnValue({ push: mockPush })
  })

  // ✅ TEST 1: Renderizado Dual Base
  it('renders both the ConversationList and ConversationDetail simultaneously', () => {
    useSearchParams.mockReturnValue(new URLSearchParams(''))
    render(<ConversationsPage />)

    expect(screen.getByTestId('mock-list')).toBeInTheDocument()
    expect(screen.getByTestId('mock-detail')).toBeInTheDocument()
  })

  // ✅ TEST 2: Propagación del Selected ID
  it('passes the id from URL search params down to both components', () => {
    useSearchParams.mockReturnValue(new URLSearchParams('?id=test-123'))
    render(<ConversationsPage />)

    const list = screen.getByTestId('mock-list')
    const detail = screen.getByTestId('mock-detail')

    expect(list).toHaveAttribute('data-selected', 'test-123')
    expect(detail).toHaveAttribute('data-conversation-id', 'test-123')
    expect(screen.getByText('Detalle de test-123')).toBeInTheDocument()
  })

  // ✅ TEST 3: Sincronización de Router al Seleccionar
  it('calls router.push with correct query param when a conversation is selected', () => {
    useSearchParams.mockReturnValue(new URLSearchParams(''))
    render(<ConversationsPage />)

    const selectBtn = screen.getByTestId('mock-select-btn')
    fireEvent.click(selectBtn)

    expect(mockPush).toHaveBeenCalledWith('/conversations?id=mock-456')
  })

  // ❌ TEST 4: Ausencia de ID (Estado por defecto)
  it('passes null to Detail component when no id is present in URL', () => {
    useSearchParams.mockReturnValue(new URLSearchParams(''))
    render(<ConversationsPage />)

    const detail = screen.getByTestId('mock-detail')
    // when null or undefined is converted to string in attribute, usually it becomes "null" or absent
    // Our mock renders 'EmptyState Renderizado' if falsy
    expect(screen.getByText('EmptyState Renderizado')).toBeInTheDocument()
  })

  // ❌ TEST 5: Cambio de ID dinámico
  it('re-renders correctly when search params change dynamically', () => {
    const { rerender } = render(<ConversationsPage />)

    // Initially empty
    useSearchParams.mockReturnValue(new URLSearchParams(''))
    rerender(<ConversationsPage />)
    expect(screen.getByText('EmptyState Renderizado')).toBeInTheDocument()

    // Dynamically change to 999
    useSearchParams.mockReturnValue(new URLSearchParams('?id=999'))
    rerender(<ConversationsPage />)
    expect(screen.getByText('Detalle de 999')).toBeInTheDocument()
  })
})
