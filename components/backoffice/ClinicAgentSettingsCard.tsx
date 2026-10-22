'use client'

import React, { useEffect, useState } from 'react'
import { useAgentSettings, useSaveAgentSettings, type AgentSettings } from '@/lib/api/hooks/use-platform'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

const RECORDATORIOS = [
  { horas: 72, label: '3 días antes' },
  { horas: 24, label: '1 día antes' },
  { horas: 2, label: '2 horas antes' },
]

function Casilla({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-[3px] accent-[var(--blue)]" />
      <span className="flex flex-col">
        <span className="text-[14.5px] text-[var(--ink)]">{label}</span>
        {hint && <span className="text-[13px] text-[var(--muted)] leading-snug">{hint}</span>}
      </span>
    </label>
  )
}

/**
 * Cómo trabaja el agente en esta clínica: nombre, trato, anticipación,
 * evaluación primero, abono de la segunda evaluación y recordatorios.
 */
export function ClinicAgentSettingsCard({ clinicId }: { clinicId: string }) {
  const { data, isLoading } = useAgentSettings(clinicId)
  const guardar = useSaveAgentSettings(clinicId)
  const [f, setF] = useState<AgentSettings | null>(null)
  const [maxTexto, setMaxTexto] = useState('')
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    if (!data) return
    setF(data.settings)
    setMaxTexto(data.settings.anticipacionMaxDias == null ? '' : String(data.settings.anticipacionMaxDias))
  }, [data])

  if (isLoading || !f) return <div data-card className="py-8 flex justify-center"><Spinner /></div>

  const set = (patch: Partial<AgentSettings>) => setF((x) => (x ? { ...x, ...patch } : x))
  const toggleRecordatorio = (h: number, on: boolean) =>
    set({ recordatorios: { ...f.recordatorios, horas: on ? [...new Set([...f.recordatorios.horas, h])] : f.recordatorios.horas.filter((x) => x !== h) } })

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    const max = maxTexto.trim() === '' ? null : Number(maxTexto)
    guardar.mutate(
      { ...f, anticipacionMaxDias: max != null && !Number.isNaN(max) ? max : null },
      { onSuccess: () => { setGuardado(true); setTimeout(() => setGuardado(false), 2000) } },
    )
  }

  return (
    <form onSubmit={enviar} data-card>
      <div data-hd>
        <h2>Agente</h2>
        {data?.mode && <span data-lbl>Modo: {data.mode === 'PAUSED' ? 'en pausa' : data.mode === 'SUPERVISED' ? 'supervisado' : 'autónomo'}</span>}
      </div>
      <div className="px-[22px] py-3.5 flex flex-col gap-4">
        <div className="grid gap-3 grid-cols-2">
          <label className="flex flex-col gap-1 col-span-2">
            <span data-lbl>Nombre del asistente</span>
            <input data-inp value={f.nombre} onChange={(e) => set({ nombre: e.target.value })} placeholder="Vacío: «la recepcionista virtual»" style={{ height: 34 }} />
          </label>
          <label className="flex flex-col gap-1">
            <span data-lbl>Trato</span>
            <select data-inp value={f.trato} onChange={(e) => set({ trato: e.target.value as 'tu' | 'usted' })} style={{ height: 34 }}>
              <option value="tu">Tú</option>
              <option value="usted">Usted</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span data-lbl>Anticipación mínima (días)</span>
            <input data-inp inputMode="numeric" className="tabular" value={String(f.anticipacionMinDias)} onChange={(e) => set({ anticipacionMinDias: Math.max(0, parseInt(e.target.value || '0') || 0) })} style={{ height: 34 }} />
          </label>
          <label className="flex flex-col gap-1 col-span-2">
            <span data-lbl>Anticipación máxima (días)</span>
            <input data-inp inputMode="numeric" className="tabular" value={maxTexto} onChange={(e) => setMaxTexto(e.target.value)} placeholder="Vacío: sin tope" style={{ height: 34 }} />
          </label>
          <label className="flex flex-col gap-1 col-span-2">
            <span data-lbl>Cuándo responde el equipo</span>
            <input data-inp value={f.atencionHumana} onChange={(e) => set({ atencionHumana: e.target.value })} placeholder="de lunes a viernes de 9:00 a 18:00" style={{ height: 34 }} />
          </label>
        </div>
        <div className="flex flex-col gap-2.5">
          <Casilla checked={f.evaluacionPrimero} onChange={(v) => set({ evaluacionPrimero: v })} label="Paciente nuevo parte con evaluación" hint="Necesita un tratamiento marcado como evaluación inicial." />
          <Casilla checked={f.abonoEvaluacionRepetida} onChange={(v) => set({ abonoEvaluacionRepetida: v })} label="La segunda evaluación se reserva con abono" hint="El agente no la agenda: la pasa al equipo." />
        </div>
        <div className="flex flex-col gap-2">
          <span data-lbl>Recordatorios</span>
          <div className="flex flex-col gap-2">
            {RECORDATORIOS.map((r) => (
              <Casilla key={r.horas} checked={f.recordatorios.horas.includes(r.horas)} onChange={(v) => toggleRecordatorio(r.horas, v)} label={r.label} />
            ))}
            <Casilla
              checked={f.recordatorios.pedirConfirmacion}
              onChange={(v) => set({ recordatorios: { ...f.recordatorios, pedirConfirmacion: v } })}
              label="Pedir que confirme su asistencia"
            />
          </div>
        </div>
      </div>
      <div className="px-[22px] py-3 border-t border-[var(--line)] bg-[var(--head)] flex items-center justify-end gap-3">
        {guardar.isError && <span className="text-[13.5px] text-[var(--neg)]">{(guardar.error as Error)?.message}</span>}
        {guardado && <span className="text-[13.5px] text-[var(--pos)]">Guardado</span>}
        <Button type="submit" size="sm" loading={guardar.isPending}>Guardar</Button>
      </div>
    </form>
  )
}
