jest.unmock('@/lib/socket/socket-client')
import { socketClient } from '@/lib/socket/socket-client'
import { io } from 'socket.io-client'

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const mSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
  }
  return {
    io: jest.fn(() => mSocket),
  }
})

describe('Infrastructure — Socket Client (Singleton)', () => {
  const mockIo = io as jest.MockedFunction<typeof io>
  let mockSocket: any

  beforeEach(() => {
    socketClient.disconnect()
    jest.clearAllMocks()
    mockSocket = mockIo()
    mockIo.mockReturnValue(mockSocket)
  })

  it('successfully initializes connection with the provided JWT token', () => {
    socketClient.connect('valid-jwt-token')

    expect(mockIo).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        auth: { token: 'valid-jwt-token' },
        reconnection: true
      })
    )
  })

  it('successfully registers and triggers event handlers', () => {
    const handler = jest.fn()
    socketClient.connect('token')
    
    socketClient.on('conversation.message', handler)
    
    expect(mockSocket.on).toHaveBeenCalledWith('conversation.message', handler)
  })

  it('successfully unsubscribes from events when requested', () => {
    const handler = jest.fn()
    socketClient.connect('token')
    
    socketClient.off('conversation.message', handler)
    
    expect(mockSocket.off).toHaveBeenCalledWith('conversation.message', handler)
  })

  it('correctly reports the connection status', () => {
    socketClient.connect('token')
    
    // Default mock is not connected
    expect(socketClient.isConnected()).toBe(false)
    
    // Simulate connection
    mockSocket.connected = true
    expect(socketClient.isConnected()).toBe(true)
  })

  it('disconnects the existing socket before reconnecting with a new token', () => {
    socketClient.connect('token-1')
    mockSocket.connected = true
    
    socketClient.connect('token-2')
    
    expect(mockSocket.disconnect).toHaveBeenCalledTimes(1)
    expect(mockIo).toHaveBeenCalledTimes(3) // Once in beforeEach + 2 connect calls
  })
})
