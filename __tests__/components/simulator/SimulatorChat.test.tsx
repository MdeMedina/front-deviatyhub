import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, fireEvent, act } from '@testing-library/react'
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
      sessionId: null,
      resetSession: mockResetSession,
    })
  })

  // ==========================================
  // ✅ TEST 1: Renderizado y alineación de mensajes
  // ==========================================
  it('renders user and agent messages with correct visual alignment', async () => {
    // Implement mutation success callback trigger to populate chat
    mockMutate.mockImplementation((message: string, options: any) => {
      if (options && options.onSuccess) {
        options.onSuccess({
          session_id: 'session-123',
          response: 'Hola, soy el asistente virtual.',
          tools_used: []
        })
      }
    })

    render(<SimulatorChat />)

    // Initially shows EmptyState and suggestions
    expect(screen.getByText('Inicia una simulación')).toBeInTheDocument()

    // Type a message
    const input = screen.getByPlaceholderText('Escribe un mensaje de prueba para el agente...')
    fireEvent.change(input, { target: { value: 'Hola bot' } })
    
    // Submit the form
    const sendBtn = screen.getByTestId('chat-send-btn')
    fireEvent.click(sendBtn)

    // Check message calling mutate
    expect(mockMutate).toHaveBeenCalledWith('Hola bot', expect.any(Object))

    // Messages should render
    const userMsg = screen.getByTestId('message-user')
    const agentMsg = screen.getByTestId('message-agent')

    expect(userMsg).toHaveTextContent('Hola bot')
    expect(agentMsg).toHaveTextContent('Hola, soy el asistente virtual.')

    // Verify alignment class
    expect(userMsg).toHaveClass('flex-row-reverse')
    expect(agentMsg).toHaveClass('flex-row')
  })

  // ==========================================
  // ✅ TEST 2: Panel de herramientas colapsable (tools_used)
  // ==========================================
  it('toggles the visibility of the tools panel when clicked', () => {
    mockMutate.mockImplementation((message: string, options: any) => {
      if (options && options.onSuccess) {
        options.onSuccess({
          session_id: 'session-123',
          response: 'He revisado el calendario.',
          tools_used: ['check_availability', 'book_appointment']
        })
      }
    })

    render(<SimulatorChat />)

    // Send a message to get tools in response
    const input = screen.getByPlaceholderText('Escribe un mensaje de prueba para el agente...')
    fireEvent.change(input, { target: { value: 'Agendar cita' } })
    fireEvent.click(screen.getByTestId('chat-send-btn'))

    // The agent message should contain the toggle button
    const toggleBtn = screen.getByTestId('btn-toggle-tools')
    expect(toggleBtn).toBeInTheDocument()
    expect(screen.getByText('Herramientas utilizadas (2)')).toBeInTheDocument()

    // Tools list should not be in the document initially
    expect(screen.queryByTestId('tools-list')).not.toBeInTheDocument()

    // Click to expand
    fireEvent.click(toggleBtn)

    // Tools list should be visible now
    const toolsList = screen.getByTestId('tools-list')
    expect(toolsList).toBeInTheDocument()
    expect(screen.getByText('check_availability')).toBeInTheDocument()
    expect(screen.getByText('book_appointment')).toBeInTheDocument()

    // Click to collapse
    fireEvent.click(toggleBtn)
    expect(screen.queryByTestId('tools-list')).not.toBeInTheDocument()
  })

  // ==========================================
  // ✅ TEST 3: Acción de Reinicio ("Nueva conversación")
  // ==========================================
  it('calls resetSession and clears messages when Nueva conversación is clicked', () => {
    mockMutate.mockImplementation((message: string, options: any) => {
      if (options && options.onSuccess) {
        options.onSuccess({
          session_id: 'session-123',
          response: 'Respuesta',
          tools_used: []
        })
      }
    })

    render(<SimulatorChat />)

    // Send a message
    const input = screen.getByPlaceholderText('Escribe un mensaje de prueba para el agente...')
    fireEvent.change(input, { target: { value: 'Mensaje de prueba' } })
    fireEvent.click(screen.getByTestId('chat-send-btn'))

    // Verify messages list is populated
    expect(screen.getByTestId('message-user')).toBeInTheDocument()
    expect(screen.getByTestId('message-agent')).toBeInTheDocument()

    // Click new conversation
    const newConvBtn = screen.getByTestId('btn-new-conversation')
    fireEvent.click(newConvBtn)

    // verify resetSession called
    expect(mockResetSession).toHaveBeenCalledTimes(1)

    // Screen should return to empty state
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

    // Verify inputs are disabled
    const input = screen.getByPlaceholderText('Escribe un mensaje de prueba para el agente...')
    const sendBtn = screen.getByTestId('chat-send-btn')

    expect(input).toBeDisabled()
    expect(sendBtn).toBeDisabled()

    // Verify typing indicator is rendered
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
  })

  // ==========================================
  // ❌ TEST 5: Prevención de auto-scroll si el usuario subió el scroll
  // ==========================================
  it('should not scroll to bottom on new agent message if the user has scrolled up', () => {
    // Let's implement mutate success
    let successCallback: any = null
    mockMutate.mockImplementation((message: string, options: any) => {
      successCallback = options.onSuccess
    })

    render(<SimulatorChat />)

    // Get the messages container element
    const container = screen.getByTestId('chat-messages')

    // Mock scrolling properties using standard defineProperty
    Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true })
    Object.defineProperty(container, 'clientHeight', { value: 400, configurable: true })
    Object.defineProperty(container, 'scrollTop', { value: 0, configurable: true, writable: true })
    
    // User types and sends message
    const input = screen.getByPlaceholderText('Escribe un mensaje de prueba para el agente...')
    fireEvent.change(input, { target: { value: 'Pregunta' } })
    fireEvent.click(screen.getByTestId('chat-send-btn'))

    // The containerscrollTop should be at scrollHeight because userJustSent is active
    expect(container.scrollTop).toBe(1000)

    // Now, mock that the user scrolled up (offset is 1000 - 400 - 100 = 500px, which is > 250px)
    Object.defineProperty(container, 'scrollTop', { value: 100, configurable: true, writable: true })

    // Simulate Agent message arriving
    act(() => {
      successCallback({
        session_id: 'session-123',
        response: 'Respuesta del bot',
        tools_used: []
      })
    })

    // container.scrollTop should NOT change from 100 because user is scrolled up
    expect(container.scrollTop).toBe(100)

    // Now, test that if the user is near the bottom (e.g. scrollTop = 590, offset = 1000 - 400 - 590 = 10px <= 250px)
    Object.defineProperty(container, 'scrollTop', { value: 590, configurable: true, writable: true })

    // Reset successCallback to see what happens
    fireEvent.change(input, { target: { value: 'Otra pregunta' } })
    fireEvent.click(screen.getByTestId('chat-send-btn'))

    // scroll up offset is set back to bottom due to userJustSent
    expect(container.scrollTop).toBe(1000)

    // Set scrollTop to 590 again before bot responds
    Object.defineProperty(container, 'scrollTop', { value: 590, configurable: true, writable: true })

    // Simulate bot response
    act(() => {
      successCallback({
        session_id: 'session-123',
        response: 'Nueva respuesta del bot',
        tools_used: []
      })
    })

    // Since they were near bottom (offset <= 250px), it should scroll to bottom
    expect(container.scrollTop).toBe(1000)
  })
})
