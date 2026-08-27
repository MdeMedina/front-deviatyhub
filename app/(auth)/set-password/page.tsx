'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { useSetPassword } from '@/lib/api/hooks/use-auth'
import { useUIStore } from '@/lib/stores/ui.store'
import { ApiError } from '@/lib/api/client'

function SetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const { addToast } = useUIStore()
  const { mutate: setPassword, isPending } = useSetPassword()

  const [password, setPasswordState] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Real-time validations
  const isLengthValid = password.length >= 8
  const arePasswordsMatching = password === passwordConfirm && password !== ''
  const isValid = isLengthValid && arePasswordsMatching

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!token) {
      const msg = 'No se detectó un token de invitación válido en la URL'
      setErrorMessage(msg)
      addToast({
        title: 'Token faltante',
        message: msg,
        type: 'error'
      })
      return
    }

    if (!isLengthValid) {
      const msg = 'La contraseña debe tener al menos 8 caracteres'
      setErrorMessage(msg)
      addToast({
        title: 'Contraseña insegura',
        message: msg,
        type: 'error'
      })
      return
    }

    if (!arePasswordsMatching) {
      const msg = 'Las contraseñas no coinciden'
      setErrorMessage(msg)
      addToast({
        title: 'Error de coincidencia',
        message: msg,
        type: 'error'
      })
      return
    }

    setPassword(
      { token, password, password_confirm: passwordConfirm },
      {
        onSuccess: () => {
          addToast({
            title: 'Contraseña guardada',
            message: 'Tu contraseña ha sido registrada exitosamente. Redirigiendo...',
            type: 'success'
          })
          setSuccess(true)
          setTimeout(() => {
            router.push('/login')
          }, 2500)
        },
        onError: (error) => {
          const apiError = error as ApiError
          const msg = apiError.message || 'Token expirado o inválido'
          setErrorMessage(msg)
          addToast({
            title: 'Error al cambiar contraseña',
            message: msg,
            type: 'error'
          })
        }
      }
    )
  }

  // Missing token state
  if (!token) {
    return (
      <div style={{ maxWidth: '360px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ width: '44px', height: '44px', border: '1px solid var(--line)', borderRadius: '7px', background: 'var(--head)', display: 'grid', placeItems: 'center', color: 'var(--neg)' }}>
          <AlertCircle size={22} strokeWidth={1.75} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--ink)' }}>
            Enlace inválido
          </h2>
          <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: 'var(--muted)' }}>
            No se ha proporcionado un token en la dirección URL, o el enlace de invitación ha expirado. Por favor solicita un nuevo acceso a tu administrador.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/login')}
          data-btn
          style={{ height: '36px', textAlign: 'center', justifyContent: 'center', display: 'flex', alignItems: 'center' }}
        >
          Volver a Iniciar Sesión
        </button>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div style={{ maxWidth: '360px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ width: '44px', height: '44px', border: '1px solid var(--line)', borderRadius: '7px', background: 'var(--head)', display: 'grid', placeItems: 'center', color: 'var(--pos)' }}>
          <CheckCircle2 size={22} strokeWidth={1.75} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--ink)' }}>
            ¡Todo listo!
          </h2>
          <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: 'var(--muted)' }}>
            Tu contraseña se ha establecido con éxito. Serás redirigido a la pantalla de inicio de sesión en unos instantes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/login')}
          data-btn="primary"
          style={{ height: '40px', textAlign: 'center', justifyContent: 'center', display: 'flex', alignItems: 'center' }}
        >
          Ir al Inicio de Sesión
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '360px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '26px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--ink)' }}>
          Establecer contraseña
        </h1>
        <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: 'var(--muted)' }}>
          Por favor crea una nueva contraseña segura para tu cuenta.
        </p>
      </div>

      {errorMessage && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '11px 13px', border: '1px solid var(--blue-line)', background: 'var(--blue-tint)', borderRadius: '8px' }}>
          <AlertCircle size={15} strokeWidth={1.75} style={{ color: 'var(--blue)', marginTop: '1px', flex: 'none' }} />
          <span style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--ink-soft)' }}>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div data-field>
          <label htmlFor="np">Nueva contraseña</label>
          <input
            id="np"
            data-inp
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPasswordState(e.target.value)}
            style={{ height: '40px' }}
            required
          />
          {password !== '' && !isLengthValid && (
            <span style={{ fontSize: '12px', color: 'var(--neg)' }}>La contraseña debe tener al menos 8 caracteres</span>
          )}
        </div>

        <div data-field>
          <label htmlFor="np2">Confirmar contraseña</label>
          <input
            id="np2"
            data-inp
            type="password"
            placeholder="Repite tu contraseña"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            style={{ height: '40px' }}
            required
          />
          {passwordConfirm !== '' && !arePasswordsMatching && (
            <span style={{ fontSize: '12px', color: 'var(--neg)' }}>Las contraseñas no coinciden</span>
          )}
        </div>

        {/* Real-time Requirements */}
        <div style={{ border: '1px solid var(--line)', borderRadius: '9px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '9px', background: 'var(--surface)' }}>
          <span data-lbl>Requisitos de seguridad</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '12.5px', color: 'var(--ink-soft)' }}>
            <span data-dot style={{ background: isLengthValid ? 'var(--pos)' : 'var(--dim)' }} />
            Mínimo 8 caracteres
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '12.5px', color: 'var(--ink-soft)' }}>
            <span data-dot style={{ background: arePasswordsMatching ? 'var(--pos)' : 'var(--dim)' }} />
            Las contraseñas coinciden
          </div>
        </div>

        <button
          type="submit"
          data-btn="primary"
          disabled={isPending || !isValid}
          style={{ height: '40px', fontSize: '13.5px', fontWeight: 500 }}
        >
          {isPending ? 'Guardando...' : 'Guardar Contraseña'}
        </button>

        <Link
          href="/login"
          data-btn
          style={{ height: '36px', textAlign: 'center', justifyContent: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
        >
          Volver a Iniciar Sesión
        </Link>
      </form>
    </div>
  )
}

