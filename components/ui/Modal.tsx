'use client'

import React, { ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className = '',
}) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!mounted) return null

  const sizeClasses = {
    sm: 'max-w-[380px]',
    md: 'max-w-[440px]',
    lg: 'max-w-[620px]',
    xl: 'max-w-[860px]',
  }

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#212121]/45 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className={`relative w-full ${sizeClasses[size]} bg-[var(--card)] border border-[var(--line)] rounded-[12px] shadow-[0_24px_60px_rgba(0,0,0,0.18)] overflow-hidden flex flex-col ${className}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Header */}
            <div className="px-5 py-3.5 bg-[var(--head)] border-b border-[var(--line)] flex items-center justify-between">
              <h3 id="modal-title" className="text-[14.5px] font-semibold text-[var(--ink)] tracking-[-0.012em]">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] rounded-[6px] transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 overflow-y-auto max-h-[70vh] text-[13.5px] text-[var(--ink-soft)]">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-5 py-3 bg-[var(--surface)] border-t border-[var(--line)] flex justify-end gap-2.5">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}
