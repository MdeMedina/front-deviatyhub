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

const COLOR: Record<Tono, string> = { pos: 'var(--pos)', neg: 'var(--neg)', dim: 'var(--line)' }
const ESTADO: Record<Tono, string> = { pos: 'En meta', neg: 'Fuera de meta', dim: 'Sin datos' }

/** Un indicador de SLA. Con varias cifras (p50 y p95), cada una va por separado. */
interface Sla {
  metrica: string
  cifras: { etiqueta?: string; valor: string }[]
  meta: string
  alerta: string
  tono: Tono
  nota?: string
}

function indicadores(h: PlatformHealth): Sla[] {
  const s = h.sla
  const e2e = h.latency.end_to_end
  const cola = h.queue
  const tono = (ok: boolean | null): Tono => (ok == null ? 'dim' : ok ? 'pos' : 'neg')
  return [
    {
      metrica: 'Mensajes sin respuesta',
      cifras: [{ valor: `${h.unanswered.count}` }],
      meta: '0',
      alerta: `> 0 por más de ${s.unansweredAfterSec} s`,
      tono: tono(h.unanswered.count === 0),
    },
    {
      metrica: 'Latencia de punta a punta',
      cifras: [{ etiqueta: 'p50', valor: seg(e2e.p50) }, { etiqueta: 'p95', valor: seg(e2e.p95) }],
      meta: `p50 < ${s.latencyP50Ms / 1000} s · p95 < ${s.latencyP95Ms / 1000} s`,
      alerta: 'p95 > 15 s',
      tono: tono(e2e.p50 == null ? null : e2e.p50 < s.latencyP50Ms && (e2e.p95 ?? 0) < s.latencyP95Ms),
      nota: `Dentro del modelo: p50 ${seg(h.latency.llm.p50)} · p95 ${seg(h.latency.llm.p95)}`,
    },
    {
      metrica: 'Webhook de Meta',
      cifras: [{ etiqueta: 'p95', valor: seg(h.latency.webhook_p95_ms) }],
      meta: `< ${s.webhookMs} ms`,
      alerta: `> ${s.webhookAlertMs} ms`,
      tono: tono(h.latency.webhook_p95_ms == null ? null : h.latency.webhook_p95_ms < s.webhookMs),
    },
    {
      metrica: 'Cola de mensajes',
      cifras: cola.available
        ? [{ etiqueta: 'en cola', valor: `${cola.depth}` }, { etiqueta: 'la más antigua', valor: `${cola.oldest_waiting_age_sec} s` }]
        : [{ valor: '—' }],
      meta: `< ${s.queueDepth} en cola`,
      alerta: `> ${s.queueDepthAlert} o > ${s.queueAgeAlertSec} s`,
      tono: cola.available ? tono(cola.depth < s.queueDepth && cola.oldest_waiting_age_sec <= s.queueAgeAlertSec) : 'dim',
      nota: cola.available ? `Espera p95: ${seg(h.latency.queue_p95_ms)} · ${cola.failed_last_24h} fallidos en 24 h` : cola.error,
    },
    {
      metrica: 'Respuestas ilegibles del modelo',
      cifras: [{ valor: pct(h.llm.parse_error_rate) }],
      meta: `< ${s.parseErrorRate * 100} %`,
      alerta: `> ${s.parseErrorAlertRate * 100} %`,
      tono: tono(h.llm.parse_error_rate == null ? null : h.llm.parse_error_rate < s.parseErrorRate),
      nota: `${h.llm.parse_errors} de ${h.llm.turns} turnos · ${h.llm.errors} errores`,
    },
    {
      metrica: 'Costo de IA del día',
      cifras: [{ valor: usd(h.cost.last_24h_usd) }],
      meta: '—',
      alerta: `> US$ ${s.dailyCostAlertUsd} al día`,
      tono: tono(h.cost.last_24h_usd <= s.dailyCostAlertUsd),
    },
  ]
}

