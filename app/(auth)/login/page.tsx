'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useLogin } from '@/lib/api/hooks/use-auth'
import { useUIStore } from '@/lib/stores/ui.store'
import { ApiError } from '@/lib/api/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { addToast } = useUIStore()
  const { mutate: login, isPending } = useLogin()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      addToast({
        title: 'Error de validación',
        message: 'Por favor complete todos los campos',
        type: 'error'
      })
      return
    }

    login(
      { email, password },
      {
        onError: (error) => {
          const apiError = error as ApiError
          addToast({
            title: 'Fallo al iniciar sesión',
            message: apiError.message || 'Credenciales inválidas',
            type: 'error'
          })
        }
      }
    )
  }

  return (
    <div className="min-h-screen flex items-stretch bg-white overflow-hidden">
      {/* Form Section */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-20 xl:px-32 z-10 bg-white">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full mx-auto"
        >
          {/* Logo / Brand */}
          <div className="mb-12">
            <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl mb-6 shadow-xl shadow-indigo-100 flex items-center justify-center text-white">
              <LogIn size={24} />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Bienvenido de nuevo</h1>
            <p className="mt-2 text-slate-500 font-medium">Ingresa tus credenciales para acceder al panel de Deviaty Hub.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Correo Electrónico"
              placeholder="ejemplo@clínica.com"
              value={email}
              onChange={setEmail}
              type="email"
              required
              leftIcon={<Mail size={18} />}
            />

            <div className="space-y-1">
              <Input
                label="Contraseña"
                placeholder="••••••••"
                value={password}
                onChange={setPassword}
                type="password"
                required
                leftIcon={<Lock size={18} />}
              />
              <div className="flex justify-end">
                <button type="button" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={isPending}
              className="mt-8"
            >
              Iniciar Sesión
              {!isPending && <ArrowRight size={18} className="ml-2" />}
            </Button>
          </form>

          <p className="mt-10 text-center text-sm text-slate-400">
            ¿No tienes cuenta? <span className="text-indigo-600 font-bold cursor-pointer hover:underline">Contacta con soporte</span>
          </p>
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
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -10, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
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
              Nueva versión 2.4 ya disponible
            </div>
            <h2 className="text-5xl font-extrabold text-white leading-tight mb-6">Optimiza la gestión de tu clínica dental</h2>
            <p className="text-xl text-indigo-100/60 font-medium leading-relaxed">
              La plataforma integral impulsada por IA para manejar citas, conversaciones y pacientes de forma inteligente.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
