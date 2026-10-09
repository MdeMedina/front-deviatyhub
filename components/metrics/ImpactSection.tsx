'use client'

import React from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import {
  dinero,
  pct,
  useClinicGuarantee,
  useClinicImpact,
  type GuaranteeMonth,
} from '@/lib/api/hooks/use-impact'
import { Spinner } from '@/components/ui/Spinner'

type Estado = 'ok' | 'bajo' | 'sin'

const COLOR: Record<Estado, string> = { ok: 'var(--pos)', bajo: 'var(--neg)', sin: 'var(--dim)' }
/** Franja superior de la tarjeta: sin datos va del color del borde, no gris oscuro. */
const FRANJA: Record<Estado, string> = { ok: 'var(--pos)', bajo: 'var(--neg)', sin: 'var(--line)' }
const ETIQUETA: Record<Estado, string> = { ok: 'En meta', bajo: 'Bajo la meta', sin: 'Sin datos' }

/** Una métrica de impacto: valor, meta de la especificación y si se cumple. */
function Kpi({ titulo, valor, meta, estado, detalle }: {
  titulo: string
  valor: React.ReactNode
  meta: string
  estado: Estado
  detalle?: React.ReactNode
}) {
  return (
    <div data-card className="flex flex-col min-w-0" style={{ borderTop: `3px solid ${FRANJA[estado]}` }}>
      <div className="px-4 pt-3.5 pb-3 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[13px] font-semibold text-[var(--ink)] leading-snug">{titulo}</span>
          <span data-badge className="shrink-0">
            <span data-dot style={{ background: COLOR[estado] }} />
            {ETIQUETA[estado]}
          </span>
        </div>
        <span className="tabular text-[26px] font-semibold tracking-[-0.02em] text-[var(--ink)] leading-none">{valor}</span>
        {detalle && <span className="text-[12px] text-[var(--ink-soft)] leading-snug">{detalle}</span>}
      </div>
      <div className="px-4 py-2 border-t border-[var(--line)] bg-[var(--head)] flex flex-col gap-0.5">
        <span data-lbl>Meta</span>
        <span className="text-[12px] text-[var(--ink-soft)]">{meta}</span>
      </div>
    </div>
  )
}

const ESTADO_GARANTIA: Record<GuaranteeMonth['status'], { texto: string; color: string }> = {
  SIN_TICKET: { texto: 'Falta el ticket promedio', color: 'var(--dim)' },
  EN_CURSO: { texto: 'En curso', color: 'var(--blue)' },
  GUARANTEE_ACHIEVED: { texto: 'Cumplida', color: 'var(--pos)' },
  GUARANTEE_TRIGGERED: { texto: 'No cumplida: el mes siguiente no se cobra', color: 'var(--neg)' },
}

function nombreDelMes(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { month: 'long' })
}

