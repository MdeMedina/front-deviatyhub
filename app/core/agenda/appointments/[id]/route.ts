import { NextResponse } from 'next/server'
import { AppointmentStatus, AppointmentSource, Channel } from '@/lib/types'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const data = {
    id,
    contact_name: id === 'apt-1' ? 'John Doe' : id === 'apt-2' ? 'María García' : 'Carlos Ruiz',
    contact_id: 'c1',
    treatment: { id: 't1', name: 'Tratamiento Mock' },
    doctor: { id: 'd1', name: 'Dra. Valentina Paz' },
    scheduled_at: new Date().toISOString(),
    duration_min: 45,
    status: AppointmentStatus.PENDING,
    source: AppointmentSource.AGENT,
    channel: Channel.WHATSAPP,
    conversation_id: 'conv-test-123',
    notes: 'Esta es una nota de prueba generada por el mock server.',
    history: [
      { id: 'h1', event: 'Cita creada por el Agente IA', performed_by: 'Deviaty Agent', channel: 'WHATSAPP', created_at: new Date(Date.now() - 3600000).toISOString() },
      { id: 'h2', event: 'Confirmación pendiente', performed_by: 'System', channel: 'INTERNAL', created_at: new Date(Date.now() - 1800000).toISOString() }
    ]
  }

  return NextResponse.json({
    success: true,
    data
  })
}