export default function SetPasswordPage() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(430px, 1fr))', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Left Column */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 48px', minHeight: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '26px', height: '26px', border: '1px solid var(--line)', borderRadius: '6px', display: 'grid', placeItems: 'center', background: 'var(--surface)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="2" fill="var(--blue)" />
              <circle cx="2" cy="2" r="1" fill="var(--dim)" />
              <circle cx="12" cy="2" r="1" fill="var(--dim)" />
              <circle cx="2" cy="12" r="1" fill="var(--dim)" />
              <circle cx="12" cy="12" r="1" fill="var(--dim)" />
            </svg>
          </div>
          <span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--ink)' }}>Dentral</span>
        </div>

        <Suspense fallback={<div style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px 0', fontSize: '13px' }}>Cargando verificación...</div>}>
          <SetPasswordForm />
        </Suspense>

        <span data-lbl>Dentral · Seguridad de la cuenta</span>
      </div>

      {/* Right Column: Dark Tech Panel */}
      <div 
        style={{
          position: 'relative',
          background: 'var(--panel)',
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
            Seguridad de nivel bancario
          </span>
        </div>

        <div style={{ position: 'relative', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h2 style={{ margin: 0, fontSize: '34px', lineHeight: 1.15, fontWeight: 600, letterSpacing: '-0.03em', color: '#FFFFFF', textWrap: 'pretty' }}>
            Protege tu acceso a Dentral
          </h2>
          <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.65, color: 'rgba(255,255,255,.6)', textWrap: 'pretty' }}>
            Establece credenciales seguras para resguardar la información médica, tratamientos y la agenda de tus pacientes.
          </p>
        </div>
      </div>
    </div>
  )
}
