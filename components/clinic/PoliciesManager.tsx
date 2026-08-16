'use client'

import React, { useState } from 'react'
import {
  usePolicies,
  useCreatePolicy,
  useUpdatePolicy,
  useDeletePolicy
} from '@/lib/api/hooks/use-clinic'
import { useUIStore } from '@/lib/stores/ui.store'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Shield, Plus, Edit2, Trash2, AlertCircle, Save, Info } from 'lucide-react'
import { IPolicy } from '@/lib/types'

export interface PoliciesManagerProps {
  readOnly?: boolean
}

export const PoliciesManager: React.FC<PoliciesManagerProps> = ({ readOnly }) => {
  const { data: policies = [], isLoading, isError } = usePolicies()
  const { mutate: createPolicy, isPending: isCreating } = useCreatePolicy()
  const { mutate: updatePolicy, isPending: isUpdating } = useUpdatePolicy()
  const { mutate: deletePolicy, isPending: isDeleting } = useDeletePolicy()
  const addToast = useUIStore((state) => state.addToast)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<IPolicy | null>(null)

  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)

  // Validation State
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const handleOpenCreateModal = () => {
    setEditingPolicy(null)
    setTitle('')
    setDescription('')
    setIsActive(true)
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (policy: IPolicy) => {
    setEditingPolicy(policy)
    setTitle(policy.title)
    setDescription(policy.description)
    setIsActive(policy.active)
    setFormErrors({})
    setIsModalOpen(true)
  }

  const validate = () => {
    const errors: Record<string, string> = {}
    
    if (!title.trim()) {
      errors.title = 'El título de la política es requerido'
    }
    if (!description.trim()) {
      errors.description = 'La descripción o cuerpo es requerida'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!validate()) return

    const payload = {
      title,
      description,
      active: isActive,
    }

    if (editingPolicy) {
      updatePolicy(
        { ...payload, id: editingPolicy.id },
        {
          onSuccess: () => {
            addToast({
              title: 'Política actualizada',
              message: 'La política clínica se ha modificado con éxito.',
              type: 'success',
            })
            setIsModalOpen(false)
          },
          onError: () => {
            addToast({
              title: 'Error al actualizar',
              message: 'Ocurrió un error al actualizar la política clínica.',
              type: 'error',
            })
          },
        }
      )
    } else {
      createPolicy(payload, {
        onSuccess: () => {
          addToast({
            title: 'Política creada',
            message: 'Se ha registrado la nueva política con éxito.',
            type: 'success',
          })
          setIsModalOpen(false)
        },
        onError: () => {
          addToast({
            title: 'Error al crear',
            message: 'No se pudo crear la nueva política clínica.',
            type: 'error',
          })
        },
      })
    }
  }

  const handleDelete = (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta política clínica?')) {
      deletePolicy(id, {
        onSuccess: () => {
          addToast({
            title: 'Política eliminada',
            message: 'La política clínica se ha eliminado con éxito.',
            type: 'success',
          })
        },
        onError: () => {
          addToast({
            title: 'Error al eliminar',
            message: 'Ocurrió un error al intentar eliminar la política.',
            type: 'error',
          })
        },
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-100 shadow-sm min-h-[400px]">
        <Spinner size="lg" className="text-indigo-600 mb-4" />
        <p className="text-sm font-semibold text-slate-500">Cargando políticas clínicas...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-100 rounded-3xl text-center max-w-2xl mx-auto flex flex-col items-center gap-3">
        <AlertCircle className="text-rose-500 w-8 h-8" />
        <p className="text-sm font-semibold text-rose-600">
          No se pudieron cargar las políticas de la clínica.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">Políticas Clínicas</h2>
          <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-0.5">
            Define las directrices de agendamiento, inasistencias y reembolsos
          </p>
        </div>
        {!readOnly && (
          <Button
            onClick={handleOpenCreateModal}
            icon={<Plus size={18} />}
            className="sm:self-center"
          >
            Agregar Política
          </Button>
        )}
      </div>

      {/* Grid of Policies */}
      {policies.length === 0 ? (
        <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto flex flex-col items-center gap-3">
          <Shield size={40} className="text-slate-300" />
          <p className="text-sm font-bold text-slate-600">Sin políticas vigentes</p>
          <p className="text-xs text-slate-400">
            Crea políticas de inasistencia, cancelaciones fuera de plazo u otras reglas de comportamiento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:shadow-md hover:border-slate-200/60 transition-all duration-200"
              data-testid={`policy-card-${policy.id}`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-base">{policy.title}</h3>
                  <Badge
                    variant={policy.active ? 'success' : 'neutral'}
                    size="sm"
                    label={policy.active ? 'Activa' : 'Inactiva'}
                  />
                </div>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                  {policy.description}
                </p>
              </div>

              {/* Actions */}
              {!readOnly && (
                <div className="flex sm:flex-col items-center gap-1 self-end sm:self-start">
                  <button
                    onClick={() => handleOpenEditModal(policy)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    aria-label={`Editar ${policy.title}`}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(policy.id)}
                    disabled={isDeleting}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    aria-label={`Eliminar ${policy.title}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal structure */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPolicy ? 'Editar Política Clínica' : 'Crear Política Clínica'}
        footer={
          <div className="flex items-center gap-2 w-full justify-end">
            <Button
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={isCreating || isUpdating}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => handleSubmit()}
              loading={isCreating || isUpdating}
              icon={<Save size={18} />}
            >
              Guardar Política
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4" aria-label="policy-form">
          <Input
            label="Título de la Política"
            placeholder="ej. Política de Cancelación de Citas"
            value={title}
            onChange={(val) => {
              setTitle(val)
              setFormErrors((prev) => {
                const next = { ...prev }
                delete next.title
                return next
              })
            }}
            error={formErrors.title}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="policy-description" className="text-sm font-semibold text-slate-700 ml-1">
              Descripción detallada <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="policy-description"
              placeholder="Escribe aquí las reglas del juego de forma clara para tus pacientes..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                setFormErrors((prev) => {
                  const next = { ...prev }
                  delete next.description
                  return next
                })
              }}
              rows={5}
              className={`w-full px-4 py-2.5 bg-white border rounded-xl text-slate-700 transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 placeholder-slate-400 text-sm ${
                formErrors.description ? 'border-rose-300' : 'border-slate-200'
              }`}
              required
            />
            {formErrors.description && (
              <p className="text-xs font-medium text-rose-500 ml-1 mt-1 flex items-center gap-1">
                {formErrors.description}
              </p>
            )}
          </div>

          {/* Status Toggle in Modal */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-2">
            <div className="flex gap-2.5 items-center">
              <Info size={16} className="text-indigo-500" />
              <div>
                <p className="text-sm font-bold text-slate-700">Política Activa</p>
                <p className="text-[10px] text-slate-400 font-medium">
                  Indica si esta política está actualmente vigente y es obligatoria
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Toggle Estado Política"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:ring-2 focus:ring-indigo-100 focus:ring-offset-1 ${
                isActive ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
