'use client'

import React, { useState, useEffect } from 'react'
import { useClinicConfig, useUpdateClinicConfig } from '@/lib/api/hooks/use-clinic'
import { useUIStore } from '@/lib/stores/ui.store'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { Save } from 'lucide-react'

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
      <div data-card style={{ padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <Spinner size="md" />
        <span className="microlabel text-[10px] mt-2">Cargando configuración...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div data-card style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: 'var(--neg)' }}>
          No se pudo cargar la configuración de la clínica. Por favor, intente de nuevo.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="config-form"
      data-card
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <div data-hd>
        <h2>Datos de la clínica</h2>
        <span data-lbl>Obligatorios *</span>
      </div>

      <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
        <div data-field>
          <Input
            label="Nombre de la clínica *"
            placeholder="Ej: Deviaty Dental Care"
            value={name}
            onChange={setName}
            error={errors.name}
            disabled={readOnly}
            required
          />
        </div>

        <div data-field>
          <Input
            label="Teléfono de contacto *"
            placeholder="Ej: +56 9 1234 5678"
            value={phone}
            onChange={setPhone}
            error={errors.phone}
            disabled={readOnly}
            required
          />
        </div>

        <div data-field>
          <Input
            label="Correo electrónico *"
            placeholder="Ej: contacto@deviaty.cl"
            type="email"
            value={email}
            onChange={setEmail}
            error={errors.email}
            disabled={readOnly}
            required
          />
        </div>

        <div data-field>
          <Input
            label="Dirección física"
            placeholder="Ej: Av. Providencia 1234, Oficina 501"
            value={address}
            onChange={setAddress}
            disabled={readOnly}
          />
        </div>

        {/* Timezone Select */}
        <div data-field>
          <label htmlFor="st-tz">
            Zona horaria *
          </label>
          <select
            id="st-tz"
            data-inp
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            disabled={readOnly}
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
        <div data-field>
          <label htmlFor="st-lang">
            Idioma por defecto *
          </label>
          <select
            id="st-lang"
            data-inp
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={readOnly}
          >
            <option value="es">Español (es)</option>
            <option value="en">English (en)</option>
          </select>
        </div>
      </div>

      {!readOnly && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '13px 20px', borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
          <button
            data-btn="primary"
            type="submit"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Spinner size="sm" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <Save size={14} strokeWidth={1.75} />
                <span>Guardar cambios</span>
              </>
            )}
          </button>
        </div>
      )}
    </form>
  )
}
