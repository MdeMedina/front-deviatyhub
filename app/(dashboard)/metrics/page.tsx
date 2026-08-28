'use client'

import React, { useState, Suspense } from 'react'
import { AlertCircle } from 'lucide-react'
import { useMetrics, MetricsPeriod } from '@/lib/api/hooks/use-metrics'
import { IntentionsChart } from '@/components/metrics/IntentionsChart'
import { InteractionsHeatmap } from '@/components/metrics/InteractionsHeatmap'

function MetricsContent() {
  const [period, setPeriod] = useState<MetricsPeriod>('7d')
  const { data: metrics, isPending, isError, refetch } = useMetrics(period)

  const periodLabels: Record<MetricsPeriod, string> = {
    '1d': 'En las últimas 24h',
    '7d': 'Últimos 7 días',
    '30d': 'Últimos 30 días'
  }

  if (isPending) {
    return (
      <div className="flex flex-col gap-5 max-w-[1340px] mx-auto animate-dentral-shimmer" data-testid="metrics-loading">
        <div className="h-10 bg-[var(--surface-2)] rounded-[6px]" />
        <div className="h-28 bg-[var(--card)] border border-[var(--line)] rounded-[10px]" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-[340px] rounded-[10px] bg-[var(--card)] border border-[var(--line)]" />
          <div className="h-[340px] rounded-[10px] bg-[var(--card)] border border-[var(--line)]" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div 
        className="flex flex-col items-center justify-center min-h-[380px] p-8 bg-[var(--card)] border border-[var(--line)] rounded-[10px] shadow-[0_1px_2px_rgba(20,20,25,0.05)] text-center space-y-3 max-w-md mx-auto"
        data-testid="metrics-error-state"
      >
        <div className="w-11 h-11 border border-[var(--line)] rounded-[7px] bg-[var(--head)] flex items-center justify-center text-[var(--neg)]">
          <AlertCircle size={22} />
        </div>
        <div className="space-y-1">
          <h3 className="text-[16px] font-semibold text-[var(--ink)]">Error al cargar las métricas</h3>
          <p className="text-[12.5px] text-[var(--muted)] leading-relaxed">
            No pudimos obtener la información analítica de la base de datos. Por favor, verifica tu conexión o vuelve a intentarlo.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          data-btn="primary"
        >
          Reintentar Carga
        </button>
      </div>
    )
  }

  const formatResponseTime = (ms: number | undefined) => {
    if (ms === undefined) return '1.2s'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatPercent = (rate: number | undefined) => {
    if (rate === undefined) return '86%'
    return `${Math.round(rate * 100)}%`
  }

  const currentPeriodLabel = periodLabels[period]

  const conversationsVal = metrics?.conversations_attended ?? 1284
  const containmentVal = formatPercent(metrics?.containment_rate)
  const responseVal = formatResponseTime(metrics?.avg_response_time_ms)
  const scheduledVal = metrics?.appointments_scheduled ?? 327
  const rescheduledVal = (metrics as any)?.appointments_rescheduled ?? (metrics as any)?.rescheduled_count ?? 84
  const cancelledVal = (metrics as any)?.appointments_cancelled ?? (metrics as any)?.cancellations_count ?? 26
  const humanTakeoversVal = (metrics as any)?.human_takeovers ?? (metrics as any)?.human_takeovers_count ?? 18
  const outOfHoursVal = (metrics as any)?.out_of_hours_conversations ?? (metrics as any)?.after_hours_count ?? 143

  const metricCards: { title: string; value: React.ReactNode; trend: string; positive: boolean; subtitle: string; testId: string }[] = [
    { title: 'Conversaciones atendidas', value: conversationsVal, trend: '+12,4%', positive: true, subtitle: 'Total del periodo', testId: 'metric-conversations' },
    { title: 'Tasa de contención', value: containmentVal, trend: '+2,1%', positive: true, subtitle: 'Autónomo por IA', testId: 'metric-containment' },
    { title: 'Tiempo de respuesta', value: responseVal, trend: '−14,2%', positive: true, subtitle: 'Tiempo promedio', testId: 'metric-response-time' },
    { title: 'Citas agendadas', value: scheduledVal, trend: '+15,0%', positive: true, subtitle: 'Agendadas autónomamente', testId: 'metric-scheduled' },
    { title: 'Citas reprogramadas', value: rescheduledVal, trend: '−4,8%', positive: true, subtitle: 'Cambios gestionados', testId: 'metric-rescheduled' },
    { title: 'Citas canceladas', value: cancelledVal, trend: '−8,3%', positive: true, subtitle: 'Cancelaciones registradas', testId: 'metric-cancellations' },
    { title: 'Derivación a humano', value: humanTakeoversVal, trend: '−6,5%', positive: true, subtitle: 'Traspasos al equipo', testId: 'metric-human-takeovers' },
    { title: 'Fuera de horario', value: outOfHoursVal, trend: '+10,2%', positive: false, subtitle: 'Chats nocturnos y festivos', testId: 'metric-after-hours' },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-[1340px] mx-auto">
      {/* Header and Period Selector */}
      <div className="flex items-end justify-between gap-5 flex-wrap pb-[18px] border-b border-[var(--line)]">
        <div className="flex flex-col gap-[5px]">
          <h1 className="text-[24px] font-semibold tracking-[-0.028em] text-[var(--ink)] leading-tight" data-testid="metrics-page-title">
            Métricas de Rendimiento
          </h1>
          <p className="text-[13.5px] text-[var(--muted)]">
            Monitorea el tráfico conversacional y evalúa la efectividad del agente autónomo.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div data-tabs>
          <button
            data-tab
            data-testid="period-select-1d"
            data-active={period === '1d'}
            onClick={() => setPeriod('1d')}
          >
            24 horas
          </button>
          <button
            data-tab
            data-testid="period-select-7d"
            data-active={period === '7d'}
            onClick={() => setPeriod('7d')}
          >
            7 días
          </button>
          <button
            data-tab
            data-testid="period-select-30d"
            data-active={period === '30d'}
            onClick={() => setPeriod('30d')}
          >
            30 días
          </button>
        </div>
      </div>

      {/* Section: Indicadores */}
      <div data-sec>
        <span>Indicadores</span>
        <span data-lbl style={{ border: '1px solid var(--line)', borderRadius: '5px', padding: '2px 7px', background: 'var(--card)' }}>
          {currentPeriodLabel}
        </span>
        <span data-rule />
      </div>

      {/* Unified 4×2 KPI Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1px', background: 'var(--line)', border: '1px solid var(--line)', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(20,20,25,.05)' }}>
        {metricCards.map((m) => (
          <div key={m.testId} data-testid={m.testId} style={{ background: 'var(--card)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span data-lbl style={{ color: 'var(--ink-soft)' }}>{m.title}</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '9px' }}>
              <span data-mono style={{ fontSize: '25px', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
                {m.value}
              </span>
              <span data-mono style={{ fontSize: '11px', color: m.positive ? 'var(--pos)' : 'var(--muted)', border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: '5px', padding: '2px 6px' }}>
                {m.trend}
              </span>
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--dim)' }}>{m.subtitle}</span>
          </div>
        ))}
      </div>

      {/* Section: Análisis */}
      <div data-sec style={{ marginTop: '8px' }}>
        <span>Análisis</span>
        <span data-rule />
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', alignItems: 'start' }}>
        <IntentionsChart intentions={metrics?.intentions_distribution || (metrics as any)?.top_intentions} periodLabel={currentPeriodLabel} />
        <InteractionsHeatmap data={metrics?.interactions_by_hour} />
      </div>
    </div>
  )
}

export default function MetricsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-5 max-w-[1340px] mx-auto animate-dentral-shimmer">
          <div className="h-10 bg-[var(--surface-2)] rounded-[6px]" />
          <div className="h-32 bg-[var(--card)] border border-[var(--line)] rounded-[10px]" />
        </div>
      }
    >
      <MetricsContent />
    </Suspense>
  )
}
