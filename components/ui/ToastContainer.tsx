'use client'

import React from 'react'
import { AnimatePresence } from 'framer-motion'
import { useUIStore } from '@/lib/stores/ui.store'
import { Toast } from './Toast'

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore()

  return (
    <div 
      className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
    >
      <div className="flex flex-col gap-3 pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <Toast 
              key={toast.id} 
              toast={toast} 
              onRemove={removeToast} 
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
