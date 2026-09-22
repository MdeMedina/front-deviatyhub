'use client'

import React from 'react'
import { CalendarOff, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import {
  useCreateAbsence,
  useDeleteAbsence,
  useDoctorAbsences,
} from '@/lib/api/hooks/use-doctor-schedule'

interface Props {
  doctorId: string
  readOnly?: boolean
}

/** "2026-09-24" + "15:00" -> instante local, que es como lo entiende quien lo escribe. */
const aInstante = (fecha: string, hora: string) => new Date(`${fecha}T${hora}:00`)

const formatearRango = (desde: string, hasta: string, todoElDia?: boolean) => {
  const d = new Date(desde)
  const h = new Date(hasta)
  const fecha = (x: Date) =>
    x.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
  const hhmm = (x: Date) =>
    x.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })

  const mismoDia = fecha(d) === fecha(h)
  if (todoElDia && mismoDia) return `${fecha(d)} · todo el día`
  if (todoElDia) return `${fecha(d)} → ${fecha(h)}`
  if (mismoDia) return `${fecha(d)} · ${hhmm(d)}–${hhmm(h)}`
  return `${fecha(d)} ${hhmm(d)} → ${fecha(h)} ${hhmm(h)}`
}

export function AbsencesManager({ doctorId, readOnly = false }: Props) {
  const { data: ausencias, isLoading } = useDoctorAbsences(doctorId)
  const crear = useCreateAbsence(doctorId)
  const borrar = useDeleteAbsence(doctorId)

  const hoy = new Date().toISOString().slice(0, 10)
  const [abierto, setAbierto] = React.useState(false)
  const [todoElDia, setTodoElDia] = React.useState(true)
  const [desde, setDesde] = React.useState(hoy)
  const [hasta, setHasta] = React.useState(hoy)
  const [horaDesde, setHoraDesde] = React.useState('09:00')
  const [horaHasta, setHoraHasta] = React.useState('18:00')
  const [motivo, setMotivo] = React.useState('')
  const [avisoCitas, setAvisoCitas] = React.useState<number | null>(null)

  const inicio = todoElDia ? aInstante(desde, '00:00') : aInstante(desde, horaDesde)
  const fin = todoElDia
    ? new Date(aInstante(hasta, '00:00').getTime() + 24 * 60 * 60 * 1000)
    : aInstante(desde, horaHasta)
  const rangoValido = inicio < fin

  const limpiar = () => {
    setAbierto(false)
    setMotivo('')
    setTodoElDia(true)
    setDesde(hoy)
    setHasta(hoy)
  }

  const enviar = async () => {
    const res = await crear.mutateAsync({
      starts_at: inicio.toISOString(),
      ends_at: fin.toISOString(),
      all_day: todoElDia,
      reason: motivo.trim() || undefined,
    })
    // Las citas ya reservadas no se cancelan solas: son pacientes con hora dada.
    setAvisoCitas(res?.citas_afectadas ? res.citas_afectadas : null)
    limpiar()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-[15px] font-semibold text-[var(--ink)]">Ausencias</h2>
        <p className="text-[13px] text-[var(--muted)] leading-relaxed">
          Días u horas concretas en las que no vas a estar. Durante una ausencia no se te agenda
          nada, aunque caiga dentro de tu jornada habitual.
        </p>
      </div>

      {avisoCitas !== null && (
        <div className="flex items-start gap-2 p-3 rounded-[10px] border border-[var(--line)] bg-[var(--head)]">
          <AlertTriangle size={16} className="text-[var(--neg)] mt-0.5 shrink-0" />
          <p className="text-[12px] text-[var(--ink)] leading-relaxed">
            Hay <strong>{avisoCitas}</strong>{' '}
            {avisoCitas === 1 ? 'cita ya reservada' : 'citas ya reservadas'} dentro de esa ausencia.
            No se han cancelado: son pacientes que ya tienen su hora, así que hay que avisarles y
            reprogramarlas desde la agenda.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      ) : !ausencias?.length ? (
        <div className="flex items-center gap-2.5 p-4 rounded-[10px] border border-dashed border-[var(--line)]">
          <CalendarOff size={16} className="text-[var(--muted)]" />
          <span className="text-[13px] text-[var(--muted)]">No tienes ausencias registradas.</span>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--line)] border border-[var(--line)] rounded-[10px] overflow-hidden bg-[var(--card)]">
          {ausencias.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="text-[13px] text-[var(--ink)]">
                  {formatearRango(a.starts_at, a.ends_at, a.all_day)}
                </p>
                {a.reason && <p className="text-[12px] text-[var(--muted)] truncate">{a.reason}</p>}
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => borrar.mutate(a.id)}
                  aria-label="Eliminar ausencia"
                  className="p-1.5 rounded-[7px] text-[var(--muted)] hover:text-[var(--neg)] hover:bg-[var(--head)] transition-colors shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!readOnly && !abierto && (
        <Button variant="secondary" onClick={() => setAbierto(true)}>
          <Plus size={15} /> Registrar ausencia
        </Button>
      )}

      {!readOnly && abierto && (
        <div className="flex flex-col gap-3 p-4 rounded-[10px] border border-[var(--line)] bg-[var(--card)]">
          <label className="flex items-center gap-2 text-[13px] text-[var(--ink)]">
            <input
              type="checkbox"
              checked={todoElDia}
              onChange={(e) => setTodoElDia(e.target.checked)}
            />
            Días completos
          </label>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-[var(--muted)]">Desde</span>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="px-2 py-1.5 text-[13px] rounded-[7px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)]"
              />
            </div>

            {todoElDia ? (
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-[var(--muted)]">Hasta (incluido)</span>
                <input
                  type="date"
                  value={hasta}
                  min={desde}
                  onChange={(e) => setHasta(e.target.value)}
                  className="px-2 py-1.5 text-[13px] rounded-[7px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)]"
                />
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-[var(--muted)]">De</span>
                  <input
                    type="time"
                    value={horaDesde}
                    onChange={(e) => setHoraDesde(e.target.value)}
                    className="px-2 py-1.5 text-[13px] rounded-[7px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-[var(--muted)]">A</span>
                  <input
                    type="time"
                    value={horaHasta}
                    onChange={(e) => setHoraHasta(e.target.value)}
                    className="px-2 py-1.5 text-[13px] rounded-[7px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)]"
                  />
                </div>
              </>
            )}
          </div>

          <input
            type="text"
            value={motivo}
            maxLength={200}
            placeholder="Motivo (opcional)"
            onChange={(e) => setMotivo(e.target.value)}
            className="px-2.5 py-1.5 text-[13px] rounded-[7px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)]"
          />

          {!rangoValido && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--neg)]">
              <AlertTriangle size={12} /> El final va antes que el inicio
            </span>
          )}

          <div className="flex items-center gap-2">
            <Button onClick={enviar} disabled={!rangoValido || crear.isPending}>
              {crear.isPending ? 'Guardando…' : 'Guardar ausencia'}
            </Button>
            <Button variant="secondary" onClick={limpiar}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
