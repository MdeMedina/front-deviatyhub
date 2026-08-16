'use client'

import React, { useState } from 'react'
import { 
  subDays, 
  subWeeks, 
  subMonths, 
  addDays, 
  addWeeks, 
  addMonths 
} from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useAppointments } from '@/lib/api/hooks/use-appointments'
import { CalendarGrid } from '@/components/agenda/CalendarGrid'
import { AppointmentModal } from '@/components/agenda/AppointmentModal'
import { Button } from '@/components/ui/Button'
import { getDateRange, getRangeLabel } from '@/lib/utils/dates'

export default function AgendaPage() {
  const [view, setView] = useState<'day' | 'week' | 'month'>('week')
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { hasPermission } = useAuthStore()

  // 1. Guardia de seguridad y permisos
  const canView = hasPermission('agenda.view')

  // 2. Obtener fechas de rango
  const { from, to } = getDateRange(view, currentDate)

  // 3. Sincronizar datos de la API (startDate y endDate son los params esperados por el hook)
  const { data, isLoading } = useAppointments({ 
    startDate: from, 
    endDate: to 
  })

  if (!canView) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50 min-h-[calc(100vh-10rem)]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-slate-100 rounded-3xl p-8 max-w-md w-full text-center shadow-xl shadow-slate-100/50"
        >
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Acceso Denegado</h2>
          <p className="text-slate-500 text-sm mb-6">
            No tienes los permisos necesarios para visualizar la agenda médica y gestionar las citas. Por favor contacta al administrador.
          </p>
        </motion.div>
      </div>
    )
  }

  // 4. Lógica de navegación temporal
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
    // Clear select details optionally or keep it for smooth closing fade out
  }

  const appointments = data?.data || []

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      {/* Cabecera Premium */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Calendar size={22} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Agenda & Citas</h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-0.5">Control de Consultas Médicas</p>
          </div>
        </div>

        {/* Rango Temporal & Navegación */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-xl p-1 shadow-inner">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handlePrevious}
              icon={<ChevronLeft size={16} />}
              className="p-1.5 h-8 w-8 hover:bg-white rounded-lg text-slate-500"
            >
              {""}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleToday}
              className="h-8 text-xs font-bold text-slate-700 px-3 hover:bg-white rounded-lg"
            >
              Hoy
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleNext}
              icon={<ChevronRight size={16} />}
              className="p-1.5 h-8 w-8 hover:bg-white rounded-lg text-slate-500"
            >
              {""}
            </Button>
          </div>

          <span className="text-sm font-extrabold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 min-w-[150px] text-center shadow-inner">
            {getRangeLabel(view, currentDate)}
          </span>
        </div>

        {/* Selectores de Vista */}
        <div className="flex bg-slate-50 border border-slate-100 rounded-2xl p-1 shadow-inner self-start md:self-auto">
          {(['day', 'week', 'month'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 uppercase tracking-wider ${
                view === v 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {v === 'day' ? 'Día' : v === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
      </div>

      {/* Grilla de Calendario */}
      <CalendarGrid
        view={view}
        currentDate={currentDate}
        appointments={appointments}
        isLoading={isLoading}
        onSelectAppointment={handleSelectAppointment}
      />

      {/* Modal de Detalle */}
      <AppointmentModal
        id={selectedAppointmentId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}
