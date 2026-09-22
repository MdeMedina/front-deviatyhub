'use client'

import React from 'react'
import { Plus, Trash2, Save, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useClinicSchedules } from '@/lib/api/hooks/use-clinic'
import { useDoctorSchedule, useSaveDoctorSchedule } from '@/lib/api/hooks/use-doctor-schedule'
import type { IScheduleBlock } from '@/lib/types'

/** Orden de lectura humano. El índice guardado sigue siendo 0 = domingo. */
const DIAS = [
  { dow: 1, label: 'Lunes' },
  { dow: 2, label: 'Martes' },
  { dow: 3, label: 'Miércoles' },
  { dow: 4, label: 'Jueves' },
  { dow: 5, label: 'Viernes' },
  { dow: 6, label: 'Sábado' },
  { dow: 0, label: 'Domingo' },
]

interface Props {
  doctorId: string
  doctorName?: string
  readOnly?: boolean
}

export function WeeklyScheduleEditor({ doctorId, doctorName, readOnly = false }: Props) {
  const { data: clinica } = useClinicSchedules()
  const { data: guardados, isLoading } = useDoctorSchedule(doctorId)
  const guardar = useSaveDoctorSchedule(doctorId)

  const [bloques, setBloques] = React.useState<IScheduleBlock[]>([])
  const [tocado, setTocado] = React.useState(false)

  React.useEffect(() => {
    if (guardados) {
      setBloques(guardados)
      setTocado(false)
    }
  }, [guardados])

  const horarioClinica = (dow: number) => clinica?.find((c) => c.day_of_week === dow)

  const actualizar = (next: IScheduleBlock[]) => {
    setBloques(next)
    setTocado(true)
  }

  const añadirTramo = (dow: number) => {
    const c = horarioClinica(dow)
    actualizar([
      ...bloques,
      { day_of_week: dow, start_time: c?.open_time ?? '09:00', end_time: c?.close_time ?? '18:00' },
    ])
  }

  const quitarTramo = (i: number) => actualizar(bloques.filter((_, idx) => idx !== i))

  const cambiar = (i: number, campo: 'start_time' | 'end_time', valor: string) =>
    actualizar(bloques.map((b, idx) => (idx === i ? { ...b, [campo]: valor } : b)))

  /**
   * Avisos, no bloqueos. La clínica es el límite exterior y el servidor ya
   * recorta, así que un tramo que se sale no rompe nada: simplemente no
   * generará horas. Decirlo aquí evita que alguien crea que atiende a las 08:00.
   */
  const avisoDe = (b: IScheduleBlock): string | null => {
    if (b.start_time >= b.end_time) return 'Termina antes de empezar'
    const c = horarioClinica(b.day_of_week)
    if (!c || !c.is_open) return 'La clínica está cerrada ese día'
    if (b.start_time < c.open_time || b.end_time > c.close_time) {
      return `Fuera del horario de la clínica (${c.open_time}–${c.close_time}); solo contará la parte de dentro`
    }
    return null
  }

  const solapados = (dow: number): boolean => {
    const delDia = bloques.filter((b) => b.day_of_week === dow)
    return delDia.some((a, i) =>
      delDia.some((b, j) => i !== j && a.start_time < b.end_time && a.end_time > b.start_time),
    )
  }

  const hayErrores = bloques.some((b) => b.start_time >= b.end_time) || DIAS.some((d) => solapados(d.dow))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-[15px] font-semibold text-[var(--ink)]">
          Jornada semanal{doctorName ? ` · ${doctorName}` : ''}
        </h2>
        <p className="text-[13px] text-[var(--muted)] leading-relaxed">
          Las horas que se ofrecen a los pacientes son las de esta jornada. Un día puede tener
          varios tramos: así se representa una jornada partida, y también que no atiendes una
          parte del día. Un día sin tramos es un día en el que no se te agenda nada.
        </p>
      </div>

      <div className="flex flex-col divide-y divide-[var(--line)] border border-[var(--line)] rounded-[10px] overflow-hidden bg-[var(--card)]">
        {DIAS.map(({ dow, label }) => {
          const delDia = bloques
            .map((b, i) => ({ b, i }))
            .filter(({ b }) => b.day_of_week === dow)
          const c = horarioClinica(dow)
          const cerrada = !c || !c.is_open

          return (
            <div key={dow} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:gap-4">
              <div className="w-full sm:w-32 shrink-0 pt-1.5">
                <span className="text-[13px] font-medium text-[var(--ink)]">{label}</span>
                <p className="text-[11px] text-[var(--muted)]">
                  {cerrada ? 'Clínica cerrada' : `Clínica ${c!.open_time}–${c!.close_time}`}
                </p>
              </div>

              <div className="flex flex-1 flex-col gap-2 min-w-0">
                {delDia.length === 0 && (
                  <span className="text-[12px] text-[var(--muted)] py-1.5">No atiende</span>
                )}

                {delDia.map(({ b, i }) => {
                  const aviso = avisoDe(b)
                  return (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          type="time"
                          value={b.start_time}
                          disabled={readOnly}
                          onChange={(e) => cambiar(i, 'start_time', e.target.value)}
                          className="px-2 py-1.5 text-[13px] rounded-[7px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] disabled:opacity-60"
                        />
                        <span className="text-[13px] text-[var(--muted)]">a</span>
                        <input
                          type="time"
                          value={b.end_time}
                          disabled={readOnly}
                          onChange={(e) => cambiar(i, 'end_time', e.target.value)}
                          className="px-2 py-1.5 text-[13px] rounded-[7px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] disabled:opacity-60"
                        />
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => quitarTramo(i)}
                            aria-label={`Quitar tramo de ${label}`}
                            className="p-1.5 rounded-[7px] text-[var(--muted)] hover:text-[var(--neg)] hover:bg-[var(--head)] transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                      {aviso && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--neg)]">
                          <AlertTriangle size={12} /> {aviso}
                        </span>
                      )}
                    </div>
                  )
                })}

                {solapados(dow) && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--neg)]">
                    <AlertTriangle size={12} /> Hay tramos que se pisan entre sí
                  </span>
                )}

                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => añadirTramo(dow)}
                    className="inline-flex items-center gap-1.5 self-start text-[12px] text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                  >
                    <Plus size={13} /> Añadir tramo
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {!readOnly && (
        <div className="flex items-center gap-3">
          <Button
            onClick={() => guardar.mutate(bloques)}
            disabled={!tocado || hayErrores || guardar.isPending}
          >
            <Save size={15} /> {guardar.isPending ? 'Guardando…' : 'Guardar jornada'}
          </Button>
          {hayErrores && (
            <span className="text-[12px] text-[var(--neg)]">Corrige los tramos marcados</span>
          )}
          {guardar.isSuccess && !tocado && (
            <span className="text-[12px] text-[var(--muted)]">Guardado</span>
          )}
        </div>
      )}
    </div>
  )
}
