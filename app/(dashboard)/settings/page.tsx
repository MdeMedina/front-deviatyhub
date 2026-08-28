'use client'

import React from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useUIStore } from '@/lib/stores/ui.store'
import { ClinicConfigForm } from '@/components/clinic/ClinicConfigForm'

export default function SettingsPage() {
  const { hasPermission } = useAuthStore()
  const { theme, toggleTheme } = useUIStore()

  // Permissions check
  const canView = hasPermission('clinic_config.view')
  const readOnly = !hasPermission('clinic_config.edit')

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[var(--card)] border border-[var(--line)] rounded-[10px] min-h-[380px] max-w-md mx-auto text-center shadow-[0_1px_2px_rgba(20,20,25,0.05)]">
        <div className="w-11 h-11 border border-[var(--line)] rounded-[7px] bg-[var(--head)] flex items-center justify-center text-[var(--neg)] mb-3">
          <AlertCircle size={22} />
        </div>
        <h2 className="text-[18px] font-semibold text-[var(--ink)] mb-1.5">Acceso Denegado</h2>
        <p className="text-[13px] text-[var(--muted)] leading-relaxed mb-5">
          No tienes los permisos necesarios para ver o modificar la configuración de la clínica. Por favor contacta al administrador.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-4 py-2 bg-[var(--ink)] hover:opacity-85 text-[var(--bg)] font-medium rounded-[7px] text-[13px] transition-opacity gap-2"
        >
          Ir al Dashboard
          <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 max-w-[1340px] mx-auto">
      {/* Header Bar */}
      <div className="flex items-end justify-between gap-5 flex-wrap pb-4 border-b border-[var(--line)]">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-semibold tracking-[-0.028em] text-[var(--ink)] leading-tight">
            Configuración de la Clínica
          </h1>
          <p className="text-[13.5px] text-[var(--muted)]">
            Administra los datos generales de contacto y configuración regional.
          </p>
        </div>

        {readOnly && (
          <span data-badge>
            <span data-dot />
            Modo Solo Lectura
          </span>
        )}
      </div>

      {/* 2-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', alignItems: 'start' }}>
        {/* Left: Datos de la clínica */}
        <ClinicConfigForm readOnly={readOnly} />

        {/* Right: Preferencias de la plataforma */}
        <div data-card>
          <div data-hd>
            <h2>Preferencias de la plataforma</h2>
          </div>
          <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>Tema oscuro</span>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Aplica el modo oscuro a todo el panel.</span>
              </div>
              <button 
                onClick={toggleTheme}
                style={{
                  width: '38px',
                  height: '22px',
                  borderRadius: '999px',
                  border: '1px solid var(--line)',
                  background: 'var(--surface-2)',
                  position: 'relative',
                  cursor: 'pointer',
                  padding: 0,
                  flex: 'none',
                  transition: 'background-color .15s'
                }}
                aria-label="Cambiar tema oscuro"
              >
                <span 
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: theme === 'dark' ? '18px' : '2px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'var(--blue)',
                    transition: 'left .15s',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
                  }}
                />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', paddingTop: '16px', borderTop: '1px solid var(--line-soft)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>Recordatorios automáticos</span>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Enviar recordatorio 24 h antes de cada cita.</span>
              </div>
              <span data-badge>
                <span data-dot style={{ background: 'var(--pos)' }} />
                Activo
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', paddingTop: '16px', borderTop: '1px solid var(--line-soft)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>Resumen diario por correo</span>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Reporte de conversaciones y citas del día.</span>
              </div>
              <span data-badge>
                <span data-dot />
                Inactivo
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
