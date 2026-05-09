import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { AppointmentCard } from '@/components/agenda/AppointmentCard'
import { AppointmentStatus, AppointmentSource, Channel } from '@/lib/types'

describe('Agenda Module — AppointmentCard', () => {
  const mockAppointment = {
    id: 'apt-1',
    contact_name: 'John Doe',
    contact_id: 'c1',
    treatment: { id: 't1', name: 'Limpieza' },
    doctor: { id: 'd1', name: 'Dr. Smith' },
    scheduled_at: '2026-05-10T10:00:00Z',
    duration_min: 30,
    status: AppointmentStatus.CONFIRMED,
    source: AppointmentSource.HUMAN,
    channel: Channel.WHATSAPP,
    conversation_id: 'conv-1',
    notes: ''
  }

  it('renders card with correct appointment data', () => {
    render(<AppointmentCard appointment={mockAppointment} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Limpieza')).toBeInTheDocument()
    expect(screen.getByText(/dr\. smith/i)).toBeInTheDocument()
    expect(screen.getByText(AppointmentStatus.CONFIRMED)).toBeInTheDocument()
  })

  it('calls onClick when the card is clicked', () => {
    const handleClick = jest.fn()
    render(<AppointmentCard appointment={mockAppointment} onClick={handleClick} />)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
