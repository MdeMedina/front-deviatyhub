'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Building,
  Clock,
  Calendar,
  Shield,
  Users,
  Stethoscope,
  AlertCircle,
  Check,
  ArrowRight
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { ClinicConfigForm } from '@/components/clinic/ClinicConfigForm'
import { ScheduleEditor } from '@/components/clinic/ScheduleEditor'
import { TreatmentsManager } from '@/components/clinic/TreatmentsManager'
import { UnavailabilityManager } from '@/components/clinic/UnavailabilityManager'
import { PoliciesManager } from '@/components/clinic/PoliciesManager'
import { DoctorsManager } from '@/components/clinic/DoctorsManager'
import { Badge } from '@/components/ui/Badge'

const TABS = [
  { id: 'general', label: 'Configuración general', icon: Building },
  { id: 'schedules', label: 'Horarios', icon: Clock },
  { id: 'unavailability', label: 'No disponibilidad', icon: Calendar },
  { id: 'policies', label: 'Políticas', icon: Shield },
  { id: 'doctors', label: 'Doctores', icon: Users },
  { id: 'treatments', label: 'Tratamientos', icon: Stethoscope },
] as const

type TabId = typeof TABS[number]['id']

function KnowledgeBaseContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = (searchParams.get('tab') || 'general') as TabId
  const { hasPermission } = useAuthStore()

  // Permission checks
  const canView = hasPermission('knowledge_base.view')
  const readOnly = !hasPermission('knowledge_base.edit')

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[var(--card)] border border-[var(--line)] rounded-[10px] min-h-[380px] max-w-md mx-auto text-center shadow-[0_1px_2px_rgba(20,20,25,0.05)]">
        <div className="w-11 h-11 border border-[var(--line)] rounded-[7px] bg-[var(--head)] flex items-center justify-center text-[var(--neg)] mb-3">
          <AlertCircle size={22} />
        </div>
        <h2 className="text-[18px] font-semibold text-[var(--ink)] mb-1.5">Acceso Denegado</h2>
        <p className="text-[13px] text-[var(--muted)] leading-relaxed mb-5">
          No tienes los permisos necesarios para ver o modificar la base de conocimiento clínica. Por favor contacta al administrador.
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

  const handleTabChange = (tabId: TabId) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    router.push(`?${params.toString()}`)
  }

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <ClinicConfigForm readOnly={readOnly} />
      case 'schedules':
        return <ScheduleEditor readOnly={readOnly} />
      case 'treatments':
        return <TreatmentsManager readOnly={readOnly} />
      case 'unavailability':
        return <UnavailabilityManager readOnly={readOnly} />
      case 'policies':
        return <PoliciesManager readOnly={readOnly} />
      case 'doctors':
        return <DoctorsManager readOnly={readOnly} />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-[1340px] mx-auto">
      {/* Header Bar */}
      <div className="flex items-end justify-between gap-5 flex-wrap pb-4 border-b border-[var(--line)]">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-semibold tracking-[-0.028em] text-[var(--ink)] leading-tight">
            Base de conocimiento
          </h1>
          <p className="text-[13.5px] text-[var(--muted)]">
            Configuración clínica y catálogo general que utiliza el agente.
          </p>
        </div>

        {readOnly ? (
          <Badge variant="neutral" size="sm" dot>
            Modo Solo Lectura
          </Badge>
        ) : (
          <div data-badge style={{ height: '32px' }}>
            <Check size={13} strokeWidth={2} />
            Sincronizado hace 4 min
          </div>
        )}
      </div>

      {/* Segmented Horizontal Tabs Navigation */}
      <div data-tabs>
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              data-tab
              data-active={isActive}
              onClick={() => handleTabChange(tab.id)}
            >
              <Icon size={14} strokeWidth={1.75} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content Display Area */}
      <div>
        {renderActiveTabContent()}
      </div>
    </div>
  )
}

export default function KnowledgeBasePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6 max-w-[1340px] mx-auto animate-dentral-shimmer">
          <div className="h-8 w-48 bg-[var(--surface-2)] rounded-[6px]" />
          <div className="h-48 bg-[var(--card)] border border-[var(--line)] rounded-[10px]" />
        </div>
      }
    >
      <KnowledgeBaseContent />
    </Suspense>
  )
}
