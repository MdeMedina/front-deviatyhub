import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, fireEvent, act, within } from '@testing-library/react'
import { SimulatorChat } from '@/components/features/simulator/SimulatorChat'
import { useSimulator } from '@/lib/api/hooks/use-simulator'

// Mock useSimulator hook
jest.mock('@/lib/api/hooks/use-simulator')

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <div {...props} ref={ref}>
        {children}
      </div>
    )),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

const PLACEHOLDER = 'Escribe como si fueras un paciente...'

describe('SimulatorChat Component Organism — Chat UI & Experience', () => {
  const mockMutate = jest.fn()
  const mockResetSession = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSimulator as jest.Mock).mockReturnValue({
      sendMessage: {
        mutate: mockMutate,
        isPending: false,
        isError: false,
        error: null,
      },
      sessionId: 'sess_8fa21c',
      resetSession: mockResetSession,
    })
  })

  // ==========================================
  // ✅ TEST 1: Renderizado y alineación de mensajes
  // ==========================================
  it('renders user and agent messages with correct visual alignment', () => {
    mockMutate.mockImplementation((message: string, options: any) => {
      if (options && options.onSuccess) {
        options.onSuccess({
          session_id: 'session-123',
          response: 'Hola, soy el asistente virtual.',
          tools_used: [],
        })
      }
    })

    render(<SimulatorChat />)

    // Initially shows EmptyState and suggestions
    expect(screen.getByText('Inicia una simulación')).toBeInTheDocument()
    // Session id microlabel in header
    expect(screen.getByText('sess_8fa21c')).toBeInTheDocument()

    const input = screen.getByPlaceholderText(PLACEHOLDER)
    fireEvent.change(input, { target: { value: 'Hola bot' } })

    const sendBtn = screen.getByTestId('chat-send-btn')
    fireEvent.click(sendBtn)

    expect(mockMutate).toHaveBeenCalledWith('Hola bot', expect.any(Object))

    const userMsg = screen.getByTestId('message-user')
    const agentMsg = screen.getByTestId('message-agent')

    expect(userMsg).toHaveTextContent('Hola bot')
    expect(agentMsg).toHaveTextContent('Hola, soy el asistente virtual.')

    // Alignment via inline flex alignment (Dentral: patient left, IA right)
    expect(userMsg).toHaveStyle({ alignItems: 'flex-start' })
    expect(agentMsg).toHaveStyle({ alignItems: 'flex-end' })
  })

  // ==========================================
  // ✅ TEST 2: Herramientas invocadas se muestran como badges bajo la respuesta
  // ==========================================
  it('shows tools_used as always-visible badges under the agent message', () => {
    mockMutate.mockImplementation((message: string, options: any) => {
      if (options && options.onSuccess) {
        options.onSuccess({
          session_id: 'session-123',
          response: 'He revisado el calendario.',
          tools_used: ['check_availability', 'book_appointment'],
        })
      }
    })

    render(<SimulatorChat />)

    const input = screen.getByPlaceholderText(PLACEHOLDER)
    fireEvent.change(input, { target: { value: 'Agendar cita' } })
    fireEvent.click(screen.getByTestId('chat-send-btn'))

    // Badges are shown immediately (no toggle), scoped to the message
    const badges = screen.getByTestId('tools-badges')
    expect(badges).toBeInTheDocument()
    expect(within(badges).getByText('check_availability')).toBeInTheDocument()
    expect(within(badges).getByText('book_appointment')).toBeInTheDocument()

    // Right column "Herramientas invocadas" reflects the per-tool counts
    expect(screen.getByText('Herramientas invocadas')).toBeInTheDocument()
    expect(screen.getByText('Contexto de la sesión')).toBeInTheDocument()
  })

  // ==========================================
  // ✅ TEST 3: Reinicio de sesión (resetNonce desde la cabecera de página)
  // ==========================================
  it('clears messages and calls resetSession when resetNonce changes', () => {
    mockMutate.mockImplementation((message: string, options: any) => {
      if (options && options.onSuccess) {
        options.onSuccess({
          session_id: 'session-123',
          response: 'Respuesta',
          tools_used: [],
        })
      }
    })

    const { rerender } = render(<SimulatorChat resetNonce={0} />)

    const input = screen.getByPlaceholderText(PLACEHOLDER)
    fireEvent.change(input, { target: { value: 'Mensaje de prueba' } })
    fireEvent.click(screen.getByTestId('chat-send-btn'))

    expect(screen.getByTestId('message-user')).toBeInTheDocument()
    expect(screen.getByTestId('message-agent')).toBeInTheDocument()

    // Simulate the page-header "Reiniciar sesión" bumping the nonce
    rerender(<SimulatorChat resetNonce={1} />)

    expect(mockResetSession).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('message-user')).not.toBeInTheDocument()
    expect(screen.queryByTestId('message-agent')).not.toBeInTheDocument()
    expect(screen.getByText('Inicia una simulación')).toBeInTheDocument()
  })

  // ==========================================
  // ❌ TEST 4: Estado de carga e input deshabilitado
  // ==========================================
  it('disables input controls and renders typing indicator when mutation is pending', () => {
    ;(useSimulator as jest.Mock).mockReturnValue({
      sendMessage: {
        mutate: mockMutate,
        isPending: true,
        isError: false,
        error: null,
      },
      sessionId: 'session-123',
      resetSession: mockResetSession,
    })

    render(<SimulatorChat />)

    const input = screen.getByPlaceholderText(PLACEHOLDER)
    const sendBtn = screen.getByTestId('chat-send-btn')

    expect(input).toBeDisabled()
    expect(sendBtn).toBeDisabled()

    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
  })

  // ==========================================
  // ❌ TEST 5: Prevención de auto-scroll si el usuario subió el scroll
  // ==========================================
  it('should not scroll to bottom on new agent message if the user has scrolled up', () => {
    let successCallback: any = null
    mockMutate.mockImplementation((message: string, options: any) => {
      successCallback = options.onSuccess
    })

    render(<SimulatorChat />)

    const container = screen.getByTestId('chat-messages')

    Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true })
    Object.defineProperty(container, 'clientHeight', { value: 400, configurable: true })
    Object.defineProperty(container, 'scrollTop', { value: 0, configurable: true, writable: true })

    const input = screen.getByPlaceholderText(PLACEHOLDER)
    fireEvent.change(input, { target: { value: 'Pregunta' } })
    fireEvent.click(screen.getByTestId('chat-send-btn'))

    expect(container.scrollTop).toBe(1000)

    Object.defineProperty(container, 'scrollTop', { value: 100, configurable: true, writable: true })

    act(() => {
      successCallback({
        session_id: 'session-123',
        response: 'Respuesta del bot',
        tools_used: [],
      })
    })

    expect(container.scrollTop).toBe(100)

    Object.defineProperty(container, 'scrollTop', { value: 590, configurable: true, writable: true })

    fireEvent.change(input, { target: { value: 'Otra pregunta' } })
    fireEvent.click(screen.getByTestId('chat-send-btn'))

    expect(container.scrollTop).toBe(1000)

    Object.defineProperty(container, 'scrollTop', { value: 590, configurable: true, writable: true })

    act(() => {
      successCallback({
        session_id: 'session-123',
        response: 'Nueva respuesta del bot',
        tools_used: [],
      })
    })

    expect(container.scrollTop).toBe(1000)
  })
})
