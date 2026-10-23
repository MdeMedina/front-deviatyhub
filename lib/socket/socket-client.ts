import { io, Socket } from 'socket.io-client'
import { SocketEvent } from '@/lib/types'
import { useAuthStore } from '@/lib/stores/auth.store'

type Handler = (data: unknown) => void

/** Lo que va en el handshake: el servidor solo deja entrar con sesión. */
interface SocketAuth {
  token: string | null
  /** Clínica en la que trabaja un superusuario de la plataforma. */
  actAsClinic?: string
}

/** Se lee en cada intento de conexión: así viaja siempre el token vigente. */
function leerAuth(): SocketAuth {
  const { access_token, actingClinic, user } = useAuthStore.getState()
  return {
    token: access_token,
    ...(actingClinic && user?.platform_admin ? { actAsClinic: actingClinic.id } : {}),
  }
}

class SocketClient {
  private socket: Socket | null = null
  private baseUrl: string = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || ''
  private connected = false
  private statusListeners = new Set<(connected: boolean) => void>()
  /**
   * Los handlers se guardan aquí y se enganchan a cada socket nuevo. Antes se
   * colgaban del socket del momento: si se registraban antes de conectar, o
   * el socket se recreaba, el panel dejaba de recibir eventos sin avisar.
   */
  private handlers = new Map<string, Set<Handler>>()
  /** Credenciales del último handshake, para saber si hay que reconectar. */
  private authUsada: string | null = null
  private reintento: ReturnType<typeof setTimeout> | null = null
  private intentos = 0

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
   * Abre la conexión con la sesión del auth store. El token (y la clínica en
   * la que trabaja un superusuario) se leen en cada intento, también en las
   * reconexiones automáticas.
   */
  connect(): void {
    if (this.socket) {
      this.refresh()
      return
    }

    this.socket = io(this.baseUrl, {
      auth: (cb) => {
        const auth = leerAuth()
        this.authUsada = JSON.stringify(auth)
        cb(auth)
      },
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

    this.handlers.forEach((set, event) => set.forEach((h) => this.socket!.on(event, h)))

    this.socket.on('connect', () => {
      this.setStatus(true)
    })

    this.socket.on('disconnect', (reason) => {
      this.setStatus(false)
      // El servidor corta el socket cuando vence el token o si no lo acepta, y
      // en ese caso socket.io no reintenta solo. Se reintenta con lo que haya
      // entonces en la sesión (el panel renueva el token al vencer).
      if (reason === 'io server disconnect') this.programarReintento()
    })

    this.socket.on('connect_error', (error) => {
      this.setStatus(false)
      console.error('Socket connection error:', error.message)
    })
  }

  /**
   * Vuelve a conectar si cambió la sesión (token renovado o otra clínica)
   * desde el último handshake, o si el servidor había cortado el socket.
   */
  refresh(): void {
    const socket = this.socket
    if (!socket) return
    // La espera entre reintentos no se reinicia al conectar: si el servidor
    // rechaza el token, conecta y corta enseguida. Se reinicia con sesión nueva.
    this.intentos = 0
    if (socket.connected) {
      if (JSON.stringify(leerAuth()) === this.authUsada) return
      socket.disconnect()
      socket.connect()
      return
    }
    // Reintentando por su cuenta: el próximo intento ya lee la sesión nueva.
    if (socket.active) return
    socket.connect()
  }

  private programarReintento() {
    if (this.reintento) clearTimeout(this.reintento)
    const espera = Math.min(30000, 2000 * 2 ** this.intentos)
    this.intentos++
    this.reintento = setTimeout(() => {
      this.reintento = null
      if (this.socket && !this.socket.connected && !this.socket.active) this.socket.connect()
    }, espera)
  }

  /**
   * Disconnects the socket cleanly.
   */
  disconnect(): void {
    if (this.reintento) clearTimeout(this.reintento)
    this.reintento = null
    this.intentos = 0
    this.authUsada = null
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
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event)!.add(handler as Handler)
    this.socket?.on(event, handler as Handler)
  }

  /**
   * Removes a listener for a specific event.
   */
  off(event: SocketEvent, handler: Function): void {
    this.handlers.get(event)?.delete(handler as Handler)
    this.socket?.off(event, handler as any)
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