function TarjetaGarantia() {
  const { data: g, isLoading } = useClinicGuarantee()
  if (isLoading || !g) return <div data-card className="py-8 flex justify-center"><Spinner /></div>
  const m = g.current_month
  const anterior = g.previous_month
  const avance = Math.min(100, m.progress ?? 0)

  return (
    <div data-card style={{ borderTop: `3px solid ${m.status === 'SIN_TICKET' ? 'var(--line)' : ESTADO_GARANTIA[m.status].color}` }}>
      <div data-hd>
        <h2>Garantía de {nombreDelMes(m.from)}</h2>
        <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--ink-soft)]">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: ESTADO_GARANTIA[m.status].color }} />
          {ESTADO_GARANTIA[m.status].texto}
        </span>
      </div>
      <div className="px-[18px] py-4 flex flex-col gap-3">
        {m.status === 'SIN_TICKET' ? (
          <p className="text-[13px] text-[var(--muted)] leading-relaxed">
            Para calcular la garantía hace falta el ticket promedio de tu clínica. Lo carga el equipo de Dentral.
          </p>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <span className="text-[13px] text-[var(--ink-soft)]">
                <span className="tabular text-[22px] font-semibold text-[var(--ink)]">{m.attributedAttended}</span>
                {' '}de <span className="tabular">{m.thresholdAppointments}</span> citas asistidas que agendó el agente
              </span>
              <span className="tabular text-[13px] text-[var(--muted)]">{m.progress ?? 0} %</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden" role="progressbar" aria-valuenow={avance} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${avance}%`, background: m.guaranteeMet ? 'var(--pos)' : 'var(--blue)' }} />
            </div>
            <p className="text-[12px] text-[var(--muted)] leading-relaxed">
              Con {m.thresholdAppointments} citas asistidas al ticket promedio ({dinero(g.avg_ticket, g.currency)}) se paga la mensualidad
              de US$ {m.monthlyFeeUsd}. Si el mes cierra por debajo, el siguiente no se cobra.
            </p>
          </>
        )}
        {anterior.status !== 'SIN_TICKET' && (
          <p className="text-[12px] text-[var(--ink-soft)] border-t border-[var(--line)] pt-3">
            {nombreDelMes(anterior.from)}: {anterior.attributedAttended} de {anterior.thresholdAppointments} ·{' '}
            <span style={{ color: ESTADO_GARANTIA[anterior.status].color }}>{ESTADO_GARANTIA[anterior.status].texto}</span>
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Lo que el agente le aporta a la clínica, contra las metas del piloto y su
 * línea base. Sin datos (asistencia sin marcar, ticket o línea base sin
 * cargar) se dice "Sin datos" en vez de mostrar un cero que parece real.
 */
export function ImpactSection({ days }: { days: number }) {
  const { data: imp, isLoading, isError } = useClinicImpact(days)
  const { data: g } = useClinicGuarantee()

  if (isLoading) return <div data-card className="py-10 flex justify-center"><Spinner /></div>
  if (isError || !imp) return null

  const b = imp.business
  const t = imp.targets
  const estado = (v: number | null, meta: number, menorEsMejor = false): Estado =>
    v == null ? 'sin' : (menorEsMejor ? v <= meta : v >= meta) ? 'ok' : 'bajo'

  // Retorno: ingreso del periodo llevado a 30 días, en USD, contra la mensualidad.
  const retorno =
    b.estimated_revenue != null && g?.usd_rate && g.current_month.monthlyFeeUsd
      ? (b.estimated_revenue / g.usd_rate) * (30 / imp.period_days) / g.current_month.monthlyFeeUsd
      : null

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[16px] font-semibold text-[var(--ink)] tracking-[-0.012em]">Impacto del agente</h2>
          <p className="text-[12.5px] text-[var(--muted)]">Últimos {imp.period_days} días, contra las metas del piloto.</p>
        </div>
        {b.unmarked_appointments > 0 && (
          <Link href="/agenda" className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--neg)] hover:underline">
            <AlertTriangle size={13} />
            {b.unmarked_appointments} cita{b.unmarked_appointments === 1 ? '' : 's'} pasada{b.unmarked_appointments === 1 ? '' : 's'} sin marcar asistencia
          </Link>
        )}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-start">
        <TarjetaGarantia />
        <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
          <Kpi
            titulo="Ingreso estimado"
            valor={dinero(b.estimated_revenue, imp.currency)}
            meta={`${t.roiMultiple}× la mensualidad`}
            estado={estado(retorno, t.roiMultiple)}
            detalle={retorno != null ? `${retorno.toFixed(1)}× la mensualidad` : `${b.attended_appointments} asistidas`}
          />
          <Kpi
            titulo="Asistencia"
            valor={pct(b.attendance_rate)}
            meta={`−${Math.round(t.noShowReduction * 100)} % de inasistencia`}
            estado={estado(b.no_show_reduction, t.noShowReduction)}
            detalle={b.baseline_no_show_rate != null && b.no_show_rate != null
              ? `Inasistencia ${pct(b.no_show_rate)} (antes ${pct(b.baseline_no_show_rate)})`
              : `${b.no_show_appointments} sin asistir`}
          />
          <Kpi
            titulo="Conversión"
            valor={pct(b.conversion_rate)}
            meta={`> ${Math.round(t.conversion * 100)} %`}
            estado={estado(b.conversion_rate, t.conversion)}
            detalle={`de ${b.conversations_with_booking_intent} que quisieron agendar`}
          />
          <Kpi
            titulo="Rescate 24/7"
            valor={pct(b.after_hours_share)}
            meta={`> ${Math.round(t.afterHoursShare * 100)} % de las citas`}
            estado={estado(b.after_hours_share, t.afterHoursShare)}
            detalle={`${b.after_hours_appointments} de ${b.agent_appointments} con la clínica cerrada`}
          />
          <Kpi
            titulo="Primera respuesta"
            valor={b.first_response_p50_sec != null ? `${b.first_response_p50_sec} s` : '—'}
            meta={`< ${t.frtP50Sec} s (mediana)`}
            estado={estado(b.first_response_p50_sec, t.frtP50Sec, true)}
            detalle={b.baseline_first_response_sec != null ? `Antes: ${Math.round(b.baseline_first_response_sec / 60)} min` : undefined}
          />
          <Kpi
            titulo="Resueltas sin equipo"
            valor={pct(b.autonomy_rate)}
            meta={`> ${Math.round(t.autonomy * 100)} %`}
            estado={estado(b.autonomy_rate, t.autonomy)}
            detalle={`${b.conversations} conversaciones`}
          />
          <Kpi
            titulo="Horas ahorradas"
            valor={`${b.reception_hours_saved} h`}
            meta={`≥ ${t.hoursSavedMonth} h al mes`}
            estado={estado(b.reception_hours_saved_month, t.hoursSavedMonth)}
            detalle={`≈ ${b.reception_hours_saved_month} h/mes · ${b.agent_messages} respuestas`}
          />
          <Kpi
            titulo="Citas del agente"
            valor={`${b.agent_appointments}`}
            meta="—"
            estado={b.agent_appointments > 0 ? 'ok' : 'sin'}
            detalle={`${b.attended_appointments} asistidas · ${b.unmarked_appointments} sin marcar`}
          />
        </div>
      </div>
    </section>
  )
}
