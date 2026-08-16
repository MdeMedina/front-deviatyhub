'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, LogIn, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
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

  // Real-time validations
  const isLengthValid = password.length >= 8
  const arePasswordsMatching = password === passwordConfirm && password !== ''
  const isValid = isLengthValid && arePasswordsMatching

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      addToast({
        title: 'Token faltante',
        message: 'No se detectó un token de invitación válido en la URL',
        type: 'error'
      })
      return
    }

    if (!isLengthValid) {
      addToast({
        title: 'Contraseña insegura',
        message: 'La contraseña debe tener al menos 8 caracteres',
        type: 'error'
      })
      return
    }

    if (!arePasswordsMatching) {
      addToast({
        title: 'Error de coincidencia',
        message: 'Las contraseñas no coinciden',
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
          }, 3000)
        },
        onError: (error) => {
          const apiError = error as ApiError
          addToast({
            title: 'Error al cambiar contraseña',
            message: apiError.message || 'Token expirado o inválido',
            type: 'error'
          })
        }
      }
    )
  }

  // If token is missing, render a premium warning card
  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-6 border border-rose-100">
          <ShieldAlert size={28} />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Enlace inválido</h2>
        <p className="text-slate-500 font-medium mb-8 leading-relaxed">
          No se ha proporcionado un token en la dirección URL, o el enlace de invitación ha expirado. Por favor solicita un nuevo acceso a tu administrador.
        </p>
        <Button onClick={() => router.push('/login')} variant="secondary" fullWidth>
          Volver a Iniciar Sesión
        </Button>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-6 border border-emerald-100"
        >
          <CheckCircle2 size={28} />
        </motion.div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">¡Todo listo!</h2>
        <p className="text-slate-500 font-medium mb-8 leading-relaxed">
          Tu contraseña se ha establecido con éxito. Serás redirigido a la pantalla de inicio de sesión en unos instantes.
        </p>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 3 }}
            className="bg-emerald-500 h-full"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md w-full mx-auto">
      {/* Brand logo header */}
      <div className="mb-12">
        <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl mb-6 shadow-xl shadow-indigo-100 flex items-center justify-center text-white">
          <Lock size={22} />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Establecer contraseña</h1>
        <p className="mt-2 text-slate-500 font-medium">Por favor crea una nueva contraseña segura para tu cuenta.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Nueva Contraseña"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={setPasswordState}
          type="password"
          required
          leftIcon={<Lock size={18} />}
          error={password !== '' && !isLengthValid ? 'La contraseña debe tener al menos 8 caracteres' : undefined}
        />

        <Input
          label="Confirmar Contraseña"
          placeholder="Repite tu contraseña"
          value={passwordConfirm}
          onChange={setPasswordConfirm}
          type="password"
          required
          leftIcon={<Lock size={18} />}
          error={passwordConfirm !== '' && !arePasswordsMatching ? 'Las contraseñas no coinciden' : undefined}
        />

        {/* Real-time Requirement Indicators */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Requisitos de Seguridad</p>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors ${isLengthValid ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <span>Mínimo 8 caracteres</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors ${arePasswordsMatching ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <span>Las contraseñas coinciden</span>
          </div>
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={isPending}
          disabled={!isValid}
          className="mt-8"
        >
          Guardar Contraseña
          {!isPending && <ArrowRight size={18} className="ml-2" />}
        </Button>
      </form>
    </div>
  )
}

export default function SetPasswordPage() {
  return (
    <div className="min-h-screen flex items-stretch bg-white overflow-hidden">
      {/* Form Section */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-20 xl:px-32 z-10 bg-white">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full"
        >
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4" />
                <span className="text-sm font-semibold text-slate-400">Cargando verificación...</span>
              </div>
            }
          >
            <SetPasswordForm />
          </Suspense>
        </motion.div>
      </div>

      {/* Visual Section - Premium Side */}
      <div className="hidden lg:flex flex-1 relative bg-slate-900 overflow-hidden">
        {/* Animated Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-slate-900 z-0"></div>
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -10, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[100px]"
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-center p-20 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="max-w-lg"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-bold mb-8 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
              Seguridad de nivel bancario
            </div>
            <h2 className="text-5xl font-extrabold text-white leading-tight mb-6">Protege tu acceso a Deviaty Hub</h2>
            <p className="text-xl text-indigo-100/60 font-medium leading-relaxed">
              Establece credenciales seguras para resguardar la información médica, tratamientos y la agenda de tus pacientes.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
