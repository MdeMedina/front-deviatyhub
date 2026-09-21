'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { CalendarClock, AlertCircle } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { WeeklyScheduleEditor } from '@/components/schedule/WeeklyScheduleEditor'
import { AbsencesManager } from '@/components/schedule/AbsencesManager'
import { useMyDoctorProfile } from '@/lib/api/hooks/use-doctor-schedule'

export default function MySchedulePage() {
  const { data: doctor, isLoading, isError } = useMyDoctorProfile()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[380px]">
        <Spinner />
      </div>
    )
  }

  // Un administrador no tiene ficha de profesional: no es un error suyo, así que
  // se le explica en vez de enseñarle un fallo.
  if (isError || !doctor) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[var(--card)] border border-[var(--line)] rounded-[10px] min-h-[380px] max-w-md mx-auto text-center shadow-[0_1px_2px_rgba(20,20,25,0.05)]">
        <div className="w-11 h-11 border border-[var(--line)] rounded-[7px] bg-[var(--head)] flex items-center justify-center text-[var(--muted)] mb-3">
          <AlertCircle size={22} />
        </div>
        <h2 className="text-[18px] font-semibold text-[var(--ink)] mb-1.5">
          Tu cuenta no es la de un profesional
        </h2>
        <p className="text-[13px] text-[var(--muted)] leading-relaxed">
          Esta página muestra la jornada de quien atiende pacientes. Para gestionar la de un
          profesional concreto, entra a su ficha desde la base de conocimiento.
        </p>
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
        <div className="w-9 h-9 border border-[var(--line)] rounded-[7px] bg-[var(--head)] flex items-center justify-center text-[var(--ink)]">
          <CalendarClock size={18} />
        </div>
        <div>
          <h1 className="text-[18px] font-semibold text-[var(--ink)]">Mi jornada</h1>
          <p className="text-[13px] text-[var(--muted)]">
            {doctor.name}
            {doctor.title ? ` · ${doctor.title}` : ''}
          </p>
        </div>
      </div>

      <WeeklyScheduleEditor doctorId={doctor.id} />

      <div className="pt-2 border-t border-[var(--line)]" />

      <AbsencesManager doctorId={doctor.id} />
    </motion.div>
  )
}
