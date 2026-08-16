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
import { Badge } from '@/components/ui/Badge'
import { Users, Plus, Edit2, Trash2, AlertCircle, Save, Stethoscope } from 'lucide-react'
import { IDoctor, ITreatmentSummary } from '@/lib/types'

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
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-100 shadow-sm min-h-[400px]">
        <Spinner size="lg" className="text-indigo-600 mb-4" />
        <p className="text-sm font-semibold text-slate-500">Cargando especialistas clínicos...</p>
      </div>
    )
  }

  if (errorDoctors) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-100 rounded-3xl text-center max-w-2xl mx-auto flex flex-col items-center gap-3">
        <AlertCircle className="text-rose-500 w-8 h-8" />
        <p className="text-sm font-semibold text-rose-600">
          No se pudo obtener el listado de doctores.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header element */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">Doctores & Especialistas</h2>
          <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-0.5">
            Administra el equipo médico, especialidades y tratamientos autorizados
          </p>
        </div>
        {!readOnly && (
          <Button
            onClick={handleOpenCreateModal}
            icon={<Plus size={18} />}
            className="sm:self-center"
          >
            Agregar Especialista
          </Button>
        )}
      </div>

      {/* Grid structure of cards */}
      {doctors.length === 0 ? (
        <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto flex flex-col items-center gap-3">
          <Users size={40} className="text-slate-300" />
          <p className="text-sm font-bold text-slate-600">Sin especialistas registrados</p>
          <p className="text-xs text-slate-400">
            Comienza agregando doctores para configurar los calendarios individuales de citas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between gap-5 hover:shadow-md hover:border-slate-200/60 transition-all duration-200"
              data-testid={`doctor-card-${doctor.id}`}
            >
              {/* Profile Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-sm md:text-base leading-tight">
                      {doctor.name}
                    </h3>
                    <Badge
                      variant={doctor.active ? 'success' : 'neutral'}
                      size="sm"
                      label={doctor.active ? 'Activo' : 'Inactivo'}
                    />
                  </div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    {doctor.title}
                  </p>
                </div>

                {/* Edit Actions */}
                {!readOnly && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(doctor)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      aria-label={`Editar ${doctor.name}`}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(doctor.id)}
                      disabled={isDeleting}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      aria-label={`Eliminar ${doctor.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Treatments as specialized tags */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Tratamientos Autorizados
                </h4>
                {doctor.treatments.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium italic">
                    Sin tratamientos vinculados.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {doctor.treatments.map((t) => (
                      <Badge
                        key={t.id}
                        variant="purple"
                        size="sm"
                        label={t.name}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile Dialog */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDoctor ? 'Editar Ficha de Doctor' : 'Agregar Especialista Clínico'}
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
              Guardar Ficha
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4" aria-label="doctor-form">
          <Input
            label="Nombre Completo"
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
            label="Especialidad / Cargo"
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
            <label className="text-sm font-semibold text-slate-700 ml-1">
              Tratamientos en los que Atiende
            </label>
            {loadingTreatments ? (
              <div className="flex items-center gap-2 py-2 pl-2">
                <Spinner size="sm" />
                <span className="text-xs text-slate-400 font-medium">Cargando tratamientos del catálogo...</span>
              </div>
            ) : treatments.length === 0 ? (
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-2 text-slate-400">
                <Stethoscope size={16} />
                <span className="text-xs font-semibold">No hay tratamientos creados en la clínica.</span>
              </div>
            ) : (
              <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-2xl max-h-[160px] overflow-y-auto divide-y divide-slate-100 flex flex-col gap-1">
                {treatments.map((t) => {
                  const isChecked = assignedTreatmentIds.includes(t.id)
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleTreatmentToggle(t.id)}
                      className="flex items-center justify-between py-2 px-1 text-left w-full rounded-xl hover:bg-slate-100/60 transition-all group"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handle on click of row
                          className="rounded text-indigo-600 focus:ring-indigo-100 pointer-events-none"
                          aria-label={`Tratamiento ${t.name}`}
                        />
                        <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                          {t.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">
                        ${(t.price ?? 0).toLocaleString('es-CL')}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Active status */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-2">
            <div className="flex gap-2.5 items-center">
              <Users size={16} className="text-indigo-500" />
              <div>
                <p className="text-sm font-bold text-slate-700">Médico Activo</p>
                <p className="text-[10px] text-slate-400 font-medium">
                  Habilita la asignación de citas y horarios para este especialista
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Toggle Estado Doctor"
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
