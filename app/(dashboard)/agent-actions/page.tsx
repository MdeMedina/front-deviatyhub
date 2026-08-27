'use client'

import React from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { AgentActionToggle } from '@/components/clinic/AgentActionToggle'

export default function AgentActionsPage() {
  const { hasPermission } = useAuthStore()

  // Required permissions
  const canView = hasPermission('agent_actions.view')
  const readOnly = !hasPermission('agent_actions.edit')

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[var(--card)] border border-[var(--line)] rounded-[10px] min-h-[380px] max-w-md mx-auto text-center shadow-[0_1px_2px_rgba(20,20,25,0.05)]">
        <div className="w-11 h-11 border border-[var(--line)] rounded-[7px] bg-[var(--head)] flex items-center justify-center text-[var(--neg)] mb-3">
          <AlertCircle size={22} />
        </div>
        <h2 className="text-[18px] font-semibold text-[var(--ink)] mb-1.5">Acceso Denegado</h2>
        <p className="text-[13px] text-[var(--muted)] leading-relaxed mb-5">
          No tienes los permisos necesarios para ver o modificar las configuraciones de acciones del agente. Por favor contacta al administrador del sistema.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-4 py-2 bg-[var(--ink)] hover:opacity-85 text-[var(--bg)] font-medium rounded-[7px] text-[13px] transition-opacity gap-2"
        >
          Ir al Dashboard
          <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 max-w-[1340px] mx-auto">
      {/* Header Bar */}
      <div className="flex items-end justify-between gap-5 flex-wrap pb-4 border-b border-[var(--line)]">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-semibold tracking-[-0.028em] text-[var(--ink)] leading-tight">
            Configuración del Agente
          </h1>
          <p className="text-[13.5px] text-[var(--muted)]">
            Controla las reglas de negocio y flujos de automatización del bot.
          </p>
        </div>
        <span data-lbl>Actualizado 16 ago, 09:12</span>
      </div>

      {/* Main Content */}
      <AgentActionToggle readOnly={readOnly} />
    </div>
  )
}
