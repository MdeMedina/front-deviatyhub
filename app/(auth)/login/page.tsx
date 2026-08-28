'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, SunMoon } from 'lucide-react'
import { useLogin } from '@/lib/api/hooks/use-auth'
import { useUIStore } from '@/lib/stores/ui.store'
import { ApiError } from '@/lib/api/client'
import { Logo } from '@/components/brand/Logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const { addToast, toggleTheme } = useUIStore()
  const { mutate: login, isPending } = useLogin()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)
    
    if (!email || !password) {
      const msg = 'Por favor complete todos los campos'
      setValidationError(msg)
      addToast({
        title: 'Error de validación',
        message: msg,
        type: 'error'
      })
      return
    }

    login(
      { email, password },
      {
        onError: (error) => {
          const apiError = error as ApiError
          const msg = apiError.message || 'Credenciales inválidas'
          setValidationError(msg)
          addToast({
            title: 'Fallo al iniciar sesión',
            message: msg,
            type: 'error'
          })
        }
      }
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(430px, 1fr))', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Left Column: Brand & Form */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 48px', minHeight: '100vh' }}>
        {/* Brand Header */}
        <Logo variant="lockup" size={14} />

        {/* Form Container */}
        <div style={{ maxWidth: '360px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--ink)' }}>
              Bienvenido de nuevo
            </h1>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: 'var(--muted)' }}>
              Ingresa tus credenciales para acceder al panel de Dentral.
            </p>
          </div>

          {/* Inline Validation Alert */}
          {validationError && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '11px 13px', border: '1px solid var(--blue-line)', background: 'var(--blue-tint)', borderRadius: '8px' }}>
              <AlertCircle size={15} strokeWidth={1.75} style={{ color: 'var(--blue)', marginTop: '1px', flex: 'none' }} />
              <span style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--ink-soft)' }}>{validationError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div data-field>
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                data-inp
                type="email"
                placeholder="ejemplo@clínica.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                style={{ height: '40px' }}
                required
              />
            </div>

            <div data-field>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
                <label htmlFor="password">Contraseña</label>
                <a href="#" style={{ fontSize: '12px', color: 'var(--muted)', textDecoration: 'none' }}>
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <input
                id="password"
                data-inp
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ height: '40px' }}
                required
              />
            </div>

            <button
              type="submit"
              data-btn="primary"
              disabled={isPending}
              style={{ height: '40px', marginTop: '2px', fontWeight: 500 }}
            >
              {isPending ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
            ¿No tienes cuenta?{' '}
            <a href="#" style={{ fontWeight: 500, textDecoration: 'none' }}>
              Contacta con soporte
            </a>
          </p>
        </div>

        {/* Bottom Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <span data-lbl>Dentral · Plataforma clínica</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link
              href="/set-password?token=demo"
              data-btn
              style={{ height: '28px', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            >
              Establecer contraseña
            </Link>
            <button
              data-btn
              type="button"
              onClick={toggleTheme}
              style={{ height: '28px', width: '32px', padding: 0 }}
              aria-label="Cambiar tema"
            >
              <SunMoon size={14} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Dark Tech Panel */}
      <div 
        style={{
          position: 'relative',
          background: 'var(--blue-deep)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '56px',
          overflow: 'hidden'
        }}
      >
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px)',
            backgroundSize: '64px 64px'
          }} 
        />
        
        <div style={{ position: 'absolute', top: '56px', left: '56px', right: '56px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#5FBF8D' }} />
          <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '10.5px', letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)' }}>
            Nueva versión 2.4 ya disponible
          </span>
        </div>

        <div style={{ position: 'relative', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h2 style={{ margin: 0, fontSize: '34px', lineHeight: 1.15, fontWeight: 600, letterSpacing: '-0.03em', color: '#FFFFFF', textWrap: 'pretty' }}>
            Optimiza la gestión de tu clínica dental
          </h2>
          <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.65, color: 'rgba(255,255,255,.6)', textWrap: 'pretty' }}>
            La plataforma integral impulsada por IA para manejar citas, conversaciones y pacientes de forma inteligente.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1px', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.12)', borderRadius: '10px', overflow: 'hidden', marginTop: '14px' }}>
            <div style={{ background: 'var(--blue-deep)', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <span data-mono style={{ fontSize: '20px', color: '#FFFFFF' }}>24/7</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.45)', lineHeight: 1.4 }}>Atención continua</span>
            </div>
            <div style={{ background: 'var(--blue-deep)', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <span data-mono style={{ fontSize: '20px', color: '#FFFFFF' }}>86%</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.45)', lineHeight: 1.4 }}>Tasa de contención</span>
            </div>
            <div style={{ background: 'var(--blue-deep)', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <span data-mono style={{ fontSize: '20px', color: '#FFFFFF' }}>1.2s</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.45)', lineHeight: 1.4 }}>Respuesta media</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
