import { io, Socket } from 'socket.io-client'
import { SocketEvent } from '@/lib/types'

class SocketClient {
  private socket: Socket | null = null
  private baseUrl: string = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || ''

  /**
   * Initializes the socket connection with the provided JWT token.
   * If already connected, it will disconnect and reconnect with the new token.
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      this.socket.disconnect()
    }

    this.socket = io(this.baseUrl, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ['websocket'], // Prefer websocket for performance
    })

    this.socket.on('connect', () => {
      console.log('Socket connected successfully')
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message)
    })
  }

  /**
   * Disconnects the socket cleanly.
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  /**
   * Registers a listener for a specific typed event.
   */
  on<T>(event: SocketEvent, handler: (data: T) => void): void {
    if (!this.socket) {
      console.warn('Attempting to register listener without active connection')
      return
    }
    this.socket.on(event, handler)
  }

  /**
   * Removes a listener for a specific event.
   */
  off(event: SocketEvent, handler: Function): void {
    if (this.socket) {
      this.socket.off(event, handler as any)
    }
  }

  /**
   * Returns true if the socket is currently connected.
   */
  isConnected(): boolean {
    return this.socket?.connected || false
  }

  /**
   * Utility to get the raw socket instance if needed (advanced usage).
   */
  getRawSocket(): Socket | null {
    return this.socket
  }
}

// Export as a singleton
export const socketClient = new SocketClient()
