'use client'

import React, { useEffect, useState } from 'react'
import { useClinicCommercial, useSaveClinicCommercial, type ClinicCommercial } from '@/lib/api/hooks/use-platform'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

type Campo = {
  key: keyof ClinicCommercial
  label: string
  hint?: string
  /** El formulario muestra porcentaje; se guarda como fracción. */
  porcentaje?: boolean
}

const COMERCIALES: Campo[] = [
  { key: 'monthlyFeeUsd', label: 'Mensualidad (USD)' },
  { key: 'avgTicket', label: 'Ticket promedio', hint: 'Primera consulta o tratamiento, en su moneda. Sin él no hay garantía.' },
  { key: 'usdRate', label: 'Tipo de cambio', hint: 'Cuánto vale 1 USD en su moneda.' },
]

const LINEA_BASE: Campo[] = [
  { key: 'weeklyAppointments', label: 'Citas por semana' },
  { key: 'noShowRate', label: 'Inasistencia (%)', porcentaje: true },
  { key: 'lostConsultationsWeek', label: 'Consultas perdidas por semana' },
  { key: 'firstResponseTimeSec', label: 'Primera respuesta (segundos)', hint: 'Mediana con recepción humana.' },
  { key: 'receptionHoursWeek', label: 'Horas de recepción por semana' },
]

function aTexto(v: unknown, porcentaje?: boolean): string {
  if (v == null || v === '') return ''
  const n = Number(v)
  return porcentaje ? String(Math.round(n * 1000) / 10) : String(n)
}

/**
 * Condiciones comerciales y línea base previa al piloto. Las carga el equipo
 * de Dentral: con ellas se calculan el ingreso estimado, la garantía y la
 * comparación "antes y después" del panel de la clínica.
 */
export function ClinicCommercialCard({ clinicId }: { clinicId: string }) {
  const { data, isLoading } = useClinicCommercial(clinicId)
  const guardar = useSaveClinicCommercial(clinicId)
  const [form, setForm] = useState<Record<string, string>>({})
  const [moneda, setMoneda] = useState('CLP')
  const [inicio, setInicio] = useState('')
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    if (!data) return
    const f: Record<string, string> = {}
    for (const c of [...COMERCIALES, ...LINEA_BASE]) f[c.key] = aTexto(data[c.key], c.porcentaje)
    setForm(f)
    setMoneda(data.currency || 'CLP')
    setInicio(data.pilotStartedAt ? String(data.pilotStartedAt).slice(0, 10) : '')
  }, [data])

  if (isLoading) return <div data-card className="py-8 flex justify-center"><Spinner /></div>

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    const datos: Record<string, unknown> = { currency: moneda.trim().toUpperCase() || 'CLP', pilotStartedAt: inicio ? new Date(`${inicio}T12:00:00`).toISOString() : null }
    for (const c of [...COMERCIALES, ...LINEA_BASE]) {
      const t = (form[c.key] ?? '').trim().replace(',', '.')
      if (t === '') {
        // Los obligatorios no se pueden vaciar; el resto, vacío = sin dato.
        if (c.key !== 'monthlyFeeUsd' && c.key !== 'usdRate') datos[c.key] = null
        continue
      }
      const n = Number(t)
      if (Number.isNaN(n)) continue
      datos[c.key] = c.porcentaje ? n / 100 : n
    }
    guardar.mutate(datos as any, { onSuccess: () => { setGuardado(true); setTimeout(() => setGuardado(false), 2000) } })
  }

  const campo = (c: Campo) => (
    <label key={c.key} className="flex flex-col gap-1 min-w-0">
      <span data-lbl>{c.label}</span>
      <input
        data-inp
        inputMode="decimal"
        className="tabular"
        value={form[c.key] ?? ''}
        onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.value }))}
        style={{ height: 34 }}
      />
      {c.hint && <span className="text-[11px] text-[var(--muted)] leading-snug">{c.hint}</span>}
    </label>
  )

  return (
    <form onSubmit={enviar} data-card>
      <div data-hd>
        <h2>Comercial y línea base</h2>
        {data?.updatedAt && <span data-lbl>Actualizado {new Date(data.updatedAt).toLocaleDateString('es-CL')}</span>}
      </div>
      <div className="px-[18px] py-3.5 flex flex-col gap-4">
        <div className="grid gap-3 grid-cols-2">
          {COMERCIALES.map(campo)}
          <label className="flex flex-col gap-1">
            <span data-lbl>Moneda</span>
            <input data-inp value={moneda} onChange={(e) => setMoneda(e.target.value)} maxLength={3} style={{ height: 34 }} />
          </label>
          <label className="flex flex-col gap-1 col-span-2">
            <span data-lbl>Inicio del piloto</span>
            <input data-inp type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} style={{ height: 34 }} />
          </label>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[12px] text-[var(--muted)]">Línea base: promedio de las 4 a 8 semanas antes del piloto, sacado de su sistema de fichas.</span>
          <div className="grid gap-3 grid-cols-2">{LINEA_BASE.map(campo)}</div>
        </div>
      </div>
      <div className="px-[18px] py-3 border-t border-[var(--line)] bg-[var(--head)] flex items-center justify-end gap-3">
        {guardar.isError && <span className="text-[12px] text-[var(--neg)]">{(guardar.error as Error)?.message}</span>}
        {guardado && <span className="text-[12px] text-[var(--pos)]">Guardado</span>}
        <Button type="submit" size="sm" loading={guardar.isPending}>Guardar</Button>
      </div>
    </form>
  )
}
