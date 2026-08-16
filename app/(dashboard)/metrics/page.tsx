'use client'

import React, { useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  BrainCircuit, 
  MessageSquare, 
  ArrowLeftRight, 
  XCircle, 
  Activity, 
  HelpCircle,
  AlertCircle
} from 'lucide-react'
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 25 } }
  }

  if (isPending) {
    return (
      <div className="space-y-8 animate-pulse" data-testid="metrics-loading">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200/70 rounded-xl" />
            <div className="h-4 w-96 bg-slate-200/70 rounded-lg" />
          </div>
          <div className="h-10 w-64 bg-slate-200/70 rounded-2xl" />
        </div>

        {/* KPIs Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[140px] rounded-3xl bg-slate-200/70" />
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[340px] rounded-3xl bg-slate-200/70" />
          <div className="h-[340px] rounded-3xl bg-slate-200/70" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div 
        className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-white border border-slate-100 rounded-3xl shadow-sm text-center space-y-4"
        data-testid="metrics-error-state"
      >
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertCircle size={32} />
        </div>
        <div className="space-y-2 max-w-md">
          <h3 className="text-lg font-bold text-slate-800">Error al cargar las métricas</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            No pudimos obtener la información analítica de la base de datos. Por favor, verifica tu conexión o vuelve a intentarlo.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-md shadow-indigo-100 hover:shadow-lg active:scale-95"
        >
          Reintentar Carga
        </button>
      </div>
    )
  }

  const formatResponseTime = (ms: number | undefined) => {
    if (ms === undefined) return '--'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatPercent = (rate: number | undefined) => {
    if (rate === undefined) return '--'
    return `${Math.round(rate * 100)}%`
  }

  const currentPeriodLabel = periodLabels[period]

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header and Period Selector */}
      <motion.div 
        variants={itemVariants} 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6"
      >
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight" data-testid="metrics-page-title">
            Métricas de Rendimiento
          </h1>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Monitorea el tráfico conversacional y evalúa la efectividad del agente autónomo de IA.
          </p>
        </div>

        {/* Period Selector Buttons */}
        <div className="inline-flex p-1 bg-slate-100/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 self-start sm:self-center">
          {(['1d', '7d', '30d'] as MetricsPeriod[]).map((p) => {
            const isActive = period === p
            const label = p === '1d' ? '24 Horas' : p === '7d' ? '7 Días' : '30 Días'
            return (
              <button
                key={p}
                data-testid={`period-select-${p}`}
                onClick={() => setPeriod(p)}
                className={`relative px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Metric Cards Grid */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <MetricCard
          title="Conversaciones Atendidas"
          value={metrics?.conversations_attended ?? 0}
          subtitle={currentPeriodLabel}
          trend={{ value: 12.4, direction: 'up', positive: true }}
          data-testid="conversations-attended-card"
        />
        <MetricCard
          title="Tasa de Contención"
          value={formatPercent(metrics?.containment_rate)}
          subtitle="Autónomo por IA"
          trend={{ value: 2.1, direction: 'up', positive: true }}
          data-testid="containment-rate-card"
        />
        <MetricCard
          title="Tiempo de Respuesta"
          value={formatResponseTime(metrics?.avg_response_time_ms)}
          subtitle="Tiempo promedio"
          trend={{ value: 14.2, direction: 'down', positive: false }} // down is good for response time
          data-testid="avg-response-time-card"
        />
        <MetricCard
          title="Citas Agendadas"
          value={metrics?.appointments_scheduled ?? 0}
          subtitle="Agendadas autónomamente"
          trend={{ value: 15.0, direction: 'up', positive: true }}
          data-testid="appointments-scheduled-card"
        />
        <MetricCard
          title="Citas Reprogramadas"
          value={metrics?.appointments_rescheduled ?? 0}
          subtitle="Cambios gestionados"
          trend={{ value: 4.8, direction: 'down', positive: false }} // down is good for reschedules
          data-testid="appointments-rescheduled-card"
        />
        <MetricCard
          title="Citas Canceladas"
          value={metrics?.appointments_cancelled ?? 0}
          subtitle="Cancelaciones registradas"
          trend={{ value: 8.3, direction: 'down', positive: false }} // down is good for cancellations
          data-testid="appointments-cancelled-card"
        />
        <MetricCard
          title="Derivación a Humano"
          value={metrics?.human_takeovers ?? 0}
          subtitle="Traspasos al equipo"
          trend={{ value: 6.5, direction: 'down', positive: false }} // down is good for human takeover
          data-testid="human-takeovers-card"
        />
        <MetricCard
          title="Fuera de Horario"
          value={metrics?.out_of_hours_conversations ?? 0}
          subtitle="Chats nocturnos/festivos"
          trend={{ value: 10.2, direction: 'up', positive: true }}
          data-testid="out-of-hours-conversations-card"
        />
      </motion.div>

      {/* Visual Analytics Charts */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <IntentionsChart 
          intentions={metrics?.intentions_distribution ?? []} 
        />
        <InteractionsHeatmap 
          data={metrics?.interactions_by_hour ?? []} 
        />
      </motion.div>
    </motion.div>
  )
}

export default function MetricsPage() {
  return (
    <Suspense
      fallback={
        <div 
          className="flex flex-col items-center justify-center min-h-[400px] space-y-4"
          data-testid="metrics-suspense"
        >
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
          <span className="text-sm font-semibold text-slate-400">Analizando estadísticas...</span>
        </div>
      }
    >
      <MetricsContent />
    </Suspense>
  )
}
