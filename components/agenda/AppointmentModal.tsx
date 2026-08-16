'use client'

import React from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { 
  useAppointmentDetail, 
  useUpdateAppointmentStatus,
  useRescheduleAppointment
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
  id: string | null
  isOpen: boolean
  onClose: () => void
  demoData?: any // For visual testing in /test
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({ 
  id, 
  isOpen, 
  onClose,
  demoData
}) => {
  const { data: appointmentData, isLoading, isError } = useAppointmentDetail(id)
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
      case AppointmentStatus.COMPLETED: return 'purple'
      default: return 'neutral'
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Detalle de la Cita"
      size="md"
    >
      {isLoading && !demoData ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <Spinner size="lg" className="text-indigo-600" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cargando información</p>
        </div>
      ) : isError || !appointment ? (
        <div className="py-12 text-center">
          <AlertCircle size={48} className="text-red-100 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">No se pudo cargar la información de la cita</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">{appointment.contact_name}</h3>
              <p className="text-sm text-slate-500 flex items-center gap-2">
                ID de Conversación: <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{appointment.conversation_id}</span>
              </p>
            </div>
            <Badge variant={getStatusVariant(appointment.status)} size="md">
              {appointment.status}
            </Badge>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Stethoscope size={10} /> Tratamiento
              </span>
              <p className="text-sm font-semibold text-slate-700">{appointment.treatment.name}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User size={10} /> Especialista
              </span>
              <p className="text-sm font-semibold text-slate-700">{appointment.doctor.name}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={10} /> Fecha
              </span>
              <p className="text-sm font-semibold text-slate-700">
                {new Date(appointment.scheduled_at).toLocaleDateString([], { dateStyle: 'long' })}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={10} /> Horario
              </span>
              <p className="text-sm font-semibold text-slate-700">
                {new Date(appointment.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({appointment.duration_min} min)
              </p>
            </div>
          </div>

          {/* History Timeline */}
          {appointment.history && appointment.history.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <History size={14} /> Historial de Cambios
              </h4>
              <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {appointment.history.map((event: any, idx: number) => (
                  <div key={idx} className="relative pl-8">
                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-white border-2 border-indigo-100 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    </div>
                    <div className="flex justify-between items-baseline">
                      <p className="text-xs font-semibold text-slate-700">{event.event}</p>
                      <span className="text-[10px] text-slate-400">{new Date(event.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Por: {event.performed_by} ({event.channel})</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            {appointment.status === AppointmentStatus.PENDING && (
              <Button 
                variant="primary" 
                onClick={() => handleStatusUpdate(AppointmentStatus.CONFIRMED)}
                loading={updateStatus.isPending}
                icon={<CheckCircle2 size={16} />}
                className="flex-1"
              >
                Confirmar Cita
              </Button>
            )}
            {appointment.status !== AppointmentStatus.CANCELLED && appointment.status !== AppointmentStatus.COMPLETED && (
              <Button 
                variant="danger" 
                onClick={() => handleStatusUpdate(AppointmentStatus.CANCELLED)}
                loading={updateStatus.isPending}
                icon={<XCircle size={16} />}
                className="flex-1"
              >
                Cancelar
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
