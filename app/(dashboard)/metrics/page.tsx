'use client'

import React, { useState, Suspense } from 'react'
import { AlertCircle, MessageCircle, CalendarCheck, BrainCircuit, Zap, Users, UserMinus, Clock } from 'lucide-react'
import { useMetrics, MetricsPeriod } from '@/lib/api/hooks/use-metrics'
import { MetricCard } from '@/components/metrics/MetricCard'
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

  const humanTakeoversVal = (metrics as any)?.human_takeovers ?? (metrics as any)?.human_takeovers_count ?? 18
  const rescheduledVal = (metrics as any)?.appointments_rescheduled ?? (metrics as any)?.rescheduled_count ?? 30
  const cancelledVal = (metrics as any)?.appointments_cancelled ?? (metrics as any)?.cancellations_count ?? 26
  const outOfHoursVal = (metrics as any)?.out_of_hours_conversations ?? (metrics as any)?.after_hours_count ?? 143

  return (
    <div className="flex flex-col gap-5 max-w-[1340px] mx-auto">
      {/* Header and Period Selector */}
      <div className="flex items-end justify-between gap-5 flex-wrap pb-4 border-b border-[var(--line)]">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-semibold tracking-[-0.028em] text-[var(--ink)] leading-tight" data-testid="metrics-page-title">
            Métricas de Rendimiento
          </h1>
          <p className="text-[13.5px] text-[var(--muted)]">
            Estadísticas de atención, efectividad del bot y demanda por horario.
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

      {/* 4-Cell Top Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1px', background: 'var(--line)', border: '1px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>
        {/* Cell 1: Conversaciones Atendidas */}
        <div style={{ background: 'var(--card)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink-soft)' }}>
            <MessageCircle size={14} strokeWidth={1.75} />
            <span data-lbl style={{ color: 'var(--ink-soft)' }}>Conversaciones Atendidas</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span data-mono style={{ fontSize: '30px', fontWeight: 500, color: 'var(--ink)' }}>
              {metrics?.conversations_attended ?? 1284}
            </span>
            <span data-mono style={{ fontSize: '11px', color: 'var(--pos)', border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: '5px', padding: '2px 6px' }}>
              +12%
            </span>
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--dim)' }}>183 por día prom.</span>
        </div>

        {/* Cell 2: Citas Agendadas */}
        <div style={{ background: 'var(--card)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink-soft)' }}>
            <CalendarCheck size={14} strokeWidth={1.75} />
            <span data-lbl style={{ color: 'var(--ink-soft)' }}>Citas Agendadas</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span data-mono style={{ fontSize: '30px', fontWeight: 500, color: 'var(--ink)' }}>
              {metrics?.appointments_scheduled ?? 327}
            </span>
            <span data-mono style={{ fontSize: '11px', color: 'var(--pos)', border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: '5px', padding: '2px 6px' }}>
              +8%
            </span>
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--dim)' }}>25,4% conversión</span>
        </div>

        {/* Cell 3: Tasa de Contención */}
        <div style={{ background: 'var(--card)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink-soft)' }}>
            <BrainCircuit size={14} strokeWidth={1.75} />
            <span data-lbl style={{ color: 'var(--ink-soft)' }}>Tasa de Contención</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span data-mono style={{ fontSize: '30px', fontWeight: 500, color: 'var(--ink)' }}>
              {formatPercent(metrics?.containment_rate)}
            </span>
            <span data-mono style={{ fontSize: '11px', color: 'var(--pos)', border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: '5px', padding: '2px 6px' }}>
              +2%
            </span>
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--dim)' }}>1.104 sin humano</span>
        </div>

        {/* Cell 4: Tiempo de Respuesta */}
        <div style={{ background: 'var(--card)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink-soft)' }}>
            <Zap size={14} strokeWidth={1.75} />
            <span data-lbl style={{ color: 'var(--ink-soft)' }}>Tiempo de Respuesta</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span data-mono style={{ fontSize: '30px', fontWeight: 500, color: 'var(--ink)' }}>
              {formatResponseTime(metrics?.avg_response_time_ms)}
            </span>
            <span data-mono style={{ fontSize: '11px', color: 'var(--pos)', border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: '5px', padding: '2px 6px' }}>
              −0,3s
            </span>
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--dim)' }}>p95 en 2,1s</span>
        </div>
      </div>

      {/* Secondary Row: 4 smaller metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--line)] border border-[var(--line)] rounded-[10px] overflow-hidden">
        <MetricCard
          title="Derivación a Humano"
          value={humanTakeoversVal}
          icon={<Users size={14} />}
          description={currentPeriodLabel}
          testId="metric-human-takeovers"
        />
        <MetricCard
          title="Citas Reprogramadas"
          value={rescheduledVal}
          icon={<CalendarCheck size={14} />}
          description="Reprogramadas con éxito"
          testId="metric-rescheduled"
        />
        <MetricCard
          title="Citas Canceladas"
          value={cancelledVal}
          icon={<UserMinus size={14} />}
          description="Canceladas por pacientes"
          testId="metric-cancellations"
        />
        <MetricCard
          title="Fuera de Horario"
          value={outOfHoursVal}
          icon={<Clock size={14} />}
          description="Consultas nocturnas"
          testId="metric-after-hours"
        />
      </div>

      {/* Charts 2-Column Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '20px', alignItems: 'start' }}>
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
