import { NextResponse } from 'next/server'
import { AppointmentStatus, AppointmentSource, Channel } from '@/lib/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')

  // Mock data
  const data = [
    {
      id: 'apt-1',
      contact_name: 'John Doe',
      contact_id: 'c1',
      treatment: { id: 't1', name: 'Limpieza Dental + Fluor' },
      doctor: { id: 'd1', name: 'Dra. Valentina Paz' },
      scheduled_at: `${startDate || '2026-05-11'}T10:00:00Z`,
      duration_min: 45,
      status: AppointmentStatus.PENDING,
      source: AppointmentSource.AGENT,
      channel: Channel.WHATSAPP,
      conversation_id: 'conv-test-123',
      notes: ''
    },
    {
      id: 'apt-2',
      contact_name: 'María García',
      contact_id: 'c2',
      treatment: { id: 't2', name: 'Extracción Muela del Juicio' },
      doctor: { id: 'd1', name: 'Dra. Valentina Paz' },
      scheduled_at: `${startDate || '2026-05-11'}T11:30:00Z`,
      duration_min: 60,
      status: AppointmentStatus.CONFIRMED,
      source: AppointmentSource.HUMAN,
      channel: Channel.WHATSAPP,
      conversation_id: 'conv-test-456',
      notes: ''
    },
    {
      id: 'apt-3',
      contact_name: 'Carlos Ruiz',
      contact_id: 'c3',
      treatment: { id: 't3', name: 'Blanqueamiento' },
      doctor: { id: 'd2', name: 'Dr. Roberto Mendoza' },
      scheduled_at: `${startDate || '2026-05-11'}T09:00:00Z`,
      duration_min: 30,
      status: AppointmentStatus.CONFIRMED,
      source: AppointmentSource.AGENT,
      channel: Channel.WHATSAPP,
      conversation_id: 'conv-test-789',
      notes: ''
    }
  ]

  return NextResponse.json({
    success: true,
    data: {
      data,
      meta: {
        total: 3,
        page: 1,
        limit: 10,
        total_pages: 1
      }
    }
  })
}
