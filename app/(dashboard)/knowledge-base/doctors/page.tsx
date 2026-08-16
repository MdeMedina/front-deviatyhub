'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, AlertCircle, Users } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { DoctorsManager } from '@/components/clinic/DoctorsManager'

export default function StandaloneDoctorsPage() {
  const { hasPermission } = useAuthStore()

  const canView = hasPermission('knowledge_base.view')
  const readOnly = !hasPermission('knowledge_base.edit')

  if (!canView) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50 min-h-[calc(100vh-10rem)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white border border-slate-100 rounded-3xl p-8 max-w-md w-full text-center shadow-xl shadow-slate-100/50"
        >
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Acceso Denegado</h2>
          <p className="text-slate-500 text-sm mb-6">
            No tienes los permisos necesarios para ver o modificar el cuerpo médico de la clínica. Por favor contacta al administrador.
          </p>
          <Link
            href="/knowledge-base"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-colors"
          >
            Volver a Base de Conocimiento
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-300">
      {/* Back Button Navigation and Header */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/knowledge-base?tab=doctors"
            className="p-3 text-slate-400 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all group"
            title="Volver a Base de Conocimiento"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Users size={16} />
              </div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                Gestión Standalone de Doctores
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-0.5 ml-10">
              Cuerpo Médico & Tratamientos Autorizados
            </p>
          </div>
        </div>

        {readOnly && (
          <div className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-xs font-bold text-amber-700">
            <AlertCircle size={14} />
            Modo Solo Lectura
          </div>
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
