'use client'

import React, { Suspense, useState } from 'react'
import Link from 'next/link'
import { 
  MessageSquare, 
  Calendar, 
  BookOpen, 
  BarChart3, 
  ArrowUpRight,
  MessageCircle,
  BrainCircuit,
  Clock,
  SlidersHorizontal,
  X
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useClinicConfig } from '@/lib/api/hooks/use-clinic'
import { useMetrics } from '@/lib/api/hooks/use-metrics'

// Spanish date helper
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
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false)
  const [agentMode, setAgentMode] = useState<'autonomous' | 'supervised' | 'paused'>('autonomous')

  const userEmail = user?.email || 'Colega'
  const userGreeting = userEmail.split('@')[0]

  if (isClinicPending || isMetricsPending) {
    return (
      <div className="flex flex-col gap-6 max-w-[1340px] mx-auto animate-dentral-shimmer" data-testid="dashboard-loading">
        <div className="flex flex-col gap-2.5">
          <div className="h-[22px] w-[220px] bg-[var(--surface-2)] rounded-[6px]" />
          <div className="h-[14px] w-[340px] bg-[var(--surface-2)] rounded-[6px]" />
        </div>
        <div className="h-[96px] bg-[var(--surface-2)] rounded-[10px]" />
        <div className="h-[150px] bg-[var(--surface-2)] rounded-[10px]" />
        <div className="h-[190px] bg-[var(--surface-2)] rounded-[10px]" />
      </div>
    )
  }

  const totalConversationsAttended = metrics?.conversations_attended ?? 0
  const containmentRateValue = metrics?.containment_rate !== undefined ? `${Math.round(metrics.containment_rate * 100)}%` : '0%'
  const appointmentsScheduledValue = metrics?.appointments_scheduled ?? 0

  return (
    <div className="flex flex-col gap-6 max-w-[1340px] mx-auto">
      {/* 1. Header Section */}
      <div className="flex items-end justify-between gap-6 flex-wrap pb-5 border-b border-[var(--line)]">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[29px] font-semibold tracking-[-0.03em] text-[var(--ink)] leading-tight">
            Hola, <span className="capitalize" data-testid="user-greeting">{userGreeting}</span>
          </h1>
          <p className="text-[13.5px] text-[var(--muted)]">
            {getFormattedDate()} · {clinicConfig?.name || 'Deviaty Dental Care'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div data-badge style={{ height: '32px', padding: '0 11px', background: 'var(--card)' }}>
            <span className="relative inline-flex w-1.5 h-1.5">
              <span className="animate-dentral-ping absolute inset-0 rounded-full bg-[var(--pos)]" />
              <span className="relative w-1.5 h-1.5 rounded-full bg-[var(--pos)]" />
            </span>
            <span data-lbl style={{ color: 'var(--ink-soft)' }}>Agente activo</span>
          </div>

          <button 
            data-btn="primary"
            onClick={() => setIsAgentModalOpen(true)}
          >
            <SlidersHorizontal size={14} strokeWidth={1.75} />
            Estado del agente
          </button>
        </div>
      </div>

      {/* 2. Resumen Section Header */}
      <div data-sec>
        <span>Resumen</span>
        <span data-lbl style={{ border: '1px solid var(--line)', borderRadius: '5px', padding: '2px 7px', background: 'var(--card)' }}>
          Últimos 7 días
        </span>
        <span data-rule />
      </div>

      {/* 3. 4-cell Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1px', background: 'var(--line)', border: '1px solid var(--line)', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(20,20,25,.05)' }}>
        {/* Cell 1 */}
        <div style={{ background: 'var(--card)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink-soft)' }}>
            <MessageCircle size={14} strokeWidth={1.75} />
            <span data-lbl style={{ color: 'var(--ink-soft)' }}>Conversaciones atendidas</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span data-mono style={{ fontSize: '30px', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)' }} data-testid="conversations-kpi">
              {isMetricsError ? '--' : totalConversationsAttended.toLocaleString('es-CL')}
            </span>
            <span data-mono style={{ fontSize: '11px', color: 'var(--pos)', border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: '5px', padding: '2px 6px' }}>
              +12,4%
            </span>
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--dim)' }}>Últimos 7 días</span>
        </div>

        {/* Cell 2 */}
        <div style={{ background: 'var(--card)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink-soft)' }}>
            <BrainCircuit size={14} strokeWidth={1.75} />
            <span data-lbl style={{ color: 'var(--ink-soft)' }}>Tasa de contención</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span data-mono style={{ fontSize: '30px', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)' }} data-testid="containment-kpi">
              {isMetricsError ? '--' : containmentRateValue}
            </span>
            <span data-mono style={{ fontSize: '11px', color: 'var(--pos)', border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: '5px', padding: '2px 6px' }}>
              +2,1%
            </span>
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--dim)' }}>Autónomo por IA</span>
        </div>

        {/* Cell 3 */}
        <div style={{ background: 'var(--card)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink-soft)' }}>
            <Calendar size={14} strokeWidth={1.75} />
            <span data-lbl style={{ color: 'var(--ink-soft)' }}>Citas agendadas</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span data-mono style={{ fontSize: '30px', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)' }} data-testid="appointments-kpi">
              {isMetricsError ? '--' : appointmentsScheduledValue.toLocaleString('es-CL')}
            </span>
            <span data-mono style={{ fontSize: '11px', color: 'var(--pos)', border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: '5px', padding: '2px 6px' }}>
              +15,0%
            </span>
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--dim)' }}>Reservadas con éxito</span>
        </div>

        {/* Cell 4 */}
        <div style={{ background: 'var(--card)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink-soft)' }}>
            <Clock size={14} strokeWidth={1.75} />
            <span data-lbl style={{ color: 'var(--ink-soft)' }}>Tiempo de respuesta</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span data-mono style={{ fontSize: '30px', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              1,2s
            </span>
            <span data-mono style={{ fontSize: '11px', color: 'var(--pos)', border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: '5px', padding: '2px 6px' }}>
              −14,2%
            </span>
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--dim)' }}>Tiempo promedio</span>
        </div>
      </div>

      {/* 4. Operación Section Header */}
      <div data-sec style={{ marginTop: '8px' }}>
        <span>Operación</span>
        <span data-rule />
      </div>

      {/* 5. Operación Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', alignItems: 'start' }}>
        {/* Left Card: 4 Accesos Directos in 2x2 Grid */}
        <div data-card>
          <div data-hd>
            <h2>Accesos directos del sistema</h2>
            <span data-lbl>4 módulos</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1px', background: 'var(--line)' }}>
            {/* Shortcut 1 */}
            <Link 
              href="/conversations"
              style={{ background: 'var(--card)', padding: '18px', display: 'flex', flexDirection: 'column', gap: '7px', textDecoration: 'none', textAlign: 'left' }}
              className="hover:bg-[var(--surface)] transition-colors"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', width: '100%' }}>
                <span data-icon><MessageSquare size={15} strokeWidth={1.75} /></span>
                <span style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--ink)' }}>Bandeja de entrada</span>
                <span data-icon style={{ marginLeft: 'auto', width: '24px', height: '24px', background: 'var(--surface)', color: 'var(--ink-soft)' }}>
                  <ArrowUpRight size={13} strokeWidth={1.9} />
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.55, color: 'var(--muted)' }}>
                Supervisa e interviene chats en tiempo real de WhatsApp e Instagram.
              </p>
            </Link>

            {/* Shortcut 2 */}
            <Link 
              href="/agenda"
              style={{ background: 'var(--card)', padding: '18px', display: 'flex', flexDirection: 'column', gap: '7px', textDecoration: 'none', textAlign: 'left' }}
              className="hover:bg-[var(--surface)] transition-colors"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', width: '100%' }}>
                <span data-icon><Calendar size={15} strokeWidth={1.75} /></span>
                <span style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--ink)' }}>Agenda médica</span>
                <span data-icon style={{ marginLeft: 'auto', width: '24px', height: '24px', background: 'var(--surface)', color: 'var(--ink-soft)' }}>
                  <ArrowUpRight size={13} strokeWidth={1.9} />
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.55, color: 'var(--muted)' }}>
                Visualiza el calendario completo de citas y coordina horarios médicos.
              </p>
            </Link>

            {/* Shortcut 3 */}
            <Link 
              href="/knowledge-base"
              style={{ background: 'var(--card)', padding: '18px', display: 'flex', flexDirection: 'column', gap: '7px', textDecoration: 'none', textAlign: 'left' }}
              className="hover:bg-[var(--surface)] transition-colors"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', width: '100%' }}>
                <span data-icon><BookOpen size={15} strokeWidth={1.75} /></span>
                <span style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--ink)' }}>Base de conocimiento</span>
                <span data-icon style={{ marginLeft: 'auto', width: '24px', height: '24px', background: 'var(--surface)', color: 'var(--ink-soft)' }}>
                  <ArrowUpRight size={13} strokeWidth={1.9} />
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.55, color: 'var(--muted)' }}>
                Administra las políticas de atención, especialidades y tratamientos de la clínica.
              </p>
            </Link>

            {/* Shortcut 4 */}
            <Link 
              href="/metrics"
              style={{ background: 'var(--card)', padding: '18px', display: 'flex', flexDirection: 'column', gap: '7px', textDecoration: 'none', textAlign: 'left' }}
              className="hover:bg-[var(--surface)] transition-colors"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', width: '100%' }}>
                <span data-icon><BarChart3 size={15} strokeWidth={1.75} /></span>
                <span style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--ink)' }}>Métricas y reportes</span>
                <span data-icon style={{ marginLeft: 'auto', width: '24px', height: '24px', background: 'var(--surface)', color: 'var(--ink-soft)' }}>
                  <ArrowUpRight size={13} strokeWidth={1.9} />
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.55, color: 'var(--muted)' }}>
                Analiza el rendimiento del agente IA, tasas de éxito de citas y velocidad de respuesta.
              </p>
            </Link>
          </div>
        </div>

        {/* Right Card: Estado de la IA */}
        <div data-card>
          <div data-hd>
            <h2>Estado de la IA</h2>
          </div>
          <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <span style={{ position: 'relative', display: 'inline-flex', width: '7px', height: '7px' }}>
                <span className="animate-dentral-ping" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--pos)' }} />
                <span style={{ position: 'relative', width: '7px', height: '7px', borderRadius: '50%', background: 'var(--pos)' }} />
              </span>
              <span style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--ink)' }}>Activo y operando</span>
            </div>
            <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.6, color: 'var(--muted)' }}>
              El agente autónomo está gestionando la agenda de pacientes de forma estable.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', paddingTop: '14px', borderTop: '1px solid var(--line-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>Derivación a humano</span>
                <span data-mono style={{ fontSize: '12.5px', color: 'var(--ink)' }}>18</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>Fuera de horario</span>
                <span data-mono style={{ fontSize: '12.5px', color: 'var(--ink)' }}>143</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>Citas canceladas</span>
                <span data-mono style={{ fontSize: '12.5px', color: 'var(--ink)' }}>26</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Status Modal */}
      {isAgentModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center', padding: '24px' }}>
          <div 
            onClick={() => setIsAgentModalOpen(false)} 
            style={{ position: 'absolute', inset: 0, background: 'rgba(33,33,33,.45)', backdropFilter: 'blur(2px)' }} 
          />
          <div 
            role="dialog" 
            aria-modal="true" 
            data-card 
            style={{ position: 'relative', width: '100%', maxWidth: '440px', boxShadow: '0 24px 60px rgba(0,0,0,.18)' }}
          >
            <div data-hd>
              <h2>Estado del agente</h2>
              <button 
                data-btn 
                onClick={() => setIsAgentModalOpen(false)} 
                style={{ width: '28px', height: '28px', padding: 0, borderColor: 'transparent', background: 'none' }}
              >
                <X size={15} strokeWidth={1.75} />
              </button>
            </div>
            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: 'var(--muted)' }}>
                Controla si el agente responde de forma autónoma o deja todas las conversaciones en manos del equipo.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--line)', border: '1px solid var(--line)', borderRadius: '9px', overflow: 'hidden' }}>
                <label 
                  onClick={() => setAgentMode('autonomous')}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '11px', padding: '13px 14px', background: agentMode === 'autonomous' ? 'var(--blue-tint)' : 'var(--card)', cursor: 'pointer' }}
                >
                  <span style={{ width: '15px', height: '15px', flex: 'none', marginTop: '1px', borderRadius: '50%', border: `1px solid ${agentMode === 'autonomous' ? 'var(--blue)' : 'var(--line)'}`, display: 'grid', placeItems: 'center' }}>
                    {agentMode === 'autonomous' && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--blue)' }} />}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>Autónomo</span>
                    <span style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--muted)' }}>Agenda, reprograma y cancela citas sin intervención.</span>
                  </span>
                </label>

                <label 
                  onClick={() => setAgentMode('supervised')}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '11px', padding: '13px 14px', background: agentMode === 'supervised' ? 'var(--blue-tint)' : 'var(--card)', cursor: 'pointer' }}
                >
                  <span style={{ width: '15px', height: '15px', flex: 'none', marginTop: '1px', borderRadius: '50%', border: `1px solid ${agentMode === 'supervised' ? 'var(--blue)' : 'var(--line)'}`, display: 'grid', placeItems: 'center' }}>
                    {agentMode === 'supervised' && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--blue)' }} />}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>Supervisado</span>
                    <span style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--muted)' }}>Propone respuestas y espera aprobación del equipo.</span>
                  </span>
                </label>

                <label 
                  onClick={() => setAgentMode('paused')}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '11px', padding: '13px 14px', background: agentMode === 'paused' ? 'var(--blue-tint)' : 'var(--card)', cursor: 'pointer' }}
                >
                  <span style={{ width: '15px', height: '15px', flex: 'none', marginTop: '1px', borderRadius: '50%', border: `1px solid ${agentMode === 'paused' ? 'var(--blue)' : 'var(--line)'}`, display: 'grid', placeItems: 'center' }}>
                    {agentMode === 'paused' && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--blue)' }} />}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>Pausado</span>
                    <span style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--muted)' }}>Todas las conversaciones pasan directo al equipo.</span>
                  </span>
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '9px', padding: '13px 18px', borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
              <button data-btn onClick={() => setIsAgentModalOpen(false)}>Cancelar</button>
              <button data-btn="primary" onClick={() => setIsAgentModalOpen(false)}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6 max-w-[1340px] mx-auto animate-dentral-shimmer" data-testid="dashboard-suspense">
          <div className="h-8 w-48 bg-[var(--surface-2)] rounded-[6px]" />
          <div className="h-32 bg-[var(--card)] border border-[var(--line)] rounded-[10px]" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