function TarjetaSla({ i }: { i: Sla }) {
  return (
    <div data-card className="flex flex-col min-w-0" style={{ borderTop: `3px solid ${COLOR[i.tono]}` }}>
      <div className="px-4 pt-3.5 pb-3 flex flex-col gap-2.5 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[13.5px] font-semibold text-[var(--ink)] leading-snug">{i.metrica}</span>
          <span data-badge className="shrink-0"><Dot tone={i.tono} />{ESTADO[i.tono]}</span>
        </div>
        <div className="flex items-end gap-5 flex-wrap">
          {i.cifras.map((c) => (
            <div key={c.etiqueta ?? 'valor'} className="flex flex-col gap-0.5">
              <span className="tabular text-[26px] font-semibold tracking-[-0.02em] text-[var(--ink)] leading-none">{c.valor}</span>
              {c.etiqueta && <span className="text-[11.5px] text-[var(--muted)]">{c.etiqueta}</span>}
            </div>
          ))}
        </div>
        {i.nota && <span className="text-[12px] text-[var(--muted)] leading-snug">{i.nota}</span>}
      </div>
      <dl className="grid grid-cols-2 border-t border-[var(--line)] bg-[var(--head)] text-[12px]">
        <div className="px-4 py-2 flex flex-col gap-0.5 border-r border-[var(--line)] min-w-0">
          <dt data-lbl>Meta</dt>
          <dd className="tabular text-[var(--ink-soft)]">{i.meta}</dd>
        </div>
        <div className="px-4 py-2 flex flex-col gap-0.5 min-w-0">
          <dt data-lbl>Alerta</dt>
          <dd className="tabular text-[var(--ink-soft)]">{i.alerta}</dd>
        </div>
      </dl>
    </div>
  )
}

/** Una cifra dentro de la tarjeta de una clínica. */
function Cifra({ etiqueta, valor, detalle }: { etiqueta: string; valor: React.ReactNode; detalle?: React.ReactNode }) {
  return (
    <div className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 flex flex-col gap-1 min-w-0">
      <span data-lbl>{etiqueta}</span>
      <span className="tabular text-[19px] font-semibold text-[var(--ink)] leading-none truncate">{valor}</span>
      {detalle && <span className="text-[11.5px] leading-snug">{detalle}</span>}
    </div>
  )
}

const GARANTIA: Record<string, { texto: string; tono: Tono }> = {
  SIN_TICKET: { texto: 'Sin ticket', tono: 'dim' },
  EN_CURSO: { texto: 'En curso', tono: 'dim' },
  GUARANTEE_ACHIEVED: { texto: 'Cumplida', tono: 'pos' },
  GUARANTEE_TRIGGERED: { texto: 'Activada', tono: 'neg' },
}

function Seccion({ titulo, detalle, children }: { titulo: string; detalle?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-[16px] font-semibold text-[var(--ink)] tracking-[-0.012em]">{titulo}</h2>
        {detalle && <span className="text-[12px] text-[var(--muted)]">{detalle}</span>}
      </div>
      {children}
    </section>
  )
}

