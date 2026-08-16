'use client'

import React, { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Building,
  Clock,
  Calendar,
  Shield,
  Users,
  Stethoscope,
  AlertCircle,
  BookOpen
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { ClinicConfigForm } from '@/components/clinic/ClinicConfigForm'
import { ScheduleEditor } from '@/components/clinic/ScheduleEditor'
import { TreatmentsManager } from '@/components/clinic/TreatmentsManager'
import { UnavailabilityManager } from '@/components/clinic/UnavailabilityManager'
import { PoliciesManager } from '@/components/clinic/PoliciesManager'
import { DoctorsManager } from '@/components/clinic/DoctorsManager'
import { EmptyState } from '@/components/ui/EmptyState'

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

  // 1. Permission checks
  const canView = hasPermission('knowledge_base.view')
  const readOnly = !hasPermission('knowledge_base.edit')

  if (!canView) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50 min-h-[calc(100vh-10rem)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-slate-100 rounded-3xl p-8 max-w-md w-full text-center shadow-xl shadow-slate-100/50"
        >
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Acceso Denegado</h2>
          <p className="text-slate-500 text-sm mb-6">
            No tienes los permisos necesarios para ver o modificar la base de conocimiento clínica. Por favor contacta al administrador.
          </p>
        </motion.div>
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
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <BookOpen size={22} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Base de Conocimiento</h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-0.5">
              Configuración Clínica & Catálogo General
            </p>
          </div>
        </div>
        {readOnly && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-xs font-bold text-amber-700">
            <AlertCircle size={14} />
            Modo Solo Lectura
          </div>
        )}
      </div>

      {/* Segmented Horizontal Tabs Navigation */}
      <div className="flex overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex bg-slate-50 border border-slate-100 rounded-2xl p-1 shadow-inner gap-1 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 uppercase tracking-wider ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="mt-6">
        {renderActiveTabContent()}
      </div>
    </div>
  )
}

export default function KnowledgeBasePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      }
    >
      <KnowledgeBaseContent />
    </Suspense>
  )
}
