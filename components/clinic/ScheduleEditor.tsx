import React, { useState, useEffect } from 'react'
import { useClinicSchedules, useUpdateSchedules } from '@/lib/api/hooks/use-clinic'
import { useUIStore } from '@/lib/stores/ui.store'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Calendar, Save, Clock, AlertCircle } from 'lucide-react'
import { IClinicSchedule } from '@/lib/types'

const DAYS_MAP: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  0: 'Domingo',
}

// Order of rendering: Lunes (1) to Domingo (0)
const DAYS_ORDER = [1, 2, 3, 4, 5, 6, 0]

export interface ScheduleEditorProps {
  readOnly?: boolean
}

export const ScheduleEditor: React.FC<ScheduleEditorProps> = ({ readOnly }) => {
  const { data: remoteSchedules, isLoading, isError } = useClinicSchedules()
  const { mutate: updateSchedules, isPending } = useUpdateSchedules()
  const addToast = useUIStore((state) => state.addToast)

  const [schedules, setSchedules] = useState<IClinicSchedule[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [errors, setErrors] = useState<Record<number, string>>({})

  // Populate local state on load
  useEffect(() => {
    if (remoteSchedules && !isInitialized) {
      // Ensure we sort or map schedules cleanly
      const sorted = [...remoteSchedules].sort(
        (a, b) => DAYS_ORDER.indexOf(a.day_of_week) - DAYS_ORDER.indexOf(b.day_of_week)
      )
      setSchedules(sorted)
      setIsInitialized(true)
    }
  }, [remoteSchedules, isInitialized])

  const handleToggle = (dayOfWeek: number) => {
    setSchedules((prev) =>
      prev.map((item) =>
        item.day_of_week === dayOfWeek
          ? { ...item, is_open: !item.is_open }
          : item
      )
    )
    // Clear error for that day if toggled
    setErrors((prev) => {
      const next = { ...prev }
      delete next[dayOfWeek]
      return next
    })
  }

  const handleTimeChange = (
    dayOfWeek: number,
    field: 'open_time' | 'close_time',
    value: string
  ) => {
    setSchedules((prev) =>
      prev.map((item) =>
        item.day_of_week === dayOfWeek
          ? { ...item, [field]: value }
          : item
      )
    )
    // Clear error for that day if edited
    setErrors((prev) => {
      const next = { ...prev }
      delete next[dayOfWeek]
      return next
    })
  }

  const validate = () => {
    const newErrors: Record<number, string> = {}
    let isValid = true

    schedules.forEach((item) => {
      if (item.is_open) {
        if (!item.open_time || !item.close_time) {
          newErrors[item.day_of_week] = 'Ambas horas son requeridas'
          isValid = false
        } else if (item.open_time >= item.close_time) {
          newErrors[item.day_of_week] = 'La hora de apertura debe ser menor a la hora de cierre'
          isValid = false
        }
      }
    })

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      addToast({
        title: 'Error de validación',
        message: 'Hay inconsistencias en las horas ingresadas.',
        type: 'error',
      })
      return
    }

    updateSchedules(schedules, {
      onSuccess: () => {
        addToast({
          title: 'Horarios actualizados',
          message: 'El horario de atención semanal se ha guardado con éxito.',
          type: 'success',
        })
      },
      onError: () => {
        addToast({
          title: 'Error al guardar',
          message: 'Ocurrió un error al guardar los horarios.',
          type: 'error',
        })
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-100 shadow-sm min-h-[400px]">
        <Spinner size="lg" className="text-indigo-600 mb-4 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Cargando horario semanal...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-100 rounded-3xl text-center max-w-2xl mx-auto">
        <p className="text-sm font-semibold text-rose-600">
          No se pudo cargar el horario de la clínica. Por favor, intente de nuevo.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="schedule-form"
      className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200"
    >
      <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">Horario de Atención</h2>
          <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-0.5">
            Define los días y rangos horarios laborables
          </p>
        </div>
        <Calendar size={20} className="text-indigo-500" />
      </div>

      <div className="divide-y divide-slate-50">
        {schedules.map((day) => {
          const dayName = DAYS_MAP[day.day_of_week] || `Día ${day.day_of_week}`
          const errorMsg = errors[day.day_of_week]

          return (
            <div
              key={day.id || day.day_of_week}
              className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 first:pt-0 last:pb-0"
              data-testid={`schedule-row-${day.day_of_week}`}
            >
              {/* Left: Day & Toggle */}
              <div className="flex items-center gap-4 min-w-[150px]">
                <button
                  type="button"
                  aria-label={`Toggle ${dayName}`}
                  onClick={() => !readOnly && handleToggle(day.day_of_week)}
                  disabled={readOnly}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:ring-2 focus:ring-indigo-100 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                    day.is_open ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      day.is_open ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-sm font-semibold text-slate-800">{dayName}</span>
              </div>

              {/* Right: Time Range & Validation Info */}
              <div className="flex flex-col gap-1.5 flex-1 max-w-sm sm:items-end">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="time"
                      aria-label={`${dayName} Hora Apertura`}
                      value={day.open_time}
                      disabled={!day.is_open || readOnly}
                      onChange={(e) => handleTimeChange(day.day_of_week, 'open_time', e.target.value)}
                      className={`px-3 py-1.5 bg-slate-50 border rounded-xl text-sm font-medium text-slate-700 transition-all focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
                        errorMsg ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200'
                      }`}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-400">a</span>
                  <div className="relative">
                    <input
                      type="time"
                      aria-label={`${dayName} Hora Cierre`}
                      value={day.close_time}
                      disabled={!day.is_open || readOnly}
                      onChange={(e) => handleTimeChange(day.day_of_week, 'close_time', e.target.value)}
                      className={`px-3 py-1.5 bg-slate-50 border rounded-xl text-sm font-medium text-slate-700 transition-all focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
                        errorMsg ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200'
                      }`}
                    />
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-xs font-medium text-rose-500 flex items-center gap-1 mt-1 sm:text-right">
                    <AlertCircle size={12} />
                    {errorMsg}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {!readOnly && (
        <div className="flex justify-end pt-4 border-t border-slate-50">
          <Button
            type="submit"
            loading={isPending}
            icon={<Save size={18} />}
            className="min-w-[160px]"
          >
            Guardar Horarios
          </Button>
        </div>
      )}
    </form>
  )
}
