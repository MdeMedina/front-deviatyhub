'use client'

import React from 'react'
import { Clock, User, Stethoscope } from 'lucide-react'
import { AppointmentStatus, IAppointment } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'
import { motion } from 'framer-motion'

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
      case AppointmentStatus.COMPLETED: return 'purple'
      default: return 'neutral'
    }
  }

  const time = new Date(appointment.scheduled_at).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })

  return (
    <motion.button
      whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-indigo-100 group"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 text-indigo-600">
          <Clock size={14} className="group-hover:animate-pulse" />
          <span className="text-xs font-bold tracking-tight">{time}</span>
        </div>
        <Badge variant={getStatusVariant(appointment.status)} size="sm">
          {appointment.status}
        </Badge>
      </div>

      <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
        {appointment.contact_name}
      </h3>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-slate-500">
          <Stethoscope size={12} />
          <span className="text-xs font-medium">{appointment.treatment.name}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <User size={12} />
          <span className="text-[10px] font-bold uppercase tracking-wider">{appointment.doctor.name}</span>
        </div>
      </div>
    </motion.button>
  )
}
