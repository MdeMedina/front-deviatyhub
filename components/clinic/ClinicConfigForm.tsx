import React, { useState, useEffect } from 'react'
import { useClinicConfig, useUpdateClinicConfig } from '@/lib/api/hooks/use-clinic'
import { useUIStore } from '@/lib/stores/ui.store'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Building, Phone, Mail, Globe, Languages, Save } from 'lucide-react'

export interface ClinicConfigFormProps {
  readOnly?: boolean
}

export const ClinicConfigForm: React.FC<ClinicConfigFormProps> = ({ readOnly }) => {
  const { data: clinic, isLoading, isError } = useClinicConfig()
  const { mutate: updateConfig, isPending } = useUpdateClinicConfig()
  const addToast = useUIStore((state) => state.addToast)

  // Local state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [timezone, setTimezone] = useState('America/Santiago')
  const [language, setLanguage] = useState('es')
  const [address, setAddress] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)

  // Validation errors
  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    phone?: string
  }>({})

  // Populate state on load
  useEffect(() => {
    if (clinic && !isInitialized) {
      setName(clinic.name || '')
      setEmail(clinic.email || '')
      setPhone(clinic.phone || '')
      setTimezone(clinic.timezone || 'America/Santiago')
      setLanguage(clinic.language || 'es')
      setAddress(clinic.address || '')
      setIsInitialized(true)
    }
  }, [clinic, isInitialized])

  const validate = () => {
    const newErrors: typeof errors = {}
    if (!name.trim()) {
      newErrors.name = 'El nombre de la clínica es requerido'
    }
    if (!phone.trim()) {
      newErrors.phone = 'El teléfono es requerido'
    }
    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es requerido'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        newErrors.email = 'El formato del correo electrónico no es válido'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    updateConfig(
      {
        name,
        email,
        phone,
        timezone,
        language,
        address,
      },
      {
        onSuccess: () => {
          addToast({
            title: 'Configuración guardada',
            message: 'Los datos de la clínica se han actualizado con éxito.',
            type: 'success',
          })
        },
        onError: () => {
          addToast({
            title: 'Error al guardar',
            message: 'Ocurrió un error al actualizar los datos de la clínica.',
            type: 'error',
          })
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-100 shadow-sm min-h-[400px]">
        <Spinner size="lg" className="text-indigo-600 mb-4 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Cargando configuración...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-100 rounded-3xl text-center">
        <p className="text-sm font-semibold text-rose-600">
          No se pudo cargar la configuración de la clínica. Por favor, intente de nuevo.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="config-form"
      className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm max-w-2xl mx-auto space-y-6"
    >
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900 leading-tight">Configuración General</h2>
        <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-0.5">
          Datos de contacto e idioma de la clínica
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="Nombre de la Clínica"
          placeholder="Ej: Clínica Dental Premium"
          value={name}
          onChange={setName}
          error={errors.name}
          leftIcon={<Building size={16} />}
          disabled={readOnly}
          required
        />

        <Input
          label="Teléfono de Contacto"
          placeholder="Ej: +56912345678"
          value={phone}
          onChange={setPhone}
          error={errors.phone}
          leftIcon={<Phone size={16} />}
          disabled={readOnly}
          required
        />

        <Input
          label="Correo Electrónico"
          placeholder="Ej: contacto@clinica.com"
          type="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          leftIcon={<Mail size={16} />}
          disabled={readOnly}
          required
        />

        <Input
          label="Dirección Física"
          placeholder="Ej: Av. Providencia 1234, Oficina 501"
          value={address}
          onChange={setAddress}
          leftIcon={<Building size={16} />}
          disabled={readOnly}
        />

        {/* Timezone Select */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="timezone-select"
            className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-1"
          >
            <Globe size={16} className="text-slate-400" />
            Zona Horaria
            <span className="text-rose-500">*</span>
          </label>
          <select
            id="timezone-select"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            disabled={readOnly}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 hover:border-slate-300 cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            <option value="America/Santiago">Santiago (America/Santiago)</option>
            <option value="America/Bogota">Bogotá (America/Bogota)</option>
            <option value="America/Mexico_City">Ciudad de México (America/Mexico_City)</option>
            <option value="America/Argentina/Buenos_Aires">Buenos Aires (America/Argentina/Buenos_Aires)</option>
            <option value="America/Lima">Lima (America/Lima)</option>
            <option value="America/Caracas">Caracas (America/Caracas)</option>
            <option value="America/New_York">Nueva York (America/New_York)</option>
            <option value="America/Los_Angeles">Los Ángeles (America/Los_Angeles)</option>
            <option value="UTC">Coordinated Universal Time (UTC)</option>
          </select>
        </div>

        {/* Language Select */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="language-select"
            className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-1"
          >
            <Languages size={16} className="text-slate-400" />
            Idioma por Defecto
            <span className="text-rose-500">*</span>
          </label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={readOnly}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 hover:border-slate-300 cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            <option value="es">Español (es)</option>
            <option value="en">English (en)</option>
          </select>
        </div>
      </div>

      {!readOnly && (
        <div className="flex justify-end pt-4 border-t border-slate-50">
          <Button
            type="submit"
            loading={isPending}
            icon={<Save size={18} />}
            className="min-w-[140px]"
          >
            Guardar Cambios
          </Button>
        </div>
      )}
    </form>
  )
}
