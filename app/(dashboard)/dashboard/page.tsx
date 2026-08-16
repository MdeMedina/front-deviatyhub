'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Sparkles, 
  MessageSquare, 
  Calendar, 
  BookOpen, 
  BarChart3, 
  ArrowRight, 
  BrainCircuit,
  MessageCircle
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useClinicConfig } from '@/lib/api/hooks/use-clinic'
import { useMetrics } from '@/lib/api/hooks/use-metrics'

// Spanish date formatting helper
function getFormattedDate() {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
  const dateStr = new Date().toLocaleDateString('es-ES', options)
  return dateStr.charAt(0).toUpperCase() + dateStr.slice(1)
}

function DashboardContent() {
  const { user } = useAuthStore()
  const { data: clinicConfig, isPending: isClinicPending } = useClinicConfig()
  const { data: metrics, isPending: isMetricsPending, isError: isMetricsError } = useMetrics('7d')

  const userEmail = user?.email || 'Colega'
  const userGreeting = userEmail.split('@')[0]

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  }

  // Loading skeleton
  if (isClinicPending || isMetricsPending) {
    return (
      <div className="space-y-8 animate-pulse" data-testid="dashboard-loading">
        {/* Banner Skeleton */}
        <div className="h-48 rounded-3xl bg-slate-200/60" />
        
        {/* KPIs Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 rounded-2xl bg-slate-200/60" />
          <div className="h-32 rounded-2xl bg-slate-200/60" />
          <div className="h-32 rounded-2xl bg-slate-200/60" />
        </div>

        {/* Shortcuts Skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-48 bg-slate-200/60 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="h-44 rounded-2xl bg-slate-200/60" />
            <div className="h-44 rounded-2xl bg-slate-200/60" />
            <div className="h-44 rounded-2xl bg-slate-200/60" />
            <div className="h-44 rounded-2xl bg-slate-200/60" />
          </div>
        </div>
      </div>
    )
  }

  const totalConversationsAttended = metrics?.conversations_attended ?? 0
  const containmentRateValue = metrics?.containment_rate !== undefined ? `${Math.round(metrics.containment_rate * 100)}%` : '0%'
  const appointmentsScheduledValue = metrics?.appointments_scheduled ?? 0

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Premium Hero Banner */}
      <motion.div 
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-600 to-purple-600 p-8 md:p-12 text-white shadow-xl shadow-indigo-100 dark:shadow-none"
      >
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[80px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[60px] -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-bold backdrop-blur-md">
              <Sparkles size={14} className="text-amber-300" />
              <span>{clinicConfig?.name || 'Clínica Deviaty'}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              ¡Hola, <span className="capitalize" data-testid="user-greeting">{userGreeting}</span>!
            </h1>
            <p className="text-indigo-100 font-medium max-w-xl text-sm md:text-base leading-relaxed">
              Bienvenido de vuelta a tu centro de control. El agente autónomo de IA está activo y gestionando la agenda de pacientes de forma estable.
            </p>
          </div>
          
          <div className="flex-shrink-0 bg-white/10 border border-white/20 p-6 rounded-2xl backdrop-blur-md flex flex-col items-center text-center justify-center min-w-[200px]">
            <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Estado de la IA</span>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-bold text-white uppercase tracking-wider">Activo y Operando</span>
            </div>
            <span className="text-[11px] font-medium text-indigo-100/70">{getFormattedDate()}</span>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* KPI 1: Total Conversations */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <MessageCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Conversaciones Atendidas</p>
            <h3 className="text-2xl font-extrabold text-slate-900" data-testid="conversations-kpi">{isMetricsError ? '--' : totalConversationsAttended}</h3>
            <span className="text-[10px] text-slate-500 font-medium">Últimos 7 días</span>
          </div>
        </div>

        {/* KPI 2: Containment Rate */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <BrainCircuit size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tasa de Contención</p>
            <h3 className="text-2xl font-extrabold text-slate-900" data-testid="containment-kpi">{isMetricsError ? '--' : containmentRateValue}</h3>
            <span className="text-[10px] text-emerald-600 font-bold">Autónomo por IA</span>
          </div>
        </div>

        {/* KPI 3: Scheduled Appointments */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Citas Agendadas</p>
            <h3 className="text-2xl font-extrabold text-slate-900" data-testid="appointments-kpi">{isMetricsError ? '--' : appointmentsScheduledValue}</h3>
            <span className="text-[10px] text-slate-500 font-medium">Reservadas con éxito</span>
          </div>
        </div>
      </motion.div>

      {/* Main Shortcuts Section */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Accesos Directos del Sistema</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Link 1: Conversations */}
          <Link href="/conversations" className="group">
            <div className="h-full bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:border-indigo-100 hover:shadow-md hover:shadow-indigo-50/40 transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare size={20} />
                </div>
                <h4 className="text-base font-bold text-slate-800 mb-1">Bandeja de Entrada</h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Supervisa e interviene chats en tiempo real de WhatsApp e Instagram.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 mt-6 group-hover:translate-x-1 transition-transform">
                <span>Ingresar</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </Link>

          {/* Link 2: Agenda */}
          <Link href="/agenda" className="group">
            <div className="h-full bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:border-purple-100 hover:shadow-md hover:shadow-purple-50/40 transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calendar size={20} />
                </div>
                <h4 className="text-base font-bold text-slate-800 mb-1">Agenda Médica</h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Visualiza el calendario completo de citas y coordina horarios médicos.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-purple-600 mt-6 group-hover:translate-x-1 transition-transform">
                <span>Visualizar</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </Link>

          {/* Link 3: Knowledge Base */}
          <Link href="/knowledge-base" className="group">
            <div className="h-full bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:border-emerald-100 hover:shadow-md hover:shadow-emerald-50/40 transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen size={20} />
                </div>
                <h4 className="text-base font-bold text-slate-800 mb-1">Base de Conocimiento</h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Administra las políticas de atención, especialidades y tratamientos de la clínica.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 mt-6 group-hover:translate-x-1 transition-transform">
                <span>Configurar</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </Link>

          {/* Link 4: Metrics */}
          <Link href="/metrics" className="group">
            <div className="h-full bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:border-rose-100 hover:shadow-md hover:shadow-rose-50/40 transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 size={20} />
                </div>
                <h4 className="text-base font-bold text-slate-800 mb-1">Métricas y Reportes</h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Analiza el rendimiento del agente IA, tasas de éxito de citas y velocidad de respuesta.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-rose-600 mt-6 group-hover:translate-x-1 transition-transform">
                <span>Ver Reporte</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px]" data-testid="dashboard-suspense">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4" />
          <span className="text-sm font-semibold text-slate-400">Preparando tu Dashboard...</span>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
