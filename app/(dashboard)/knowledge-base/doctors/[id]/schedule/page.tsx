'use client'

import React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useDoctors } from '@/lib/api/hooks/use-clinic'
import { Spinner } from '@/components/ui/Spinner'
import { WeeklyScheduleEditor } from '@/components/schedule/WeeklyScheduleEditor'
import { AbsencesManager } from '@/components/schedule/AbsencesManager'

export default function DoctorSchedulePage() {
  const { id } = useParams<{ id: string }>()
  const { hasPermission } = useAuthStore()
  const { data: doctors, isLoading } = useDoctors()

  const canView = hasPermission('knowledge_base.view')
  const readOnly = !hasPermission('knowledge_base.edit')
  const doctor = doctors?.find((d) => d.id === id)

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[var(--card)] border border-[var(--line)] rounded-[10px] min-h-[380px] max-w-md mx-auto text-center">
        <div className="w-11 h-11 border border-[var(--line)] rounded-[7px] bg-[var(--head)] flex items-center justify-center text-[var(--neg)] mb-3">
          <AlertCircle size={22} />
        </div>
        <h2 className="text-[18px] font-semibold text-[var(--ink)] mb-1.5">Acceso denegado</h2>
        <p className="text-[13px] text-[var(--muted)] leading-relaxed">
          No tienes permisos para ver la jornada de los profesionales.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[380px]">
        <Spinner />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-6 max-w-[900px] mx-auto"
    >
      <div className="flex items-center gap-3 pb-4 border-b border-[var(--line)]">
        <Link
          href="/knowledge-base/doctors"
          data-btn
          style={{ width: '32px', height: '32px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Volver a especialistas"
        >
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1 className="text-[18px] font-semibold text-[var(--ink)]">
            Jornada de {doctor?.name ?? 'el profesional'}
          </h1>
          <p className="text-[13px] text-[var(--muted)]">
            {doctor?.title ?? 'Determina las horas que el agente puede ofrecer'}
          </p>
        </div>
      </div>

      <WeeklyScheduleEditor doctorId={id} doctorName={doctor?.name} readOnly={readOnly} />

      <div className="pt-2 border-t border-[var(--line)]" />

      <AbsencesManager doctorId={id} readOnly={readOnly} />
    </motion.div>
  )
}
