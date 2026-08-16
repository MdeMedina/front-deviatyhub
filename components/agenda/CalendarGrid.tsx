'use client'

import React from 'react'
import { 
  format, 
  startOfWeek, 
  endOfWeek,
  addDays, 
  isSameDay, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  parseISO
} from 'date-fns'
import { es } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { IAppointment, AppointmentStatus } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { AlertCircle } from 'lucide-react'

interface CalendarGridProps {
  view: 'day' | 'week' | 'month'
  currentDate: Date
  appointments: IAppointment[]
  isLoading: boolean
  onSelectAppointment: (id: string) => void
}

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
const START_HOUR = 8
const TOTAL_HOURS = 12 // 8:00 to 20:00

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  view,
  currentDate,
  appointments = [],
  isLoading,
  onSelectAppointment
}) => {
  // Format times safely, supporting both ISO string and Date objects
  const getParsedDate = (dateVal: string | Date): Date => {
    return typeof dateVal === 'string' ? parseISO(dateVal) : dateVal
  }

  // Get status color variant for badge/indicator
  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.CONFIRMED: return 'bg-emerald-500'
      case AppointmentStatus.PENDING: return 'bg-amber-500'
      case AppointmentStatus.CANCELLED: return 'bg-rose-500'
      case AppointmentStatus.RESCHEDULED: return 'bg-sky-500'
      case AppointmentStatus.COMPLETED: return 'bg-purple-500'
      default: return 'bg-slate-500'
    }
  }

  const getStatusTextVariant = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.CONFIRMED: return 'success'
      case AppointmentStatus.PENDING: return 'warning'
      case AppointmentStatus.CANCELLED: return 'error'
      case AppointmentStatus.RESCHEDULED: return 'info'
      case AppointmentStatus.COMPLETED: return 'purple'
      default: return 'neutral'
    }
  }

  // Position helper for Day and Week views
  const getPositionStyles = (appointment: IAppointment) => {
    const date = getParsedDate(appointment.scheduled_at)
    const hour = date.getHours()
    const minutes = date.getMinutes()
    const duration = appointment.duration_min

    const startDecimal = hour + minutes / 60
    const offset = Math.max(0, startDecimal - START_HOUR)
    const durationDecimal = duration / 60

    // Compute percentage relative to the 12-hour block (8:00 to 20:00)
    const topPercent = (offset / TOTAL_HOURS) * 100
    const heightPercent = (durationDecimal / TOTAL_HOURS) * 100

    return {
      top: `${Math.min(95, Math.max(0, topPercent))}%`,
      height: `${Math.min(100 - topPercent, Math.max(5, heightPercent))}%`
    }
  }

  // Render Day View
  const renderDayView = () => {
    const dayAppointments = appointments.filter(apt => 
      isSameDay(getParsedDate(apt.scheduled_at), currentDate)
    )

    if (dayAppointments.length === 0) {
      return (
        <div className="bg-white border border-slate-100 rounded-3xl p-12 shadow-sm flex items-center justify-center min-h-[400px]">
          <EmptyState 
            title="Sin citas para hoy" 
            description="No hay ninguna cita de pacientes programada para este día."
          />
        </div>
      )
    }

    return (
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col md:flex-row">
        {/* Timeline column */}
        <div className="w-20 flex-shrink-0 border-r border-slate-100 bg-slate-50/50 py-4 hidden md:block">
          {HOURS.map(h => (
            <div key={h} className="h-20 flex justify-center items-start text-xs font-bold text-slate-400">
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Content column */}
        <div className="flex-1 relative min-h-[600px] py-4 px-6 bg-white">
          {/* Hour grid lines */}
          <div className="absolute inset-0 pointer-events-none py-4 px-6 hidden md:block">
            {HOURS.map((h, i) => (
              <div 
                key={h} 
                className="border-b border-dashed border-slate-100 h-20"
                style={{ display: i === HOURS.length - 1 ? 'none' : 'block' }}
              />
            ))}
          </div>

          {/* Cards (Desktop: Absolute, Mobile: Stacked) */}
          <div className="relative w-full h-full min-h-[500px] hidden md:block">
            {dayAppointments.map(apt => {
              const styles = getPositionStyles(apt)
              return (
                <motion.div
                  key={apt.id}
                  style={styles}
                  onClick={() => onSelectAppointment(apt.id)}
                  whileHover={{ scale: 1.01, zIndex: 10 }}
                  className="absolute left-0 right-0 p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100/80 shadow-sm hover:shadow-md cursor-pointer transition-shadow overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 truncate">
                        {apt.contact_name}
                      </h4>
                      <Badge variant={getStatusTextVariant(apt.status)} size="sm">
                        {apt.status}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium truncate">
                      {apt.treatment.name}
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>{apt.doctor.name}</span>
                    <span>
                      {format(getParsedDate(apt.scheduled_at), 'HH:mm')} ({apt.duration_min} min)
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Mobile view list */}
          <div className="space-y-4 md:hidden">
            {dayAppointments.map(apt => (
              <div
                key={apt.id}
                onClick={() => onSelectAppointment(apt.id)}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-100/50"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-bold text-slate-800">{apt.contact_name}</h4>
                  <Badge variant={getStatusTextVariant(apt.status)} size="sm">
                    {apt.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 font-medium mb-1">{apt.treatment.name}</p>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-3 pt-2 border-t border-slate-100">
                  <span>{apt.doctor.name}</span>
                  <span>{format(getParsedDate(apt.scheduled_at), 'HH:mm')} ({apt.duration_min} min)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Render Week View
  const renderWeekView = () => {
    const startOfWeekDay = startOfWeek(currentDate, { weekStartsOn: 1 })
    const daysOfWeek = Array.from({ length: 7 }, (_, i) => addDays(startOfWeekDay, i))

    return (
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        {/* Header grid */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 py-3 text-center">
          {daysOfWeek.map(day => {
            const isToday = isSameDay(day, new Date())
            return (
              <div key={day.toString()} className="px-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {format(day, 'eee', { locale: es })}
                </span>
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-extrabold ${
                  isToday 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-800'
                }`}>
                  {format(day, 'd')}
                </span>
              </div>
            )
          })}
        </div>

        {/* Calendar days container */}
        <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-100 min-h-[450px]">
          {daysOfWeek.map(day => {
            const dayAppointments = appointments.filter(apt => 
              isSameDay(getParsedDate(apt.scheduled_at), day)
            )

            return (
              <div key={day.toString()} className="p-3 bg-white min-h-[150px] md:min-h-[450px] relative">
                {dayAppointments.length === 0 ? (
                  <div className="h-full flex items-center justify-center py-6 text-slate-300 text-xs font-medium italic">
                    Sin citas
                  </div>
                ) : (
                  <div className="space-y-2 md:space-y-3">
                    {dayAppointments.map(apt => (
                      <div
                        key={apt.id}
                        onClick={() => onSelectAppointment(apt.id)}
                        className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100/50 shadow-sm hover:shadow-md cursor-pointer hover:border-indigo-200 transition-all group"
                      >
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <h2 className="text-[10px] font-bold text-indigo-600 truncate">
                            {apt.doctor.name}
                          </h2>
                          <span className={`w-2 h-2 rounded-full ${getStatusColor(apt.status)}`} />
                        </div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-extrabold text-slate-400">
                            {format(getParsedDate(apt.scheduled_at), 'HH:mm')}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 truncate">
                          {apt.contact_name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium truncate">
                          {apt.treatment.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Render Month View
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startOfWeekDay = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endOfWeekDay = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const days = eachDayOfInterval({ start: startOfWeekDay, end: endOfWeekDay })

    return (
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        {/* Day name headers */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 py-3 text-center">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
            <span key={d} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {d}
            </span>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-50">
          {days.map((day, idx) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth()
            const isToday = isSameDay(day, new Date())
            const dayAppointments = appointments.filter(apt => 
              isSameDay(getParsedDate(apt.scheduled_at), day)
            )

            return (
              <div 
                key={day.toString()} 
                className={`min-h-[100px] p-2 flex flex-col bg-white ${
                  !isCurrentMonth ? 'bg-slate-50/40 text-slate-300' : 'text-slate-800'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                    isToday 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : !isCurrentMonth ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    {day.getDate()}
                  </span>
                  {dayAppointments.length > 0 && (
                    <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                      {dayAppointments.length}
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar min-h-0 max-h-[70px]">
                  {dayAppointments.slice(0, 3).map(apt => (
                    <div
                      key={apt.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectAppointment(apt.id)
                      }}
                      className="px-1.5 py-0.5 rounded bg-indigo-50/80 border border-indigo-100 hover:border-indigo-200 cursor-pointer text-[9px] font-semibold text-slate-700 truncate flex items-center gap-1 group"
                    >
                      <span className={`w-1 h-1 rounded-full ${getStatusColor(apt.status)} flex-shrink-0`} />
                      <span className="truncate group-hover:text-indigo-600">{apt.contact_name}</span>
                    </div>
                  ))}
                  {dayAppointments.length > 3 && (
                    <div className="text-[8px] text-slate-400 font-bold text-center">
                      + {dayAppointments.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Handle active states and loading
  return (
    <div className="w-full relative">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-32 bg-white border border-slate-100 rounded-3xl shadow-sm min-h-[400px]"
          >
            <Spinner size="lg" className="text-indigo-600 mb-4" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sincronizando agenda</p>
          </motion.div>
        ) : (
          <motion.div
            key={view + currentDate.toString()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {appointments.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 flex items-center gap-3 text-amber-900 text-sm font-semibold mb-6 shadow-sm border-dashed">
                <AlertCircle size={18} className="text-amber-500 shrink-0" />
                <div>
                  <span className="font-bold">No hay citas para este día</span>
                  <span className="text-xs text-amber-700 font-medium block mt-0.5">No hay ninguna cita programada para el rango de fechas seleccionado.</span>
                </div>
              </div>
            )}
            {view === 'day' && renderDayView()}
            {view === 'week' && renderWeekView()}
            {view === 'month' && renderMonthView()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
