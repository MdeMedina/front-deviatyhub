'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePlatformClinicsMetrics, usePlatformHealth, type PlatformHealth } from '@/lib/api/hooks/use-platform'
import { dinero, pct } from '@/lib/api/hooks/use-impact'
import { Spinner } from '@/components/ui/Spinner'
import { Dot, PageHeader, PlatformOnly } from '@/components/backoffice/shared'

export default function PlatformMetricsPage() {
  return (
    <PlatformOnly>
      <Metricas />
    </PlatformOnly>
  )
}

type Tono = 'pos' | 'neg' | 'dim'

const seg = (ms: number | null | undefined) => (ms == null ? '—' : ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`)
const usd = (v: number | null | undefined) => (v == null ? '—' : `US$ ${v.toFixed(2)}`)

/** Una fila de la tabla de SLA: valor actual, meta, alerta y estado. */
interface FilaSla { metrica: string; valor: string; meta: string; alerta: string; tono: Tono; nota?: string }

function filasSla(h: PlatformHealth): FilaSla[] {
  const s = h.sla
  const e2e = h.latency.end_to_end
  const cola = h.queue
  const tono = (ok: boolean | null): Tono => (ok == null ? 'dim' : ok ? 'pos' : 'neg')
  return [
    {
      metrica: 'Mensajes sin respuesta',
      valor: `${h.unanswered.count}`,
      meta: '0',
      alerta: `> 0 por más de ${s.unansweredAfterSec} s`,
      tono: tono(h.unanswered.count === 0),
    },
    {
      metrica: 'Latencia de punta a punta',
      valor: `p50 ${seg(e2e.p50)} · p95 ${seg(e2e.p95)}`,
      meta: `p50 < ${s.latencyP50Ms / 1000} s · p95 < ${s.latencyP95Ms / 1000} s`,
      alerta: 'p95 > 15 s',
      tono: tono(e2e.p50 == null ? null : e2e.p50 < s.latencyP50Ms && (e2e.p95 ?? 0) < s.latencyP95Ms),
      nota: `Dentro del modelo: p50 ${seg(h.latency.llm.p50)} · p95 ${seg(h.latency.llm.p95)}`,
    },
    {
      metrica: 'Webhook de Meta',
      valor: `p95 ${seg(h.latency.webhook_p95_ms)}`,
      meta: `< ${s.webhookMs} ms`,
      alerta: `> ${s.webhookAlertMs} ms`,
      tono: tono(h.latency.webhook_p95_ms == null ? null : h.latency.webhook_p95_ms < s.webhookMs),
    },
    {
      metrica: 'Cola de mensajes (BullMQ)',
      valor: cola.available ? `${cola.depth} en cola · la más antigua ${cola.oldest_waiting_age_sec} s` : 'Sin datos',
      meta: `< ${s.queueDepth}`,
      alerta: `> ${s.queueDepthAlert} o > ${s.queueAgeAlertSec} s`,
      tono: cola.available ? tono(cola.depth < s.queueDepth && cola.oldest_waiting_age_sec <= s.queueAgeAlertSec) : 'dim',
      nota: cola.available ? `Espera p95: ${seg(h.latency.queue_p95_ms)} · ${cola.failed_last_24h} fallidos en 24 h` : cola.error,
    },
    {
      metrica: 'Respuestas ilegibles del modelo',
      valor: pct(h.llm.parse_error_rate),
      meta: `< ${s.parseErrorRate * 100} %`,
      alerta: `> ${s.parseErrorAlertRate * 100} %`,
      tono: tono(h.llm.parse_error_rate == null ? null : h.llm.parse_error_rate < s.parseErrorRate),
      nota: `${h.llm.parse_errors} de ${h.llm.turns} turnos · ${h.llm.errors} errores`,
    },
    {
      metrica: 'Costo de IA, día',
      valor: usd(h.cost.last_24h_usd),
      meta: '—',
      alerta: `> US$ ${s.dailyCostAlertUsd} al día`,
      tono: tono(h.cost.last_24h_usd <= s.dailyCostAlertUsd),
    },
    { metrica: 'Integración con sistema de fichas', valor: 'No aplica', meta: '> 99 %', alerta: '—', tono: 'dim', nota: h.not_available.pms },
    { metrica: 'RAG en dos niveles', valor: 'No aplica', meta: '—', alerta: '—', tono: 'dim', nota: h.not_available.rag },
  ]
}

const GARANTIA: Record<string, { texto: string; tono: Tono }> = {
  SIN_TICKET: { texto: 'Sin ticket', tono: 'dim' },
  EN_CURSO: { texto: 'En curso', tono: 'dim' },
  GUARANTEE_ACHIEVED: { texto: 'Cumplida', tono: 'pos' },
  GUARANTEE_TRIGGERED: { texto: 'Activada', tono: 'neg' },
}

function Metricas() {
  const [dias, setDias] = useState(30)
  const { data: h, isLoading } = usePlatformHealth(dias)
  const { data: clinicas = [], isLoading: cargandoClinicas } = usePlatformClinicsMetrics(dias)

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Métricas de la plataforma"
        subtitle={h?.telemetry_since ? `Telemetría desde ${new Date(h.telemetry_since).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}.` : 'La telemetría por turno empieza con este despliegue.'}
        back={{ href: '/backoffice', label: 'Backoffice' }}
        actions={
          <div data-tabs>
            {[1, 7, 30].map((d) => (
              <button key={d} data-tab data-active={dias === d} onClick={() => setDias(d)}>
                {d === 1 ? '24 horas' : `${d} días`}
              </button>
            ))}
          </div>
        }
      />

      {isLoading || !h ? (
        <div className="py-16 flex justify-center"><Spinner /></div>
      ) : (
        <>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <div data-card className="px-4 py-3.5 flex flex-col gap-1.5">
              <span data-lbl>Costo de IA · {dias === 1 ? '24 h' : `${dias} d`}</span>
              <span className="tabular text-[24px] font-semibold text-[var(--ink)] leading-none">{usd(h.cost.total_usd)}</span>
              <span className="text-[12px] text-[var(--muted)]">Proyectado al mes: {usd(h.cost.projected_month_usd)}</span>
            </div>
            <div data-card className="px-4 py-3.5 flex flex-col gap-1.5">
              <span data-lbl>Turnos del agente</span>
              <span className="tabular text-[24px] font-semibold text-[var(--ink)] leading-none">{h.llm.turns}</span>
              <span className="text-[12px] text-[var(--muted)]">{h.llm.replied} respondidos · simulador {usd(h.cost.simulator_usd)}</span>
            </div>
            <div data-card className="px-4 py-3.5 flex flex-col gap-1.5">
              <span data-lbl>Latencia p95</span>
              <span className="tabular text-[24px] font-semibold text-[var(--ink)] leading-none">{seg(h.latency.end_to_end.p95)}</span>
              <span className="text-[12px] text-[var(--muted)]">Meta &lt; {h.sla.latencyP95Ms / 1000} s</span>
            </div>
            <div data-card className="px-4 py-3.5 flex flex-col gap-1.5">
              <span data-lbl>Sin respuesta ahora</span>
              <span className="tabular text-[24px] font-semibold leading-none" style={{ color: h.unanswered.count ? 'var(--neg)' : 'var(--ink)' }}>
                {h.unanswered.count}
              </span>
              <span className="text-[12px] text-[var(--muted)]">mensajes con más de {h.sla.unansweredAfterSec} s</span>
            </div>
          </div>

          <div data-card>
            <div data-hd><h2>SLA de la plataforma</h2><span data-lbl>Meta · alerta</span></div>
            <div style={{ overflowX: 'auto' }}>
              <table data-tbl>
                <thead>
                  <tr><th>Métrica</th><th>Ahora</th><th>Meta</th><th>Alerta</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {filasSla(h).map((f) => (
                    <tr key={f.metrica}>
                      <td>
                        <span className="flex flex-col">
                          <span className="font-medium text-[var(--ink)]">{f.metrica}</span>
                          {f.nota && <span className="text-[11.5px] text-[var(--dim)] max-w-[420px]">{f.nota}</span>}
                        </span>
                      </td>
                      <td className="tabular whitespace-nowrap">{f.valor}</td>
                      <td className="tabular text-[var(--muted)] whitespace-nowrap">{f.meta}</td>
                      <td className="tabular text-[var(--muted)] whitespace-nowrap">{f.alerta}</td>
                      <td>
                        <span data-badge><Dot tone={f.tono} />{f.tono === 'pos' ? 'En meta' : f.tono === 'neg' ? 'Fuera de meta' : 'Sin datos'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {h.unanswered.count > 0 && (
            <div data-card>
              <div data-hd><h2>Mensajes sin respuesta</h2><span data-lbl>últimas 24 h</span></div>
              <table data-tbl>
                <thead><tr><th>Clínica</th><th>Conversación</th><th>Esperando</th></tr></thead>
                <tbody>
                  {h.unanswered.items.map((u) => (
                    <tr key={u.conversation_id}>
                      <td className="font-medium text-[var(--ink)]">{u.clinic_name}</td>
                      <td className="tabular text-[12px] text-[var(--muted)]">{u.conversation_id}</td>
                      <td className="tabular">{u.waiting_sec >= 3600 ? `${Math.round(u.waiting_sec / 3600)} h` : `${Math.round(u.waiting_sec / 60)} min`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <div data-card>
        <div data-hd>
          <h2>Por clínica</h2>
          <span data-lbl>Costo unitario meta US$ {h?.sla.unitCostMinUsd ?? 41}–{h?.sla.unitCostMaxUsd ?? 58} al mes</span>
        </div>
        {cargandoClinicas ? (
          <div className="py-10 flex justify-center"><Spinner /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table data-tbl>
              <thead>
                <tr>
                  <th>Clínica</th>
                  <th style={{ textAlign: 'right' }}>Turnos</th>
                  <th style={{ textAlign: 'right' }}>IA al mes</th>
                  <th style={{ textAlign: 'right' }}>Citas agente</th>
                  <th style={{ textAlign: 'right' }}>Asistidas</th>
                  <th style={{ textAlign: 'right' }}>Ingreso estimado</th>
                  <th style={{ textAlign: 'right' }}>Autonomía</th>
                  <th>Garantía (mes)</th>
                  <th>Mes anterior</th>
                </tr>
              </thead>
              <tbody>
                {clinicas.map((c) => {
                  const actual = GARANTIA[c.guarantee.current.status] ?? GARANTIA.EN_CURSO
                  const previo = GARANTIA[c.guarantee.previous.status] ?? GARANTIA.EN_CURSO
                  return (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/backoffice/clinics/${c.id}`} className="font-medium text-[var(--ink)] hover:text-[var(--blue)]">{c.name}</Link>
                      </td>
                      <td className="tabular" style={{ textAlign: 'right' }}>{c.turns}</td>
                      <td className="tabular" style={{ textAlign: 'right' }}>{usd(c.ai_cost_month_usd)}</td>
                      <td className="tabular" style={{ textAlign: 'right' }}>{c.agent_appointments}</td>
                      <td className="tabular" style={{ textAlign: 'right' }}>
                        {c.attended}{c.unmarked > 0 && <span className="text-[var(--neg)]"> · {c.unmarked} sin marcar</span>}
                      </td>
                      <td className="tabular" style={{ textAlign: 'right' }}>{dinero(c.estimated_revenue, c.currency)}</td>
                      <td className="tabular" style={{ textAlign: 'right' }}>{pct(c.autonomy_rate)}</td>
                      <td>
                        <span data-badge>
                          <Dot tone={actual.tono} />{actual.texto}
                          {c.guarantee.current.thresholdAppointments != null && ` · ${c.guarantee.current.attributedAttended}/${c.guarantee.current.thresholdAppointments}`}
                        </span>
                      </td>
                      <td>
                        <span data-badge><Dot tone={previo.tono} />{previo.texto}{c.guarantee.previous.status === 'GUARANTEE_TRIGGERED' ? ' · factura US$ 0' : ''}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-[11.5px] text-[var(--dim)]">
        El costo de IA usa los precios públicos de OpenAI y cobra todos los tokens de entrada a precio normal (no descuenta los de caché),
        así que está ligeramente por encima del real. No incluye Meta ni la infraestructura.
      </p>
    </div>
  )
}
