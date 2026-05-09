'use client'

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { IToast } from '@/lib/types'

interface ToastProps {
  toast: IToast
  onRemove: (id: string) => void
}

export const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id)
      }, toast.duration || 4000)
      return () => clearTimeout(timer)
    }
  }, [toast.id, toast.duration, onRemove])

  const typeStyles = {
    success: 'bg-white border-emerald-100 text-emerald-800 shadow-emerald-100/50',
    error: 'bg-white border-rose-100 text-rose-800 shadow-rose-100/50',
    warning: 'bg-white border-amber-100 text-amber-800 shadow-amber-100/50',
    info: 'bg-white border-sky-100 text-sky-800 shadow-sky-100/50',
  }

  const iconStyles = {
    success: <CheckCircle2 className="text-emerald-500" size={20} />,
    error: <AlertCircle className="text-rose-500" size={20} />,
    warning: <AlertTriangle className="text-amber-500" size={20} />,
    info: <Info className="text-sky-500" size={20} />,
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`flex items-start gap-3 p-4 rounded-2xl border shadow-xl min-w-[320px] max-w-md ${typeStyles[toast.type]}`}
      role="alert"
    >
      <div className="shrink-0 mt-0.5">{iconStyles[toast.type]}</div>
      
      <div className="flex-1 space-y-1">
        <h4 className="text-sm font-bold leading-tight">{toast.title}</h4>
        {toast.message && (
          <p className="text-xs font-medium opacity-80 leading-relaxed">
            {toast.message}
          </p>
        )}
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 p-1 rounded-lg hover:bg-slate-50 transition-colors opacity-40 hover:opacity-100"
        aria-label="Cerrar notificación"
      >
        <X size={16} />
      </button>
    </motion.div>
  )
}
