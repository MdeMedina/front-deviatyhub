'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  subDays, 
  subWeeks, 
  subMonths, 
  addDays, 
  addWeeks, 
  addMonths 
} from 'date-fns'
import { ChevronLeft, ChevronRight, AlertCircle, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useAppointments } from '@/lib/api/hooks/use-appointments'
import { CalendarGrid } from '@/components/agenda/CalendarGrid'
import { AppointmentModal } from '@/components/agenda/AppointmentModal'
import { getDateRange, getRangeLabel } from '@/lib/utils/dates'

export default function AgendaPage() {
  const [view, setView] = useState<'day' | 'week' | 'month'>('week')
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { hasPermission } = useAuthStore()

  // Permissions check
  const canView = hasPermission('agenda.view')

  // Date range
  const { from, to } = getDateRange(view, currentDate)

  // Fetch appointments
  const { data, isLoading } = useAppointments({ 
    startDate: from, 
    endDate: to 
  })

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[var(--card)] border border-[var(--line)] rounded-[10px] min-h-[380px] max-w-md mx-auto text-center shadow-[0_1px_2px_rgba(20,20,25,0.05)]">
        <div className="w-11 h-11 border border-[var(--line)] rounded-[7px] bg-[var(--head)] flex items-center justify-center text-[var(--neg)] mb-3">
          <AlertCircle size={22} />
        </div>
        <h2 className="text-[18px] font-semibold text-[var(--ink)] mb-1.5">Acceso Denegado</h2>
        <p className="text-[13px] text-[var(--muted)] leading-relaxed mb-5">
          No tienes los permisos necesarios para visualizar la agenda médica y gestionar las citas. Por favor contacta al administrador.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-4 py-2 bg-[var(--ink)] hover:opacity-85 text-[var(--bg)] font-medium rounded-[7px] text-[13px] transition-opacity gap-2"
        >
          Ir al Dashboard
          <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  const handlePrevious = () => {
    if (view === 'day') {
      setCurrentDate(prev => subDays(prev, 1))
    } else if (view === 'week') {
      setCurrentDate(prev => subWeeks(prev, 1))
    } else {
      setCurrentDate(prev => subMonths(prev, 1))
    }
  }

  const handleNext = () => {
    if (view === 'day') {
      setCurrentDate(prev => addDays(prev, 1))
    } else if (view === 'week') {
      setCurrentDate(prev => addWeeks(prev, 1))
    } else {
      setCurrentDate(prev => addMonths(prev, 1))
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleSelectAppointment = (id: string) => {
    setSelectedAppointmentId(id)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const appointments = data?.data || []

  return (
    <div className="flex flex-col gap-5 max-w-[1340px] mx-auto">
      {/* Header Bar */}
      <div className="flex items-end justify-between gap-5 flex-wrap pb-4 border-b border-[var(--line)]">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-semibold tracking-[-0.028em] text-[var(--ink)] leading-tight">
            Agenda & Citas
          </h1>
          <p className="text-[13.5px] text-[var(--muted)]">
            Control de Consultas Médicas
          </p>
        </div>

        {/* Date Navigation & Range & View Tabs */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Arrow / Today Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '3px', border: '1px solid var(--line)', borderRadius: '9px', background: 'var(--card)' }}>
            <button 
              data-btn 
              onClick={handlePrevious}
              aria-label="Período anterior"
              style={{ width: '28px', height: '26px', padding: 0, borderColor: 'transparent', background: 'none' }}
            >
              <ChevronLeft size={15} strokeWidth={1.9} />
            </button>
            <button 
              data-btn 
              onClick={handleToday}
              style={{ height: '26px', borderColor: 'transparent', background: 'none', fontSize: '12.5px' }}
            >
              Hoy
            </button>
            <button 
              data-btn 
              onClick={handleNext}
              aria-label="Período siguiente"
              style={{ width: '28px', height: '26px', padding: 0, borderColor: 'transparent', background: 'none' }}
            >
              <ChevronRight size={15} strokeWidth={1.9} />
            </button>
          </div>

          {/* Range text in Mono */}
          <span 
            data-mono 
            style={{ fontSize: '12.5px', color: 'var(--ink-soft)', border: '1px solid var(--line)', borderRadius: '7px', padding: '6px 12px', background: 'var(--card)' }}
          >
            {getRangeLabel(view, currentDate)}
          </span>

          {/* View Selector Tabs */}
          <div data-tabs>
            <button
              data-tab
              data-active={view === 'day'}
              onClick={() => setView('day')}
            >
              Día
            </button>
            <button
              data-tab
              data-active={view === 'week'}
              onClick={() => setView('week')}
            >
              Semana
            </button>
            <button
              data-tab
              data-active={view === 'month'}
              onClick={() => setView('month')}
            >
              Mes
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar Matrix */}
      <CalendarGrid
        view={view}
        currentDate={currentDate}
        appointments={appointments}
        isLoading={isLoading}
        onSelectAppointment={handleSelectAppointment}
      />

      {/* Appointment Detail / Reschedule Modal */}
      <AppointmentModal
        id={selectedAppointmentId || ''}
        appointmentId={selectedAppointmentId || ''}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}
