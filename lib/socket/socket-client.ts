import { io, Socket } from 'socket.io-client'
import { SocketEvent } from '@/lib/types'

class SocketClient {
  private socket: Socket | null = null
  private baseUrl: string = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || ''
  private connected = false
  private statusListeners = new Set<(connected: boolean) => void>()

  private setStatus(connected: boolean) {
    if (this.connected === connected) return
    this.connected = connected
    this.statusListeners.forEach((cb) => cb(connected))
  }

  /** Avisa cuando la conexión cae o vuelve. Devuelve la función para desuscribirse. */
  onStatusChange(cb: (connected: boolean) => void): () => void {
    this.statusListeners.add(cb)
    cb(this.connected)
    return () => this.statusListeners.delete(cb)
  }

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
      // Reintentos sin límite: con 5 intentos el socket se rendía a los pocos
      // segundos, así que cualquier reinicio del backend (un despliegue tarda
      // minutos) dejaba la pestaña muda hasta recargarla a mano.
      reconnectionAttempts: Infinity,
      reconnectionDelayMax: 10000,
      // Con solo websocket, si el upgrade falla no queda alternativa.
      transports: ['websocket', 'polling'],
    })

    this.socket.on('connect', () => {
      this.setStatus(true)
    })

    this.socket.on('disconnect', () => {
      this.setStatus(false)
    })

    this.socket.on('connect_error', (error) => {
      this.setStatus(false)
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
    this.setStatus(false)
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
    return this.socket?.connected ?? this.connected
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
