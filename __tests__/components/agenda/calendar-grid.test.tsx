import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { CalendarGrid } from '@/components/agenda/CalendarGrid'
import { AppointmentStatus, AppointmentSource, Channel } from '@/lib/types'

describe('Agenda Module — CalendarGrid', () => {
  const mockAppointments = [
    {
      id: 'apt-1',
      contact_name: 'Jane Doe',
      contact_id: 'c1',
      treatment: { id: 't1', name: 'Consulta Médica' },
      doctor: { id: 'd1', name: 'Dr. House' },
      scheduled_at: '2026-05-18T10:00:00Z', // A Monday
      duration_min: 60,
      status: AppointmentStatus.CONFIRMED,
      source: AppointmentSource.AGENT,
      channel: Channel.WHATSAPP,
      conversation_id: 'conv-1',
      notes: ''
    },
    {
      id: 'apt-2',
      contact_name: 'John Smith',
      contact_id: 'c2',
      treatment: { id: 't2', name: 'Limpieza Dental' },
      doctor: { id: 'd2', name: 'Dra. Quinn' },
      scheduled_at: '2026-05-19T14:30:00Z', // A Tuesday
      duration_min: 30,
      status: AppointmentStatus.PENDING,
      source: AppointmentSource.HUMAN,
      channel: Channel.INSTAGRAM,
      conversation_id: 'conv-2',
      notes: ''
    }
  ]

  const mockOnSelectAppointment = jest.fn()

  beforeEach(() => {
    mockOnSelectAppointment.mockClear()
  })

  // ✅ TEST FUNCIONAL 1: Renders Week view correctly with days of week and triggers click
  it('renders Week view correctly and triggers onSelectAppointment when an appointment is clicked', () => {
    // 2026-05-18 is a Monday
    const currentDate = new Date('2026-05-18T12:00:00Z')

    render(
      <CalendarGrid
        view="week"
        currentDate={currentDate}
        appointments={mockAppointments}
        isLoading={false}
        onSelectAppointment={mockOnSelectAppointment}
      />
    )

    // Check weekday short name formats are rendered (e.g. "lun", "mar")
    expect(screen.getByText(/lun/i)).toBeInTheDocument()
    expect(screen.getByText(/mar/i)).toBeInTheDocument()

    // Appointments in the week should be visible
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('Consulta Médica')).toBeInTheDocument()
    expect(screen.getByText('John Smith')).toBeInTheDocument()
    expect(screen.getByText('Limpieza Dental')).toBeInTheDocument()

    // Click on an appointment and check handler
    fireEvent.click(screen.getByText('Jane Doe'))
    expect(mockOnSelectAppointment).toHaveBeenCalledWith('apt-1')
  })

  // ✅ TEST FUNCIONAL 2: Renders Day view correctly and filters to only active day
  it('renders Day view and only shows appointments scheduled for the current date', () => {
    const currentDate = new Date('2026-05-18T12:00:00Z')

    render(
      <CalendarGrid
        view="day"
        currentDate={currentDate}
        appointments={mockAppointments}
        isLoading={false}
        onSelectAppointment={mockOnSelectAppointment}
      />
    )

    // Jane Doe is on May 18th (should be rendered)
    expect(screen.getAllByText('Jane Doe')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Consulta Médica')[0]).toBeInTheDocument()

    // John Smith is on May 19th (should NOT be rendered in absolute grid or mobile list)
    expect(screen.queryByText('John Smith')).not.toBeInTheDocument()
  })

  // ✅ TEST FUNCIONAL 3: Renders Month view correctly showing days and appointment chips
  it('renders Month view and displays correct day numbers and appointment indicator chips', () => {
    const currentDate = new Date('2026-05-18T12:00:00Z')

    render(
      <CalendarGrid
        view="month"
        currentDate={currentDate}
        appointments={mockAppointments}
        isLoading={false}
        onSelectAppointment={mockOnSelectAppointment}
      />
    )

    // Day numbers (e.g., 18, 19) should be visible
    expect(screen.getAllByText('18')[0]).toBeInTheDocument()
    expect(screen.getAllByText('19')[0]).toBeInTheDocument()

    // Jane Doe and John Smith should appear as clickable list items in month grid cells
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('John Smith')).toBeInTheDocument()

    // Click and check select appointment
    fireEvent.click(screen.getByText('John Smith'))
    expect(mockOnSelectAppointment).toHaveBeenCalledWith('apt-2')
  })

  // ❌ ERROR / EDGE CASE 1: Displays clean EmptyState in Day view when day has no appointments
  it('renders EmptyState in Day view when there are no appointments scheduled for that day', () => {
    // A Wednesday with no appointments
    const currentDate = new Date('2026-05-20T12:00:00Z')

    render(
      <CalendarGrid
        view="day"
        currentDate={currentDate}
        appointments={mockAppointments}
        isLoading={false}
        onSelectAppointment={mockOnSelectAppointment}
      />
    )

    expect(screen.getByText('Sin citas para hoy')).toBeInTheDocument()
    expect(screen.getByText('No hay ninguna cita de pacientes programada para este día.')).toBeInTheDocument()
  })

  // ❌ ERROR / EDGE CASE 2: Displays loading skeleton / spinner correctly when isLoading is true
  it('displays active loading spinner when isLoading is true', () => {
    const currentDate = new Date('2026-05-18T12:00:00Z')

    render(
      <CalendarGrid
        view="week"
        currentDate={currentDate}
        appointments={mockAppointments}
        isLoading={true}
        onSelectAppointment={mockOnSelectAppointment}
      />
    )

    expect(screen.getByText('Sincronizando agenda')).toBeInTheDocument()
    // Other appointments should not be visible as loading takes full screen overlay
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument()
  })
})
