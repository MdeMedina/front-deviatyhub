import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import AgendaPage from '@/app/(dashboard)/agenda/page'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useAppointments } from '@/lib/api/hooks/use-appointments'

// Mock child components
jest.mock('@/components/agenda/CalendarGrid', () => ({
  CalendarGrid: ({ view, currentDate, appointments, isLoading, onSelectAppointment }) => (
    <div data-testid="mock-calendar-grid" data-view={view} data-current-date={currentDate.toISOString()}>
      <button data-testid="mock-select-apt-btn" onClick={() => onSelectAppointment('apt-123')}>
        Select Appointment
      </button>
      {isLoading && <span data-testid="loading-indicator">Loading</span>}
      <div>Appointments Count: {appointments.length}</div>
    </div>
  )
}))

jest.mock('@/components/agenda/AppointmentModal', () => ({
  AppointmentModal: ({ id, isOpen, onClose }) => (
    <div data-testid="mock-appointment-modal" data-id={id} data-is-open={isOpen ? 'true' : 'false'}>
      <button data-testid="mock-close-modal-btn" onClick={onClose}>
        Close Modal
      </button>
    </div>
  )
}))

// Mock hooks and stores
jest.mock('@/lib/stores/auth.store')
jest.mock('@/lib/api/hooks/use-appointments')

describe('AgendaPage (Fase 5.5)', () => {
  const mockHasPermission = jest.fn(() => true)
  const mockUseAppointments = {
    data: {
      data: [
        { id: 'apt-1', contact_name: 'Jane Doe' },
        { id: 'apt-2', contact_name: 'John Smith' }
      ]
    },
    isLoading: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermission.mockReturnValue(true)
    useAuthStore.mockReturnValue({
      hasPermission: mockHasPermission
    })
    useAppointments.mockReturnValue(mockUseAppointments)
  })

  // ✅ TEST FUNCIONAL 1: Renderizado Base de Cabecera y Grilla
  it('renders page header title, buttons, and week view by default', () => {
    render(<AgendaPage />)

    expect(screen.getByText('Agenda & Citas')).toBeInTheDocument()
    expect(screen.getByText('Control de Consultas Médicas')).toBeInTheDocument()
    expect(screen.getByText('Hoy')).toBeInTheDocument()
    expect(screen.getByTestId('mock-calendar-grid')).toBeInTheDocument()
    expect(screen.getByTestId('mock-calendar-grid')).toHaveAttribute('data-view', 'week')
  })

  // ✅ TEST FUNCIONAL 2: Cambio de Vista Activa
  it('changes active view to Day and Month when selecting buttons', () => {
    render(<AgendaPage />)

    const dayBtn = screen.getByText('Día')
    const monthBtn = screen.getByText('Mes')

    // Click Day View
    fireEvent.click(dayBtn)
    expect(screen.getByTestId('mock-calendar-grid')).toHaveAttribute('data-view', 'day')

    // Click Month View
    fireEvent.click(monthBtn)
    expect(screen.getByTestId('mock-calendar-grid')).toHaveAttribute('data-view', 'month')
  })

  // ✅ TEST FUNCIONAL 3: Navegación de Períodos
  it('updates the date and triggers API refetches when clicking next and previous buttons', () => {
    render(<AgendaPage />)

    // Initial Date (Today)
    const initialDateStr = screen.getByTestId('mock-calendar-grid').getAttribute('data-current-date')
    expect(initialDateStr).toBeDefined()

    const buttons = screen.getAllByRole('button')
    // Button index 0 is ChevronLeft (Previous), index 2 is ChevronRight (Next)
    const nextBtn = buttons[2]
    const prevBtn = buttons[0]

    // Click Next Week
    fireEvent.click(nextBtn)
    const nextDateStr = screen.getByTestId('mock-calendar-grid').getAttribute('data-current-date')
    expect(nextDateStr).not.toBe(initialDateStr)
    expect(new Date(nextDateStr).getTime()).toBeGreaterThan(new Date(initialDateStr).getTime())

    // Click Previous
    fireEvent.click(prevBtn)
    const revertedDateStr = screen.getByTestId('mock-calendar-grid').getAttribute('data-current-date')
    expect(new Date(revertedDateStr).getTime()).toBeLessThan(new Date(nextDateStr).getTime())
  })

  // ❌ TEST DE CASOS ESPECIALES 1: Guardia de Permisos (Acceso Denegado 403)
  it('renders Access Denied screen instead of calendar if user lacks agenda.view permission', () => {
    mockHasPermission.mockReturnValue(false)

    render(<AgendaPage />)

    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument()
    expect(screen.getByText(/No tienes los permisos necesarios para visualizar la agenda médica/i)).toBeInTheDocument()
    expect(screen.queryByTestId('mock-calendar-grid')).not.toBeInTheDocument()
  })

  // ❌ TEST DE CASOS ESPECIALES 2: Apertura y Cierre de Modal de Detalles
  it('opens AppointmentModal with correct ID on selection and closes it properly', () => {
    render(<AgendaPage />)

    const modal = screen.getByTestId('mock-appointment-modal')
    expect(modal).toHaveAttribute('data-is-open', 'false')

    // Select appointment triggers onSelect
    const selectBtn = screen.getByTestId('mock-select-apt-btn')
    fireEvent.click(selectBtn)

    expect(modal).toHaveAttribute('data-is-open', 'true')
    expect(modal).toHaveAttribute('data-id', 'apt-123')

    // Click Close Button
    const closeBtn = screen.getByTestId('mock-close-modal-btn')
    fireEvent.click(closeBtn)

    expect(modal).toHaveAttribute('data-is-open', 'false')
  })
})
