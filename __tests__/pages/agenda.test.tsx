import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AgendaPage from '@/app/(dashboard)/agenda/page'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { simpleServer } from '@/__mocks__/simple-server'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { AppointmentStatus, AppointmentSource, Channel } from '@/lib/types'
import { useAuthStore } from '@/lib/stores/auth.store'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/agenda',
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Agenda Page Integration', () => {
  beforeAll(() => {
    simpleServer.listen()
    useAuthStore.setState({ 
      isAuthenticated: true, 
      access_token: 'fake-token',
      user: { id: 'u1', email: 'test@test.com', active: true, clinic_id: 'c1', role: { id: 'r1', name: 'Admin', is_superadmin: true, permissions: {} as any } }
    })
  })
  afterEach(() => simpleServer.resetHandlers())
  afterAll(() => simpleServer.close())

  const mockAppointments = [
    {
      id: 'apt-1',
      contact_name: 'John Doe',
      contact_id: 'c1',
      treatment: { id: 't1', name: 'Limpieza' },
      doctor: { id: 'd1', name: 'Dr. Smith' },
      scheduled_at: new Date().toISOString(),
      duration_min: 30,
      status: AppointmentStatus.CONFIRMED,
      source: AppointmentSource.HUMAN,
      channel: Channel.WHATSAPP,
      conversation_id: 'conv-1',
      notes: ''
    }
  ]

  it('renders the agenda page with appointments grouped by doctor', async () => {
    simpleServer.use(ENDPOINTS.agenda.appointments, async () => ({
      status: 200,
      data: { success: true, data: { data: mockAppointments, meta: { total: 1, page: 1, limit: 10, total_pages: 1 } } }
    }))

    render(<AgendaPage />, { wrapper: createWrapper() })

    // Check header
    expect(screen.getByText('Agenda & Citas')).toBeInTheDocument()

    // screen.debug() // Uncomment for debugging if it fails again

    // Check doctor grouping
    const doctorHeading = await screen.findByText((content, element) => {
      return element?.tagName.toLowerCase() === 'h2' && /smith/i.test(content)
    })
    expect(doctorHeading).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('shows empty state when no appointments are found', async () => {
    simpleServer.use(ENDPOINTS.agenda.appointments, async () => ({
      status: 200,
      data: { success: true, data: { data: [], meta: { total: 0, page: 1, limit: 10, total_pages: 0 } } }
    }))

    render(<AgendaPage />, { wrapper: createWrapper() })

    expect(await screen.findByText('No hay citas para este día')).toBeInTheDocument()
  })

  it('opens detail modal when clicking an appointment card', async () => {
    simpleServer.use(ENDPOINTS.agenda.appointments, async () => ({
      status: 200,
      data: { success: true, data: { data: mockAppointments, meta: { total: 1, page: 1, limit: 10, total_pages: 1 } } }
    }))

    // Mock detail endpoint for the modal
    simpleServer.use(ENDPOINTS.agenda.byId('apt-1'), async () => ({
      status: 200,
      data: { success: true, data: { ...mockAppointments[0], history: [] } }
    }))

    render(<AgendaPage />, { wrapper: createWrapper() })

    const card = await screen.findByText('John Doe')
    fireEvent.click(card)

    // Check if modal title appears
    expect(await screen.findByText('Detalle de la Cita')).toBeInTheDocument()
  })
})
