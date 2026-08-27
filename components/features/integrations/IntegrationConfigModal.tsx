'use client'

import React, { useEffect, useState } from 'react'
import { IntegrationType } from '@/lib/types'
import { useIntegrationDetails, useSaveIntegration } from '@/lib/api/hooks/use-integrations'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useUIStore } from '@/lib/stores/ui.store'
import { ShieldCheck, Info } from 'lucide-react'

interface IntegrationConfigModalProps {
  isOpen: boolean
  onClose: () => void
  type: IntegrationType | null
}

export const IntegrationConfigModal: React.FC<IntegrationConfigModalProps> = ({
  isOpen,
  onClose,
  type,
}) => {
  const addToast = useUIStore((state) => state.addToast)
  const { data: details, isLoading, isError, refetch } = useIntegrationDetails(type, isOpen)
  const saveMutation = useSaveIntegration()

  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Reset states and preload credentials when details fetch finishes
  useEffect(() => {
    if (isOpen && details?.fields) {
      const initialValues: Record<string, string> = {}
      details.fields.forEach((field) => {
        initialValues[field.key] = field.value || ''
      })
      setFormValues(initialValues)
      setFormErrors({})
    }
  }, [isOpen, details])

  const handleInputChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
    if (formErrors[key]) {
      setFormErrors((prev) => {
        const copy = { ...prev }
        delete copy[key]
        return copy
      })
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!type || !details) return

    // Validar en frontend
    const errors: Record<string, string> = {}
    details.fields.forEach((field) => {
      const val = formValues[field.key]
      const isMissing = !val || val.trim() === ''
      
      // Si el campo es password y ya estaba configurado, se permite enviarlo vacío (el backend conservará el anterior)
      const canBeEmpty = field.type === 'password' && field.configured
      
      if (field.required && isMissing && !canBeEmpty) {
        errors[field.key] = `El campo "${field.label}" es requerido.`
      }
    })

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      addToast({
        title: 'Error de validación',
        message: 'Por favor completa todos los campos obligatorios.',
        type: 'error',
      })
      return
    }

    try {
      await saveMutation.mutateAsync({ type, credentials: formValues })
      addToast({
        title: 'Conexión guardada',
        message: 'Las credenciales han sido cifradas y guardadas con éxito.',
        type: 'success',
      })
      onClose()
    } catch (err: any) {
      addToast({
        title: 'Error al guardar',
        message: err?.message || 'Ocurrió un error inesperado al guardar las credenciales.',
        type: 'error',
      })
    }
  }

  const getCleanTitle = (typeStr: string | null) => {
    if (!typeStr) return 'Configurar Integración'
    const nameMap: Record<string, string> = {
      WHATSAPP: 'WhatsApp Business',
      INSTAGRAM: 'Instagram Direct',
      GOOGLE_CALENDAR: 'Google Calendar',
      DENTALINK: 'Dentalink',
      DENTIDESK: 'Dentidesk',
      GMAIL: 'Gmail & Workspace',
    }
    return `Configurar ${nameMap[typeStr] || typeStr}`
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getCleanTitle(type)}
      size="md"
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={saveMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            size="sm"
            onClick={handleSubmit}
            loading={saveMutation.isPending}
            disabled={isLoading || isError}
          >
            Guardar Conexión
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <Spinner size="md" />
          <span className="microlabel text-[10px]">Cargando esquema de campos...</span>
        </div>
      ) : isError ? (
        <div className="text-center py-8 flex flex-col items-center gap-4">
          <p className="text-[13px] font-medium text-[var(--neg)]">Error al obtener los campos de la integración.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Security Banner */}
          <div className="bg-[var(--blue-tint)] border border-[var(--blue-line)] rounded-[8px] p-3.5 flex gap-3 text-[var(--ink-soft)]">
            <div className="text-[var(--blue)] mt-0.5 shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-[12.5px] font-semibold leading-normal text-[var(--ink)] m-0">Cifrado de extremo a extremo</p>
              <p className="text-[11.5px] text-[var(--muted)] font-medium leading-normal mt-0.5 m-0">
                Tus credenciales y claves de API serán cifradas bajo el estándar AES-256 en nuestros servidores antes de almacenarse en la base de datos.
              </p>
            </div>
          </div>

          {/* Dynamic Form Fields */}
          <div className="flex flex-col gap-4">
            {details?.fields.map((field) => {
              const isPasswordPlaceholder = field.type === 'password' && field.configured && !formValues[field.key]
              return (
                <div key={field.key} className="flex flex-col gap-1">
                  <Input
                    label={field.label}
                    type={field.type}
                    required={field.required}
                    value={isPasswordPlaceholder ? '••••••••' : formValues[field.key] || ''}
                    onChange={(val) => {
                      // Si el usuario edita el valor de la contraseña enmascarada por primera vez, limpiamos para que escriba
                      if (isPasswordPlaceholder) {
                        handleInputChange(field.key, val.replace('••••••••', ''))
                      } else {
                        handleInputChange(field.key, val)
                      }
                    }}
                    placeholder={
                      field.type === 'password'
                        ? field.configured
                          ? 'Dejar vacío para no modificar'
                          : 'Ingresa tu clave secreta...'
                        : `Ingresa ${field.label.toLowerCase()}...`
                    }
                    error={formErrors[field.key]}
                    disabled={saveMutation.isPending}
                  />
                  {field.type === 'password' && field.configured && (
                    <div className="flex items-center gap-1 text-[11px] text-[var(--muted)] font-medium px-1 mt-1">
                      <Info size={11} className="text-[var(--blue)] shrink-0" />
                      <span>Ya tienes una clave guardada. Si la dejas vacía o en ••••••••, se mantendrá la existente.</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </form>
      )}
    </Modal>
  )
}
