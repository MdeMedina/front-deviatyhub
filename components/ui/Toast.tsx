'use client'

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { IToast } from '@/lib/stores/ui.store'

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

  const dots = {
    success: 'bg-[var(--pos)]',
    error: 'bg-[var(--neg)]',
    warning: 'bg-[var(--muted)]',
    info: 'bg-[var(--blue)]',
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10, transition: { duration: 0.15 } }}
      className="flex items-start gap-3 p-3.5 rounded-[10px] border border-[var(--line)] bg-[var(--card)] shadow-[0_1px_2px_rgba(20,20,25,0.05)] min-w-[300px] max-w-sm"
      role="alert"
    >
      <div className="shrink-0 mt-1">
        <span className={`block w-2 h-2 rounded-full ${dots[toast.type] || 'bg-[var(--blue)]'}`} />
      </div>
      
      <div className="flex-1 space-y-0.5">
        <h4 className="text-[13px] font-semibold text-[var(--ink)] leading-snug">{toast.title}</h4>
        {toast.message && (
          <p className="text-[12px] text-[var(--muted)] leading-relaxed">
            {toast.message}
          </p>
        )}
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 p-1 text-[var(--muted)] hover:text-[var(--ink)] rounded-[4px] transition-colors cursor-pointer"
        aria-label="Cerrar notificación"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}
