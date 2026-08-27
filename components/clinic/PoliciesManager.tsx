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
import { Shield, Plus, Pencil, Trash2, AlertCircle, Save } from 'lucide-react'
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
      <div data-card style={{ maxWidth: '760px' }}>
        <div style={{ padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '260px', gap: '8px' }}>
          <Spinner size="md" />
          <span className="microlabel text-[10px]">Cargando políticas clínicas...</span>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div data-card style={{ maxWidth: '760px' }}>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
          <AlertCircle style={{ color: 'var(--neg)' }} size={22} />
          <p style={{ fontSize: '13px', color: 'var(--neg)', margin: 0 }}>
            No se pudieron cargar las políticas de la clínica.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div data-card style={{ maxWidth: '760px' }}>
        <div data-hd>
          <h2>Políticas de atención</h2>
          {!readOnly && (
            <button data-btn onClick={handleOpenCreateModal}>
              <Plus size={14} strokeWidth={1.9} />
              Agregar Política
            </button>
          )}
        </div>

        {policies.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '8px', textAlign: 'center' }}>
            <div style={{ width: '44px', height: '44px', border: '1px solid var(--line)', borderRadius: '7px', background: 'var(--head)', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
              <Shield size={22} strokeWidth={1.75} />
            </div>
            <p style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>Sin políticas vigentes</p>
            <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: 0, maxWidth: '340px' }}>
              Crea políticas de inasistencia, cancelaciones fuera de plazo u otras reglas de comportamiento.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {policies.map((policy, idx) => (
              <div
                key={policy.id}
                data-testid={`policy-card-${policy.id}`}
                style={{
                  padding: '16px 20px',
                  borderBottom: idx < policies.length - 1 ? '1px solid var(--line-soft)' : 'none',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--ink)' }}>{policy.title}</span>
                  <span style={{ fontSize: '12.5px', lineHeight: 1.55, color: 'var(--muted)', whiteSpace: 'pre-line' }}>
                    {policy.description}
                  </span>
                </div>

                <span data-badge>
                  <span data-dot style={{ background: policy.active ? 'var(--pos)' : undefined }} />
                  {policy.active ? 'Activa' : 'Inactiva'}
                </span>

                {!readOnly && (
                  <span style={{ display: 'flex', gap: '6px' }}>
                    <button
                      data-btn
                      onClick={() => handleOpenEditModal(policy)}
                      style={{ width: '28px', height: '28px', padding: 0 }}
                      title={`Editar ${policy.title}`}
                      aria-label={`Editar ${policy.title}`}
                    >
                      <Pencil size={14} strokeWidth={1.75} />
                    </button>
                    <button
                      data-btn
                      onClick={() => handleDelete(policy.id)}
                      disabled={isDeleting}
                      style={{ width: '28px', height: '28px', padding: 0 }}
                      title={`Eliminar ${policy.title}`}
                      aria-label={`Eliminar ${policy.title}`}
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                    </button>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPolicy ? 'Editar política clínica' : 'Crear política clínica'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isCreating || isUpdating}>
              Cancelar
            </Button>
            <Button onClick={() => handleSubmit()} loading={isCreating || isUpdating} icon={<Save size={14} />}>
              Guardar política
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" aria-label="policy-form">
          <Input
            label="Título de la política"
            placeholder="ej. Política de cancelación de citas"
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
            <label htmlFor="policy-description" className="microlabel flex items-center gap-1">
              Descripción detallada <span className="text-[var(--muted)]">*</span>
            </label>
            <textarea
              id="policy-description"
              placeholder="Escribe aquí las reglas de forma clara para tus pacientes..."
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
              data-inp
              className="resize-none"
              style={{ height: 'auto', padding: '10px 12px', lineHeight: 1.55, borderColor: formErrors.description ? 'var(--neg)' : undefined }}
              required
            />
            {formErrors.description && (
              <p className="text-xs font-medium text-[var(--neg)] mt-0.5">{formErrors.description}</p>
            )}
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between border border-[var(--line)] bg-[var(--surface)] rounded-[7px] p-3.5 mt-1">
            <div>
              <p className="text-[13px] font-medium text-[var(--ink)] m-0">Política activa</p>
              <p className="text-[12px] text-[var(--muted)] m-0 mt-0.5">
                Indica si esta política está actualmente vigente y es obligatoria
              </p>
            </div>
            <button
              type="button"
              aria-label="Toggle Estado Política"
              onClick={() => setIsActive(!isActive)}
              style={{
                width: '38px',
                height: '22px',
                borderRadius: '999px',
                border: '1px solid var(--line)',
                background: isActive ? 'var(--blue)' : 'var(--surface-2)',
                position: 'relative',
                cursor: 'pointer',
                padding: 0,
                transition: 'background-color .15s',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: isActive ? '18px' : '2px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  transition: 'left .15s',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                }}
              />
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