function Metricas() {
  const [dias, setDias] = useState(30)
  const { data: h, isLoading } = usePlatformHealth(dias)
  const { data: clinicas = [], isLoading: cargandoClinicas } = usePlatformClinicsMetrics(dias)

  return (
    <div className="flex flex-col gap-6">
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

          <Seccion titulo="SLA de la plataforma" detalle="Cada indicador contra su meta y su umbral de alerta">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {indicadores(h).map((i) => <TarjetaSla key={i.metrica} i={i} />)}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { titulo: 'Integración con sistema de fichas', texto: h.not_available.pms },
                { titulo: 'RAG en dos niveles', texto: h.not_available.rag },
              ].map((n) => (
                <div key={n.titulo} className="rounded-[10px] border border-dashed border-[var(--line)] px-4 py-3 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-[var(--ink-soft)]">{n.titulo}</span>
                    <span data-badge>No aplica</span>
                  </div>
                  <span className="text-[12px] text-[var(--muted)] leading-snug">{n.texto}</span>
                </div>
              ))}
            </div>
          </Seccion>

          {h.unanswered.count > 0 && (
            <Seccion titulo="Mensajes sin respuesta" detalle="Últimas 24 horas">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {h.unanswered.items.map((u) => (
                  <div key={u.conversation_id} data-card className="px-4 py-3 flex flex-col gap-1" style={{ borderTop: '3px solid var(--neg)' }}>
                    <span className="text-[13.5px] font-semibold text-[var(--ink)]">{u.clinic_name}</span>
                    <span className="tabular text-[20px] font-semibold text-[var(--neg)] leading-none">
                      {u.waiting_sec >= 3600 ? `${Math.round(u.waiting_sec / 3600)} h` : `${Math.round(u.waiting_sec / 60)} min`}
                    </span>
                    <span className="tabular text-[11.5px] text-[var(--dim)] truncate">{u.conversation_id}</span>
                  </div>
                ))}
              </div>
            </Seccion>
          )}
        </>
      )}

      <Seccion titulo="Por clínica" detalle={`Costo unitario meta US$ ${h?.sla.unitCostMinUsd ?? 41}–${h?.sla.unitCostMaxUsd ?? 58} al mes`}>
        {cargandoClinicas ? (
          <div className="py-10 flex justify-center"><Spinner /></div>
        ) : clinicas.length === 0 ? (
          <div data-card className="px-4 py-6 text-[13px] text-[var(--muted)]">Todavía no hay clínicas.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {clinicas.map((c) => {
              const actual = GARANTIA[c.guarantee.current.status] ?? GARANTIA.EN_CURSO
              const previo = GARANTIA[c.guarantee.previous.status] ?? GARANTIA.EN_CURSO
              return (
                <div key={c.id} data-card>
                  <div data-hd>
                    <Link href={`/backoffice/clinics/${c.id}`} className="text-[14.5px] font-semibold text-[var(--ink)] hover:text-[var(--blue)]">
                      {c.name}
                    </Link>
                    <span data-badge><Dot tone={c.active ? 'pos' : 'neg'} />{c.active ? 'Con acceso' : 'Bloqueada'}</span>
                  </div>
                  <div className="p-3.5 grid gap-2.5 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
                    <Cifra etiqueta="Turnos" valor={c.turns} />
                    <Cifra etiqueta="IA al mes" valor={usd(c.ai_cost_month_usd)} />
                    <Cifra etiqueta="Citas del agente" valor={c.agent_appointments} />
                    <Cifra
                      etiqueta="Asistidas"
                      valor={c.attended}
                      detalle={c.unmarked > 0 ? <span className="text-[var(--neg)]">{c.unmarked} sin marcar</span> : undefined}
                    />
                    <Cifra etiqueta="Ingreso estimado" valor={dinero(c.estimated_revenue, c.currency)} />
                    <Cifra etiqueta="Autonomía" valor={pct(c.autonomy_rate)} />
                  </div>
                  <div className="px-3.5 py-2.5 border-t border-[var(--line)] bg-[var(--head)] flex items-center gap-x-5 gap-y-2 flex-wrap text-[12.5px]">
                    <span className="flex items-center gap-2">
                      <span data-lbl>Garantía del mes</span>
                      <span data-badge>
                        <Dot tone={actual.tono} />{actual.texto}
                        {c.guarantee.current.thresholdAppointments != null && ` · ${c.guarantee.current.attributedAttended}/${c.guarantee.current.thresholdAppointments}`}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span data-lbl>Mes anterior</span>
                      <span data-badge><Dot tone={previo.tono} />{previo.texto}{c.guarantee.previous.status === 'GUARANTEE_TRIGGERED' ? ' · factura US$ 0' : ''}</span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Seccion>

      <p className="text-[11.5px] text-[var(--dim)]">
        El costo de IA usa los precios públicos de OpenAI y cobra todos los tokens de entrada a precio normal: no descuenta los que OpenAI sirve
        desde caché, así que puede estar hasta al doble del real. No incluye Meta ni la infraestructura.
      </p>
    </div>
  )
}
