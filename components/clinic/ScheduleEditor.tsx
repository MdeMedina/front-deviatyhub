import React, { useState, useEffect } from 'react'
import { useClinicSchedules, useUpdateSchedules } from '@/lib/api/hooks/use-clinic'
import { useUIStore } from '@/lib/stores/ui.store'
import { Spinner } from '@/components/ui/Spinner'
import { Save, AlertCircle } from 'lucide-react'
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
        item.day_of_week === dayOfWeek ? { ...item, is_open: !item.is_open } : item
      )
    )
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
        item.day_of_week === dayOfWeek ? { ...item, [field]: value } : item
      )
    )
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
      <div data-card style={{ maxWidth: '760px' }}>
        <div style={{ padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '260px', gap: '8px' }}>
          <Spinner size="md" />
          <span className="microlabel text-[10px]">Cargando horario semanal...</span>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div data-card style={{ maxWidth: '760px' }}>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--neg)', margin: 0 }}>
            No se pudo cargar el horario de la clínica. Por favor, intente de nuevo.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} aria-label="schedule-form" data-card style={{ maxWidth: '760px' }}>
      <div data-hd>
        <h2>Horarios de atención</h2>
        <span data-lbl>Zona horaria: America/Santiago</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table data-tbl>
          <thead>
            <tr>
              <th>Día</th>
              <th>Estado</th>
              <th>Apertura</th>
              <th>Cierre</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((day) => {
              const dayName = DAYS_MAP[day.day_of_week] || `Día ${day.day_of_week}`
              const errorMsg = errors[day.day_of_week]

              return (
                <React.Fragment key={day.id || day.day_of_week}>
                  <tr data-testid={`schedule-row-${day.day_of_week}`}>
                    <td style={{ color: 'var(--ink)', fontWeight: 500 }}>{dayName}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '9px' }}>
                        <button
                          type="button"
                          aria-label={`Toggle ${dayName}`}
                          onClick={() => !readOnly && handleToggle(day.day_of_week)}
                          disabled={readOnly}
                          style={{
                            width: '38px',
                            height: '22px',
                            borderRadius: '999px',
                            border: '1px solid var(--line)',
                            background: day.is_open ? 'var(--blue)' : 'var(--surface-2)',
                            position: 'relative',
                            cursor: readOnly ? 'not-allowed' : 'pointer',
                            padding: 0,
                            opacity: readOnly ? 0.6 : 1,
                            transition: 'background-color .15s',
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              top: '2px',
                              left: day.is_open ? '18px' : '2px',
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              background: '#FFFFFF',
                              transition: 'left .15s',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                            }}
                          />
                        </button>
                        <span data-badge>
                          <span data-dot style={{ background: day.is_open ? 'var(--pos)' : undefined }} />
                          {day.is_open ? 'Abierto' : 'Cerrado'}
                        </span>
                      </span>
                    </td>
                    <td>
                      <input
                        type="time"
                        data-inp
                        aria-label={`${dayName} Hora Apertura`}
                        value={day.open_time}
                        disabled={!day.is_open || readOnly}
                        onChange={(e) => handleTimeChange(day.day_of_week, 'open_time', e.target.value)}
                        className="tabular"
                        style={{ height: '30px', width: '120px', borderColor: errorMsg ? 'var(--neg)' : undefined }}
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        data-inp
                        aria-label={`${dayName} Hora Cierre`}
                        value={day.close_time}
                        disabled={!day.is_open || readOnly}
                        onChange={(e) => handleTimeChange(day.day_of_week, 'close_time', e.target.value)}
                        className="tabular"
                        style={{ height: '30px', width: '120px', borderColor: errorMsg ? 'var(--neg)' : undefined }}
                      />
                    </td>
                  </tr>
                  {errorMsg && (
                    <tr>
                      <td colSpan={4} style={{ paddingTop: 0, borderBottom: '1px solid var(--line-soft)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--neg)' }}>
                          <AlertCircle size={12} />
                          {errorMsg}
                        </span>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '13px 20px', borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
          <button data-btn="primary" type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Spinner size="sm" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <Save size={14} strokeWidth={1.75} />
                <span>Guardar cambios</span>
              </>
            )}
          </button>
        </div>
      )}
    </form>
  )
}
