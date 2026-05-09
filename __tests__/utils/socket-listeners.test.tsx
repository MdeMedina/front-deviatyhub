import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useConversationSocketListeners } from '@/lib/socket/hooks/use-socket-listeners'
import { socketClient } from '@/lib/socket/socket-client'
import React from 'react'

// Mocks
jest.mock('@/lib/socket/socket-client', () => ({
  socketClient: {
    on: jest.fn(),
    off: jest.fn(),
  }
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Infrastructure — Socket Listeners Hook', () => {
  it('successfully registers and unregisters socket listeners on mount/unmount', () => {
    const { unmount } = renderHook(() => useConversationSocketListeners(), { 
      wrapper: createWrapper() 
    })

    expect(socketClient.on).toHaveBeenCalledWith('conversation.message', expect.any(Function))
    expect(socketClient.on).toHaveBeenCalledWith('conversation.new', expect.any(Function))
    expect(socketClient.on).toHaveBeenCalledWith('conversation.status_changed', expect.any(Function))
    expect(socketClient.on).toHaveBeenCalledWith('conversation.action_executed', expect.any(Function))

    unmount()

    expect(socketClient.off).toHaveBeenCalledWith('conversation.message', expect.any(Function))
    expect(socketClient.off).toHaveBeenCalledWith('conversation.new', expect.any(Function))
    expect(socketClient.off).toHaveBeenCalledWith('conversation.status_changed', expect.any(Function))
    expect(socketClient.off).toHaveBeenCalledWith('conversation.action_executed', expect.any(Function))
  })

  it('invalidates queries when a message is received', () => {
    const queryClient = new QueryClient()
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')
    
    // We need to trigger the handler manually since we mocked socketClient
    let messageHandler: any
    ;(socketClient.on as jest.Mock).mockImplementation((event, cb) => {
      if (event === 'conversation.message') messageHandler = cb
    })

    const wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    renderHook(() => useConversationSocketListeners(), { wrapper })

    // Simulate event
    messageHandler({ conversation_id: 'conv-123', message: { id: 'm1' } })

    expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ 
      queryKey: ['conversation', 'conv-123'] 
    }))
    expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ 
      queryKey: ['conversations'] 
    }))
  })
})
