'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, AlertCircle, Users } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { DoctorsManager } from '@/components/clinic/DoctorsManager'
import { Badge } from '@/components/ui/Badge'

export default function StandaloneDoctorsPage() {
  const { hasPermission } = useAuthStore()

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
          No tienes los permisos necesarios para ver o modificar el cuerpo médico de la clínica. Por favor contacta al administrador.
        </p>
        <Link
          href="/knowledge-base"
          className="inline-flex items-center justify-center px-4 py-2 bg-[var(--ink)] hover:opacity-85 text-[var(--bg)] font-medium rounded-[7px] text-[13px] transition-opacity"
        >
          Volver a Base de Conocimiento
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 max-w-[1340px] mx-auto">
      {/* Back Button Navigation and Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[var(--line)]">
        <div className="flex items-center gap-3">
          <Link
            href="/knowledge-base?tab=doctors"
            data-btn
            style={{ width: '32px', height: '32px', padding: 0 }}
            title="Volver a Base de Conocimiento"
            aria-label="Volver a Base de Conocimiento"
          >
            <ArrowLeft size={16} strokeWidth={1.75} />
          </Link>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 grid place-items-center border border-[var(--line)] rounded-[7px] bg-[var(--head)] text-[var(--ink)] shrink-0">
                <Users size={15} strokeWidth={1.75} />
              </span>
              <h1 className="text-[24px] font-semibold tracking-[-0.028em] text-[var(--ink)] leading-tight">
                Gestión Standalone de Doctores
              </h1>
            </div>
            <p className="text-[13.5px] text-[var(--muted)] ml-[38px]">
              Cuerpo médico y tratamientos autorizados
            </p>
          </div>
        </div>

        {readOnly && (
          <Badge variant="neutral" size="sm" dot>
            Modo Solo Lectura
          </Badge>
        )}
      </div>

      {/* Main Content Component */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <DoctorsManager readOnly={readOnly} />
      </motion.div>
    </div>
  )
}
