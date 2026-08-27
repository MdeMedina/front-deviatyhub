'use client'

import React, { useState } from 'react'
import {
  useDoctors,
  useCreateDoctor,
  useUpdateDoctor,
  useDeleteDoctor,
  useTreatments
} from '@/lib/api/hooks/use-clinic'
import { useUIStore } from '@/lib/stores/ui.store'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Users, Plus, Pencil, Trash2, AlertCircle, Save, Stethoscope, Check } from 'lucide-react'
import { IDoctor, ITreatmentSummary } from '@/lib/types'

const getInitials = (name: string) => {
  if (!name) return 'DR'
  const parts = name.replace(/^(Dra?\.?\s+)/i, '').trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export interface DoctorsManagerProps {
  readOnly?: boolean
}

export const DoctorsManager: React.FC<DoctorsManagerProps> = ({ readOnly }) => {
  const { data: doctors = [], isLoading: loadingDoctors, isError: errorDoctors } = useDoctors()
  const { data: treatments = [], isLoading: loadingTreatments } = useTreatments()

  const { mutate: createDoctor, isPending: isCreating } = useCreateDoctor()
  const { mutate: updateDoctor, isPending: isUpdating } = useUpdateDoctor()
  const { mutate: deleteDoctor, isPending: isDeleting } = useDeleteDoctor()
  const addToast = useUIStore((state) => state.addToast)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState<IDoctor | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [assignedTreatmentIds, setAssignedTreatmentIds] = useState<string[]>([])

  // Validation State
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const handleOpenCreateModal = () => {
    setEditingDoctor(null)
    setName('')
    setTitle('')
    setIsActive(true)
    setAssignedTreatmentIds([])
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (doctor: IDoctor) => {
    setEditingDoctor(doctor)
    setName(doctor.name)
    setTitle(doctor.title)
    setIsActive(doctor.active)
    setAssignedTreatmentIds(doctor.treatments.map((t) => t.id))
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleTreatmentToggle = (treatmentId: string) => {
    setAssignedTreatmentIds((prev) =>
      prev.includes(treatmentId)
        ? prev.filter((id) => id !== treatmentId)
        : [...prev, treatmentId]
    )
  }

  const validate = () => {
    const errors: Record<string, string> = {}

    if (!name.trim()) {
      errors.name = 'El nombre del doctor es requerido'
    }
    if (!title.trim()) {
      errors.title = 'El cargo o especialidad es requerido'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!validate()) return

    // Map selected IDs back to ITreatmentSummary structures
    const associatedTreatments: ITreatmentSummary[] = treatments
      .filter((t) => assignedTreatmentIds.includes(t.id))
      .map((t) => ({ id: t.id, name: t.name }))

    const payload = {
      name,
      title,
      active: isActive,
      treatments: associatedTreatments,
    }

    if (editingDoctor) {
      updateDoctor(
        { ...payload, id: editingDoctor.id },
        {
          onSuccess: () => {
            addToast({
              title: 'Doctor actualizado',
              message: 'El perfil del doctor se ha guardado correctamente.',
              type: 'success',
            })
            setIsModalOpen(false)
          },
          onError: () => {
            addToast({
              title: 'Error al actualizar',
              message: 'No se pudo actualizar el perfil del doctor.',
              type: 'error',
            })
          },
        }
      )
    } else {
      createDoctor(payload, {
        onSuccess: () => {
          addToast({
            title: 'Doctor registrado',
            message: 'El nuevo especialista clínico ha sido creado con éxito.',
            type: 'success',
          })
          setIsModalOpen(false)
        },
        onError: () => {
          addToast({
            title: 'Error al registrar',
            message: 'Ocurrió una falla al intentar crear el doctor.',
            type: 'error',
          })
        },
      })
    }
  }

  const handleDelete = (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este especialista clínico?')) {
      deleteDoctor(id, {
        onSuccess: () => {
          addToast({
            title: 'Doctor eliminado',
            message: 'El doctor ha sido removido del cuerpo médico con éxito.',
            type: 'success',
          })
        },
        onError: () => {
          addToast({
            title: 'Error al eliminar',
            message: 'Ocurrió un error al intentar desvincular al doctor.',
            type: 'error',
          })
        },
      })
    }
  }

  if (loadingDoctors) {
    return (
      <div data-card>
        <div style={{ padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '260px', gap: '8px' }}>
          <Spinner size="md" />
          <span className="microlabel text-[10px]">Cargando especialistas clínicos...</span>
        </div>
      </div>
    )
  }

  if (errorDoctors) {
    return (
      <div data-card>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
          <AlertCircle style={{ color: 'var(--neg)' }} size={22} />
          <p style={{ fontSize: '13px', color: 'var(--neg)', margin: 0 }}>
            No se pudo obtener el listado de doctores.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div data-card>
        <div data-hd>
          <h2>Doctores</h2>
          {!readOnly && (
            <button data-btn onClick={handleOpenCreateModal}>
              <Plus size={14} strokeWidth={1.9} />
              Agregar Especialista
            </button>
          )}
        </div>

        {doctors.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '8px', textAlign: 'center' }}>
            <div style={{ width: '44px', height: '44px', border: '1px solid var(--line)', borderRadius: '7px', background: 'var(--head)', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
              <Users size={22} strokeWidth={1.75} />
            </div>
            <p style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>Sin especialistas registrados</p>
            <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: 0, maxWidth: '340px' }}>
              Comienza agregando doctores para configurar los calendarios individuales de citas.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table data-tbl>
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Título</th>
                  <th>Tratamientos</th>
                  <th>Estado</th>
                  {!readOnly && <th style={{ textAlign: 'right' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {doctors.map((doctor) => (
                  <tr key={doctor.id} data-testid={`doctor-card-${doctor.id}`}>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'var(--head)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', fontSize: '11px', fontWeight: 600, color: 'var(--ink)', flexShrink: 0 }}>
                          {getInitials(doctor.name)}
                        </span>
                        <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{doctor.name}</span>
                      </span>
                    </td>
                    <td>{doctor.title}</td>
                    <td>
                      {doctor.treatments.length === 0 ? (
                        <span style={{ color: 'var(--muted)' }}>Sin tratamientos vinculados.</span>
                      ) : (
                        <span style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {doctor.treatments.map((t) => (
                            <span key={t.id} data-badge>{t.name}</span>
                          ))}
                        </span>
                      )}
                    </td>
                    <td>
                      <span data-badge>
                        <span data-dot style={{ background: doctor.active ? 'var(--pos)' : undefined }} />
                        {doctor.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    {!readOnly && (
                      <td>
                        <span style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            data-btn
                            onClick={() => handleOpenEditModal(doctor)}
                            style={{ width: '28px', height: '28px', padding: 0 }}
                            title={`Editar ${doctor.name}`}
                            aria-label={`Editar ${doctor.name}`}
                          >
                            <Pencil size={14} strokeWidth={1.75} />
                          </button>
                          <button
                            data-btn
                            onClick={() => handleDelete(doctor.id)}
                            disabled={isDeleting}
                            style={{ width: '28px', height: '28px', padding: 0 }}
                            title={`Eliminar ${doctor.name}`}
                            aria-label={`Eliminar ${doctor.name}`}
                          >
                            <Trash2 size={14} strokeWidth={1.75} />
                          </button>
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Profile Dialog */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDoctor ? 'Editar ficha de doctor' : 'Agregar especialista clínico'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isCreating || isUpdating}>
              Cancelar
            </Button>
            <Button onClick={() => handleSubmit()} loading={isCreating || isUpdating} icon={<Save size={14} />}>
              Guardar ficha
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" aria-label="doctor-form">
          <Input
            label="Nombre completo"
            placeholder="ej. Dra. María Elisa Valenzuela"
            value={name}
            onChange={(val) => {
              setName(val)
              setFormErrors((prev) => {
                const next = { ...prev }
                delete next.name
                return next
              })
            }}
            error={formErrors.name}
            required
          />

          <Input
            label="Especialidad / cargo"
            placeholder="ej. Ortodoncista, Periodoncista"
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

          {/* Treatment Multi-select */}
          <div className="flex flex-col gap-1.5">
            <label className="microlabel">Tratamientos en los que atiende</label>
            {loadingTreatments ? (
              <div className="flex items-center gap-2 py-2 pl-1">
                <Spinner size="sm" />
                <span className="text-[12px] text-[var(--muted)]">Cargando tratamientos del catálogo...</span>
              </div>
            ) : treatments.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-[var(--surface)] border border-[var(--line)] rounded-[7px] text-[var(--muted)]">
                <Stethoscope size={16} />
                <span className="text-[12px] font-medium">No hay tratamientos creados en la clínica.</span>
              </div>
            ) : (
              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[7px] p-1.5 max-h-[180px] overflow-y-auto flex flex-col">
                {treatments.map((t) => {
                  const isChecked = assignedTreatmentIds.includes(t.id)
                  return (
                    <label
                      key={t.id}
                      className="flex items-center justify-between gap-2 py-2 px-2 w-full rounded-[6px] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isChecked}
                          onChange={() => handleTreatmentToggle(t.id)}
                          aria-label={`Tratamiento ${t.name}`}
                        />
                        <span
                          className="grid place-items-center rounded-[5px] shrink-0 transition-colors"
                          style={{
                            width: '18px',
                            height: '18px',
                            border: `1px solid ${isChecked ? 'var(--blue)' : 'var(--line)'}`,
                            background: isChecked ? 'var(--blue)' : 'var(--card)',
                            color: 'var(--on-blue)',
                          }}
                          aria-hidden="true"
                        >
                          {isChecked && <Check size={12} strokeWidth={3} />}
                        </span>
                        <span className="text-[13px] font-medium text-[var(--ink)]">{t.name}</span>
                      </span>
                      <span data-mono className="text-[11.5px] text-[var(--muted)]">
                        ${(t.price ?? 0).toLocaleString('es-CL')}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Active status */}
          <div className="flex items-center justify-between border border-[var(--line)] bg-[var(--surface)] rounded-[7px] p-3.5 mt-1">
            <div>
              <p className="text-[13px] font-medium text-[var(--ink)] m-0">Médico activo</p>
              <p className="text-[12px] text-[var(--muted)] m-0 mt-0.5">
                Habilita la asignación de citas y horarios para este especialista
              </p>
            </div>
            <button
              type="button"
              aria-label="Toggle Estado Doctor"
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
