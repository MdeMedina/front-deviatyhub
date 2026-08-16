'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertCircle, Settings, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { ClinicConfigForm } from '@/components/clinic/ClinicConfigForm'

export default function SettingsPage() {
  const { hasPermission } = useAuthStore()

  // Permisos requeridos
  const canView = hasPermission('clinic_config.view')
  const readOnly = !hasPermission('clinic_config.edit')

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
            No tienes los permisos necesarios para ver o modificar la configuración de la clínica. Por favor contacta al administrador.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-colors gap-2"
          >
            Ir al Dashboard
            <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-300">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Settings size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Configuración de la Clínica</h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-0.5">
              Administra los datos generales de contacto y configuración regional
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

      {/* Settings Form component */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <ClinicConfigForm readOnly={readOnly} />
      </motion.div>
    </div>
  )
}
