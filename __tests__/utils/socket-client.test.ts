jest.unmock('@/lib/socket/socket-client')
import { socketClient } from '@/lib/socket/socket-client'
import { useAuthStore } from '@/lib/stores/auth.store'
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
    active: true,
  }
  return {
    io: jest.fn(() => mSocket),
  }
})

/** Ejecuta la función auth del handshake como lo haría socket.io. */
const handshake = (): any => {
  const opts = (io as jest.Mock).mock.calls.at(-1)[1]
  let datos: any
  opts.auth((d: any) => { datos = d })
  return datos
}

/** Handler que el cliente registró en el socket para un evento interno. */
const handlerDe = (socket: any, evento: string) =>
  socket.on.mock.calls.find(([e]: [string]) => e === evento)?.[1]

describe('Infrastructure — Socket Client (Singleton)', () => {
  const mockIo = io as jest.MockedFunction<typeof io>
  let mockSocket: any

  beforeEach(() => {
    socketClient.disconnect()
    jest.clearAllMocks()
    mockSocket = mockIo()
    mockSocket.connected = false
    mockSocket.active = true
    mockIo.mockClear()
    mockIo.mockReturnValue(mockSocket)
    useAuthStore.setState({
      access_token: 'token-1',
      actingClinic: null,
      user: { platform_admin: false } as any,
    })
  })

  it('manda en el handshake el token vigente de la sesión', () => {
    socketClient.connect()

    expect(mockIo).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ auth: expect.any(Function), reconnection: true })
    )
    expect(handshake()).toEqual({ token: 'token-1' })

    // Cada intento (también las reconexiones automáticas) lee el token de nuevo.
    useAuthStore.setState({ access_token: 'token-2' })
    expect(handshake()).toEqual({ token: 'token-2' })
  })

  it('manda la clínica actuante solo si es del equipo de la plataforma', () => {
    useAuthStore.setState({ actingClinic: { id: 'c-1', name: 'Clínica' } })
    socketClient.connect()
    expect(handshake()).toEqual({ token: 'token-1' })

    useAuthStore.setState({ user: { platform_admin: true } as any })
    expect(handshake()).toEqual({ token: 'token-1', actAsClinic: 'c-1' })
  })

  it('engancha los handlers registrados antes de conectar', () => {
    const handler = jest.fn()
    socketClient.on('conversation.message', handler)
    socketClient.connect()

    expect(mockSocket.on).toHaveBeenCalledWith('conversation.message', handler)
    socketClient.off('conversation.message', handler)
  })

  it('successfully registers and triggers event handlers', () => {
    const handler = jest.fn()
    socketClient.connect()

    socketClient.on('conversation.message', handler)

    expect(mockSocket.on).toHaveBeenCalledWith('conversation.message', handler)
    socketClient.off('conversation.message', handler)
  })

  it('successfully unsubscribes from events when requested', () => {
    const handler = jest.fn()
    socketClient.connect()

    socketClient.off('conversation.message', handler)

    expect(mockSocket.off).toHaveBeenCalledWith('conversation.message', handler)
  })

  it('correctly reports the connection status', () => {
    socketClient.connect()

    // Default mock is not connected
    expect(socketClient.isConnected()).toBe(false)

    // Simulate connection
    mockSocket.connected = true
    expect(socketClient.isConnected()).toBe(true)
  })

  it('reconecta el mismo socket cuando cambia el token, y no si no cambia', () => {
    socketClient.connect()
    handshake()
    mockSocket.connected = true

    socketClient.refresh()
    expect(mockSocket.disconnect).not.toHaveBeenCalled()

    useAuthStore.setState({ access_token: 'token-2' })
    socketClient.refresh()
    expect(mockSocket.disconnect).toHaveBeenCalledTimes(1)
    expect(mockSocket.connect).toHaveBeenCalledTimes(1)
    // Sin recrear el socket: los listeners siguen enganchados.
    expect(mockIo).toHaveBeenCalledTimes(1)
  })

  it('vuelve a intentar cuando el servidor corta el socket', () => {
    jest.useFakeTimers()
    try {
      socketClient.connect()
      mockSocket.active = false
      handlerDe(mockSocket, 'disconnect')('io server disconnect')

      expect(mockSocket.connect).not.toHaveBeenCalled()
      jest.advanceTimersByTime(2000)
      expect(mockSocket.connect).toHaveBeenCalledTimes(1)
    } finally {
      jest.useRealTimers()
    }
  })
})
