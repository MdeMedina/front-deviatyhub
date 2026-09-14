'use client'

import React, { useState, Suspense } from 'react'
import { AlertCircle } from 'lucide-react'
import { useMetrics, MetricsPeriod } from '@/lib/api/hooks/use-metrics'
import { IntentionsChart } from '@/components/metrics/IntentionsChart'
import { InteractionsHeatmap } from '@/components/metrics/InteractionsHeatmap'
import {
  formatCount,
  formatRate,
  formatResponseTime,
  formatTrend,
  type TrendDisplay,
} from '@/lib/utils/metrics-format'

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

  const currentPeriodLabel = periodLabels[period]
  const trends = metrics?.trends

  // Sin dato se muestra un guion, nunca un número de relleno: un valor
  // inventado que parece real es peor que un hueco, porque nadie lo cuestiona.
  const metricCards: {
    title: string
    value: React.ReactNode
    trend: TrendDisplay | null
    subtitle: string
    testId: string
  }[] = [
    {
      title: 'Conversaciones atendidas',
      value: formatCount(metrics?.conversations_attended),
      trend: formatTrend(trends?.conversations_attended),
      subtitle: 'Total del periodo',
      testId: 'metric-conversations',
    },
    {
      title: 'Tasa de contención',
      value: formatRate(metrics?.containment_rate),
      trend: formatTrend(trends?.containment_rate),
      subtitle: 'Autónomo por IA',
      testId: 'metric-containment',
    },
    {
      title: 'Tiempo de respuesta',
      value: formatResponseTime(metrics?.avg_response_time_ms),
      trend: formatTrend(trends?.avg_response_time_ms, { lowerIsBetter: true }),
      subtitle: 'Tiempo promedio',
      testId: 'metric-response-time',
    },
    {
      title: 'Citas agendadas',
      value: formatCount(metrics?.appointments_scheduled),
      trend: formatTrend(trends?.appointments_scheduled),
      subtitle: 'Agendadas autónomamente',
      testId: 'metric-scheduled',
    },
    {
      title: 'Citas reprogramadas',
      value: formatCount(metrics?.appointments_rescheduled),
      trend: formatTrend(trends?.appointments_rescheduled),
      subtitle: 'Cambios gestionados',
      testId: 'metric-rescheduled',
    },
    {
      title: 'Citas canceladas',
      value: formatCount(metrics?.appointments_cancelled),
      trend: formatTrend(trends?.appointments_cancelled, { lowerIsBetter: true }),
      subtitle: 'Cancelaciones registradas',
      testId: 'metric-cancellations',
    },
    {
      title: 'Derivación a humano',
      value: formatCount(metrics?.human_takeovers),
      trend: formatTrend(trends?.human_takeovers, { lowerIsBetter: true }),
      subtitle: 'Traspasos al equipo',
      testId: 'metric-human-takeovers',
    },
    {
      title: 'Fuera de horario',
      value: formatCount(metrics?.out_of_hours_conversations),
      trend: formatTrend(trends?.out_of_hours_conversations),
      subtitle: 'Chats nocturnos y festivos',
      testId: 'metric-after-hours',
    },
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
              {/* Sin periodo anterior con el que comparar no se pinta nada. */}
              {m.trend && (
                <span data-mono style={{ fontSize: '11px', color: m.trend.positive ? 'var(--pos)' : 'var(--neg)', border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: '5px', padding: '2px 6px' }}>
                  {m.trend.label}
                </span>
              )}
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
