'use client'

import React from 'react'
import { Clock, User, Stethoscope } from 'lucide-react'
import { AppointmentStatus, AppointmentSource, IAppointment } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'

interface AppointmentCardProps {
  appointment: IAppointment
  onClick?: () => void
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ 
  appointment, 
  onClick 
}) => {
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

  const isAI = appointment.source === AppointmentSource.AGENT || (appointment.source as any) === 'AI'

  const time = new Date(appointment.scheduled_at).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-[8px] border transition-colors cursor-pointer ${
        isAI 
          ? 'bg-[var(--blue-tint)] border-[var(--blue-line)] hover:border-[var(--blue)]' 
          : 'bg-[var(--card)] border-[var(--line)] hover:border-[var(--dim)]'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-1.5 text-[var(--muted)]">
          <Clock size={12} className="text-[var(--dim)]" />
          <span className="microlabel text-[10px] tabular">{time}</span>
        </div>
        <Badge variant={getStatusVariant(appointment.status)} size="sm">
          {appointment.status}
        </Badge>
      </div>

      <h3 className="text-[13.5px] font-semibold text-[var(--ink)] mb-1.5 truncate">
        {appointment.contact_name}
      </h3>

      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[var(--muted)]">
          <Stethoscope size={11} className="text-[var(--dim)]" />
          <span className="text-[11.5px] truncate">{appointment.treatment?.name}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[var(--muted)]">
          <User size={11} className="text-[var(--dim)]" />
          <span className="microlabel text-[9.5px] truncate">{appointment.doctor?.name}</span>
        </div>
      </div>
    </button>
  )
}
