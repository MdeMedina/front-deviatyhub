import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AppointmentModal } from '@/components/agenda/AppointmentModal'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { simpleServer } from '@/__mocks__/simple-server'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { AppointmentStatus, AppointmentSource, Channel } from '@/lib/types'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Agenda Module — AppointmentModal', () => {
  beforeAll(() => simpleServer.listen())
  afterEach(() => simpleServer.resetHandlers())
  afterAll(() => simpleServer.close())

  const mockDetail = {
    id: 'apt-1',
    contact_name: 'John Doe',
    contact_id: 'c1',
    treatment: { id: 't1', name: 'Limpieza' },
    doctor: { id: 'd1', name: 'Dr. Smith' },
    scheduled_at: '2026-05-10T10:00:00Z',
    duration_min: 30,
    status: AppointmentStatus.PENDING,
    source: AppointmentSource.HUMAN,
    channel: Channel.WHATSAPP,
    conversation_id: 'conv-123',
    notes: '',
    history: [
      { id: 'h1', event: 'Cita creada', performed_by: 'IA', channel: 'WHATSAPP', created_at: new Date().toISOString() }
    ]
  }

  it('renders loading state initially', () => {
    render(<AppointmentModal id="apt-1" isOpen={true} onClose={() => {}} />, { wrapper: createWrapper() })
    expect(screen.getByText('Cargando información')).toBeInTheDocument()
  })

  it('renders full details after fetching', async () => {
    simpleServer.use(ENDPOINTS.agenda.byId('apt-1'), async () => ({
      status: 200,
      data: { success: true, data: mockDetail }
    }))

    render(<AppointmentModal id="apt-1" isOpen={true} onClose={() => {}} />, { wrapper: createWrapper() })

    expect(await screen.findByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Limpieza')).toBeInTheDocument()
    expect(screen.getByText('conv-123')).toBeInTheDocument()
    expect(screen.getByText('Cita creada')).toBeInTheDocument()
  })

  it('handles status update correctly', async () => {
    simpleServer.use(ENDPOINTS.agenda.byId('apt-1'), async () => ({
      status: 200,
      data: { success: true, data: mockDetail }
    }))

    let statusCalled = false
    simpleServer.use(ENDPOINTS.agenda.status('apt-1'), async () => {
      statusCalled = true
      return { status: 200, data: { success: true, data: {} } }
    })

    render(<AppointmentModal id="apt-1" isOpen={true} onClose={() => {}} />, { wrapper: createWrapper() })

    const confirmBtn = await screen.findByText('Confirmar Cita')
    fireEvent.click(confirmBtn)

    await waitFor(() => expect(statusCalled).toBe(true))
  })
})
