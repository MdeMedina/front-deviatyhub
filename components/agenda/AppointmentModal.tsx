'use client'

import React from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { 
  useAppointmentDetail, 
  useUpdateAppointmentStatus
} from '@/lib/api/hooks/use-appointments'
import { AppointmentStatus } from '@/lib/types'
import { 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  History, 
  CheckCircle2, 
  XCircle,
  AlertCircle
} from 'lucide-react'

interface AppointmentModalProps {
  id?: string | null
  appointmentId?: string | null
  isOpen: boolean
  onClose: () => void
  demoData?: any
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({ 
  id, 
  appointmentId,
  isOpen, 
  onClose,
  demoData
}) => {
  const targetId = id || appointmentId || null
  const { data: appointmentData, isLoading, isError } = useAppointmentDetail(targetId)
  const updateStatus = useUpdateAppointmentStatus()
  
  const appointment = demoData || appointmentData
  
  const handleStatusUpdate = async (status: AppointmentStatus) => {
    if (!id) return
    try {
      await updateStatus.mutateAsync({ id, status })
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const getStatusVariant = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.CONFIRMED: return 'success'
      case AppointmentStatus.PENDING: return 'warning'
      case AppointmentStatus.CANCELLED: return 'error'
      case AppointmentStatus.RESCHEDULED: return 'info'
      case AppointmentStatus.COMPLETED: return 'neutral'
      default: return 'neutral'
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Detalle de la Cita"
      size="md"
      footer={
        appointment && (
          <div className="flex gap-2.5 w-full justify-end">
            {appointment.status === AppointmentStatus.PENDING && (
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => handleStatusUpdate(AppointmentStatus.CONFIRMED)}
                loading={updateStatus.isPending}
                icon={<CheckCircle2 size={14} />}
              >
                Confirmar Cita
              </Button>
            )}
            {appointment.status !== AppointmentStatus.CANCELLED && appointment.status !== AppointmentStatus.COMPLETED && (
              <Button 
                variant="danger" 
                size="sm"
                onClick={() => handleStatusUpdate(AppointmentStatus.CANCELLED)}
                loading={updateStatus.isPending}
                icon={<XCircle size={14} />}
              >
                Cancelar
              </Button>
            )}
          </div>
        )
      }
    >
      {isLoading && !demoData ? (
        <div className="py-14 flex flex-col items-center justify-center gap-2">
          <Spinner size="md" />
          <p className="microlabel text-[10px]">Cargando información</p>
        </div>
      ) : isError || !appointment ? (
        <div className="py-10 text-center">
          <AlertCircle size={32} className="text-[var(--neg)] mx-auto mb-2" />
          <p className="text-[13px] text-[var(--muted)]">No se pudo cargar la información de la cita</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-[16px] font-semibold text-[var(--ink)] mb-0.5">{appointment.contact_name}</h3>
              <p className="text-[12px] text-[var(--muted)] flex items-center gap-1.5">
                ID de Conversación: <span className="microlabel text-[10px] bg-[var(--surface)] px-1.5 py-0.5 rounded border border-[var(--line)]">{appointment.conversation_id}</span>
              </p>
            </div>
            <Badge variant={getStatusVariant(appointment.status)} size="md">
              {appointment.status}
            </Badge>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 bg-[var(--surface)] p-3.5 rounded-[8px] border border-[var(--line-soft)]">
            <div className="space-y-0.5">
              <span className="microlabel text-[9px] flex items-center gap-1">
                <Stethoscope size={10} /> Tratamiento
              </span>
              <p className="text-[13px] font-medium text-[var(--ink)]">{appointment.treatment?.name}</p>
            </div>
            <div className="space-y-0.5">
              <span className="microlabel text-[9px] flex items-center gap-1">
                <User size={10} /> Especialista
              </span>
              <p className="text-[13px] font-medium text-[var(--ink)]">{appointment.doctor?.name}</p>
            </div>
            <div className="space-y-0.5">
              <span className="microlabel text-[9px] flex items-center gap-1">
                <Calendar size={10} /> Fecha
              </span>
              <p className="text-[13px] font-medium text-[var(--ink)] tabular">
                {new Date(appointment.scheduled_at).toLocaleDateString('es-ES', { dateStyle: 'medium' })}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="microlabel text-[9px] flex items-center gap-1">
                <Clock size={10} /> Horario
              </span>
              <p className="text-[13px] font-medium text-[var(--ink)] tabular">
                {new Date(appointment.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({appointment.duration_min} min)
              </p>
            </div>
          </div>

          {/* History Timeline */}
          {appointment.history && appointment.history.length > 0 && (
            <div className="pt-2">
              <h4 className="microlabel text-[9.5px] mb-3 flex items-center gap-1.5">
                <History size={12} /> Historial de Cambios
              </h4>
              <div className="space-y-3 relative before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-[var(--line)]">
                {appointment.history.map((event: any, idx: number) => (
                  <div key={idx} className="relative pl-6">
                    <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-[var(--card)] border border-[var(--blue)] flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-[var(--blue)]" />
                    </div>
                    <div className="flex justify-between items-baseline">
                      <p className="text-[12.5px] font-medium text-[var(--ink)]">{event.event}</p>
                      <span className="microlabel text-[9.5px] tabular">{new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[11px] text-[var(--muted)]">Por: {event.performed_by} ({event.channel})</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
