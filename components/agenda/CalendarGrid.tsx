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
import { IAppointment, AppointmentStatus, AppointmentSource } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Calendar } from 'lucide-react'

interface CalendarGridProps {
  view: 'day' | 'week' | 'month'
  currentDate: Date
  appointments: IAppointment[]
  isLoading: boolean
  onSelectAppointment: (id: string) => void
}

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
const START_HOUR = 8
const TOTAL_HOURS = 12

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  view,
  currentDate,
  appointments = [],
  isLoading,
  onSelectAppointment
}) => {
  const getParsedDate = (dateVal: string | Date): Date => {
    return typeof dateVal === 'string' ? parseISO(dateVal) : dateVal
  }

  const getStatusTextVariant = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.CONFIRMED: return 'success'
      case AppointmentStatus.PENDING: return 'warning'
      case AppointmentStatus.CANCELLED: return 'error'
      case AppointmentStatus.RESCHEDULED: return 'info'
      case AppointmentStatus.COMPLETED: return 'neutral'
      default: return 'neutral'
    }
  }

  const getPositionStyles = (appointment: IAppointment) => {
    const date = getParsedDate(appointment.scheduled_at)
    const hour = date.getHours()
    const minutes = date.getMinutes()
    const duration = appointment.duration_min

    const startDecimal = hour + minutes / 60
    const offset = Math.max(0, startDecimal - START_HOUR)
    const durationDecimal = duration / 60

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
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-[10px] p-12 flex items-center justify-center min-h-[400px]">
          <EmptyState 
            title="Sin citas para hoy" 
            description="No hay ninguna cita de pacientes programada para este día."
            icon={<Calendar size={22} />}
          />
        </div>
      )
    }

    return (
      <div className="bg-[var(--card)] border border-[var(--line)] rounded-[10px] overflow-hidden flex flex-col md:flex-row shadow-[0_1px_2px_rgba(20,20,25,0.05)]">
        {/* Timeline Column */}
        <div className="w-16 shrink-0 border-r border-[var(--line-soft)] bg-[var(--head)] py-4 hidden md:block">
          {HOURS.map(h => (
            <div key={h} className="h-16 flex justify-center items-start microlabel text-[10px] tabular">
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Content Column */}
        <div className="flex-1 relative min-h-[600px] py-4 px-6 bg-[var(--card)]">
          <div className="absolute inset-0 pointer-events-none py-4 px-6 hidden md:block">
            {HOURS.map((h, i) => (
              <div 
                key={h} 
                className="border-b border-[var(--line-soft)] h-16"
                style={{ display: i === HOURS.length - 1 ? 'none' : 'block' }}
              />
            ))}
          </div>

          <div className="relative w-full h-full min-h-[500px] hidden md:block">
            {dayAppointments.map(apt => {
              const styles = getPositionStyles(apt)
              const isAI = apt.source === AppointmentSource.AGENT || (apt.source as any) === 'AI'
              return (
                <div
                  key={apt.id}
                  style={styles}
                  onClick={() => onSelectAppointment(apt.id)}
                  className={`absolute left-0 right-0 p-2.5 rounded-[6px] border shadow-[0_1px_2px_rgba(20,20,25,0.05)] cursor-pointer transition-colors overflow-hidden flex flex-col justify-between group ${
                    isAI 
                      ? 'bg-[var(--blue-tint)] border-[var(--blue-line)] hover:border-[var(--blue)]' 
                      : 'bg-[var(--surface-2)] border-[var(--line)] hover:border-[var(--dim)]'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-0.5">
                      <h4 className="text-[12px] font-semibold text-[var(--ink)] truncate">
                        {apt.contact_name}
                      </h4>
                      <Badge variant={getStatusTextVariant(apt.status)} size="sm">
                        {apt.status}
                      </Badge>
                    </div>
                    <p className="text-[10.5px] text-[var(--muted)] truncate">
                      {apt.treatment?.name}
                    </p>
                  </div>
                  <div className="flex justify-between items-center microlabel text-[9px] text-[var(--dim)]">
                    <span className="truncate">{apt.doctor?.name}</span>
                    <span className="tabular">
                      {format(getParsedDate(apt.scheduled_at), 'HH:mm')} ({apt.duration_min} min)
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mobile view list */}
          <div className="space-y-3 md:hidden">
            {dayAppointments.map(apt => {
              const isAI = apt.source === AppointmentSource.AGENT || (apt.source as any) === 'AI'
              return (
                <div
                  key={apt.id}
                  onClick={() => onSelectAppointment(apt.id)}
                  className={`p-3 rounded-[8px] border cursor-pointer ${
                    isAI ? 'bg-[var(--blue-tint)] border-[var(--blue-line)]' : 'bg-[var(--card)] border-[var(--line)]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <h4 className="text-[13.5px] font-semibold text-[var(--ink)]">{apt.contact_name}</h4>
                    <Badge variant={getStatusTextVariant(apt.status)} size="sm">
                      {apt.status}
                    </Badge>
                  </div>
                  <p className="text-[12px] text-[var(--muted)] mb-2">{apt.treatment?.name}</p>
                  <div className="flex justify-between items-center microlabel text-[9.5px] pt-2 border-t border-[var(--line-soft)]">
                    <span>{apt.doctor?.name}</span>
                    <span className="tabular">{format(getParsedDate(apt.scheduled_at), 'HH:mm')} ({apt.duration_min} min)</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Render Week View — prototype time grid (64px hours column + 7 day columns, 58px rows)
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const daysOfWeek = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    // Bucket each appointment's hour into the visible range so it always renders
    const bucketHour = (apt: IAppointment) => {
      const h = getParsedDate(apt.scheduled_at).getHours()
      return Math.min(HOURS[HOURS.length - 1], Math.max(HOURS[0], h))
    }

    const apptsFor = (day: Date, hour: number) =>
      appointments.filter(
        (apt) => isSameDay(getParsedDate(apt.scheduled_at), day) && bucketHour(apt) === hour
      )

    const HEADER_COLS = { display: 'grid', gridTemplateColumns: '64px repeat(7, minmax(0, 1fr))' } as const

    return (
      <div data-card>
        <div data-hd>
          <h2>Semana del {format(weekStart, "d 'de' MMMM", { locale: es })}</h2>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--muted)' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '3px', border: '1px solid var(--blue-line)', background: 'var(--blue-tint)' }} />
              Agendada por IA
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--muted)' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '3px', border: '1px solid var(--line)', background: 'var(--surface-2)' }} />
              Manual
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: '920px' }}>
            {/* Day header row */}
            <div style={{ ...HEADER_COLS, background: 'var(--head)', borderBottom: '1px solid var(--line)' }}>
              <div />
              {daysOfWeek.map((day) => (
                <div
                  key={day.toString()}
                  style={{ padding: '9px 10px', borderLeft: '1px solid var(--line-soft)', display: 'flex', flexDirection: 'column', gap: '2px' }}
                >
                  <span data-lbl>{format(day, 'eee', { locale: es })}</span>
                  <span data-mono style={{ fontSize: '13px', color: 'var(--ink)' }}>{format(day, 'd')}</span>
                </div>
              ))}
            </div>

            {/* Hour rows */}
            {HOURS.map((hour) => (
              <div key={hour} style={{ ...HEADER_COLS, borderBottom: '1px solid var(--line-soft)' }}>
                <div data-mono style={{ fontSize: '10.5px', color: 'var(--dim)', padding: '6px 8px', textAlign: 'right' }}>
                  {String(hour).padStart(2, '0')}:00
                </div>
                {daysOfWeek.map((day) => {
                  const cellAppts = apptsFor(day, hour)
                  return (
                    <div
                      key={day.toString()}
                      style={{ borderLeft: '1px solid var(--line-soft)', minHeight: '58px', padding: '3px', display: 'flex', flexDirection: 'column', gap: '3px' }}
                    >
                      {cellAppts.map((apt) => {
                        const isAI = apt.source === AppointmentSource.AGENT || (apt.source as any) === 'AI'
                        return (
                          <button
                            key={apt.id}
                            onClick={() => onSelectAppointment(apt.id)}
                            style={{
                              width: '100%',
                              flex: '1 1 auto',
                              minHeight: '48px',
                              border: `1px solid ${isAI ? 'var(--blue-line)' : 'var(--line)'}`,
                              background: isAI ? 'var(--blue-tint)' : 'var(--surface-2)',
                              borderRadius: '6px',
                              padding: '5px 7px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                              alignItems: 'flex-start',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              overflow: 'hidden',
                              textAlign: 'left',
                            }}
                          >
                            <span style={{ fontSize: '11.5px', fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                              {apt.contact_name}
                            </span>
                            <span style={{ fontSize: '10.5px', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                              {apt.treatment?.name}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
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
      <div className="bg-[var(--card)] border border-[var(--line)] rounded-[10px] overflow-hidden flex flex-col shadow-[0_1px_2px_rgba(20,20,25,0.05)]">
        {/* Day Name Headers */}
        <div className="grid grid-cols-7 border-b border-[var(--line)] bg-[var(--head)] py-2 text-center">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
            <span key={d} className="microlabel text-[9.5px]">
              {d}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-[var(--line-soft)] bg-[var(--card)]">
          {days.map((day) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth()
            const isToday = isSameDay(day, new Date())
            const dayAppointments = appointments.filter(apt => 
              isSameDay(getParsedDate(apt.scheduled_at), day)
            )

            return (
              <div 
                key={day.toString()} 
                className={`min-h-[90px] p-2 flex flex-col ${
                  !isCurrentMonth ? 'bg-[var(--surface)] text-[var(--dim)]' : 'bg-[var(--card)] text-[var(--ink)]'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-[4px] text-[11px] font-semibold tabular ${
                    isToday 
                      ? 'bg-[var(--blue)] text-white' 
                      : !isCurrentMonth ? 'text-[var(--dim)]' : 'text-[var(--ink)]'
                  }`}>
                    {day.getDate()}
                  </span>
                  {dayAppointments.length > 0 && (
                    <span className="microlabel text-[8.5px] px-1 py-0.2 rounded bg-[var(--surface-2)] text-[var(--ink-soft)] border border-[var(--line)]">
                      {dayAppointments.length}
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 max-h-[60px]">
                  {dayAppointments.slice(0, 2).map(apt => (
                    <div
                      key={apt.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectAppointment(apt.id)
                      }}
                      className="px-1.5 py-0.5 rounded-[4px] bg-[var(--surface-2)] border border-[var(--line)] hover:border-[var(--dim)] cursor-pointer text-[9.5px] font-medium text-[var(--ink)] truncate"
                    >
                      {apt.contact_name}
                    </div>
                  ))}
                  {dayAppointments.length > 2 && (
                    <div className="microlabel text-[8px] text-center text-[var(--dim)]">
                      +{dayAppointments.length - 2} más
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-[var(--card)] border border-[var(--line)] rounded-[10px] min-h-[380px]">
        <Spinner size="md" />
        <p className="microlabel text-[10px] mt-2">Sincronizando agenda</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Legend bar for day/month (week shows its legend in the card header) */}
      {view !== 'week' && (
        <div className="flex items-center gap-4 text-[11.5px] text-[var(--muted)]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[3px] bg-[var(--blue-tint)] border border-[var(--blue-line)]" />
            <span>Agendada por IA</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[3px] bg-[var(--surface-2)] border border-[var(--line)]" />
            <span>Manual</span>
          </div>
        </div>
      )}

      {view === 'day' && renderDayView()}
      {view === 'week' && renderWeekView()}
      {view === 'month' && renderMonthView()}
    </div>
  )
}
