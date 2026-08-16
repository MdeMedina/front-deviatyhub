'use client'

import React, { useState } from 'react'
import {
  useUnavailability,
  useCreateUnavailability,
  useUpdateUnavailability,
  useDeleteUnavailability
} from '@/lib/api/hooks/use-clinic'
import { useUIStore } from '@/lib/stores/ui.store'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Calendar, Plus, Edit2, Trash2, AlertCircle, Clock, Save, Info } from 'lucide-react'
import { IUnavailabilityBlock } from '@/lib/types'

const DAYS_MAP: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  0: 'Domingo',
}

const DAYS_SHORT: { id: number; label: string }[] = [
  { id: 1, label: 'L' },
  { id: 2, label: 'M' },
  { id: 3, label: 'M' },
  { id: 4, label: 'J' },
  { id: 5, label: 'V' },
  { id: 6, label: 'S' },
  { id: 0, label: 'D' },
]

export interface UnavailabilityManagerProps {
  readOnly?: boolean
}

export const UnavailabilityManager: React.FC<UnavailabilityManagerProps> = ({ readOnly }) => {
  const { data: blocks = [], isLoading, isError } = useUnavailability()
  const { mutate: createBlock, isPending: isCreating } = useCreateUnavailability()
  const { mutate: updateBlock, isPending: isUpdating } = useUpdateUnavailability()
  const { mutate: deleteBlock, isPending: isDeleting } = useDeleteUnavailability()
  const addToast = useUIStore((state) => state.addToast)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBlock, setEditingBlock] = useState<IUnavailabilityBlock | null>(null)
  
  // Form State
  const [name, setName] = useState('')
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [isActive, setIsActive] = useState(true)

  // Validation state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const handleOpenCreateModal = () => {
    setEditingBlock(null)
    setName('')
    setSelectedDays([])
    setStartTime('')
    setEndTime('')
    setIsActive(true)
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (block: IUnavailabilityBlock) => {
    setEditingBlock(block)
    setName(block.name)
    setSelectedDays(block.days_of_week)
    setStartTime(block.start_time)
    setEndTime(block.end_time)
    setIsActive(block.active)
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleDayToggle = (dayId: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    )
    setFormErrors((prev) => {
      const next = { ...prev }
      delete next.days
      return next
    })
  }

  const validate = () => {
    const errors: Record<string, string> = {}
    
    if (!name.trim()) {
      errors.name = 'El nombre del bloqueo es requerido'
    }
    if (selectedDays.length === 0) {
      errors.days = 'Debe seleccionar al menos un día'
    }
    if (!startTime) {
      errors.startTime = 'La hora de inicio es requerida'
    }
    if (!endTime) {
      errors.endTime = 'La hora de término es requerida'
    }
    if (startTime && endTime && startTime >= endTime) {
      errors.endTime = 'La hora de término debe ser mayor a la hora de inicio'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!validate()) return

    const payload = {
      name,
      days_of_week: selectedDays,
      start_time: startTime,
      end_time: endTime,
      active: isActive,
    }

    if (editingBlock) {
      updateBlock(
        { ...payload, id: editingBlock.id },
        {
          onSuccess: () => {
            addToast({
              title: 'Bloqueo actualizado',
              message: 'El bloqueo de no disponibilidad se ha actualizado correctamente.',
              type: 'success',
            })
            setIsModalOpen(false)
          },
          onError: () => {
            addToast({
              title: 'Error al actualizar',
              message: 'Ocurrió un problema al guardar los cambios del bloqueo.',
              type: 'error',
            })
          },
        }
      )
    } else {
      createBlock(payload, {
        onSuccess: () => {
          addToast({
            title: 'Bloqueo creado',
            message: 'El nuevo bloqueo de no disponibilidad se ha registrado con éxito.',
            type: 'success',
          })
          setIsModalOpen(false)
        },
        onError: () => {
          addToast({
            title: 'Error al crear',
            message: 'No se pudo registrar el nuevo bloqueo de no disponibilidad.',
            type: 'error',
          })
        },
      })
    }
  }

  const handleDelete = (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este bloqueo de no disponibilidad?')) {
      deleteBlock(id, {
        onSuccess: () => {
          addToast({
            title: 'Bloqueo eliminado',
            message: 'El bloqueo de no disponibilidad se ha removido exitosamente.',
            type: 'success',
          })
        },
        onError: () => {
          addToast({
            title: 'Error al eliminar',
            message: 'Ocurrió un error al intentar eliminar el bloqueo.',
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
        <p className="text-sm font-semibold text-slate-500">Cargando periodos de no disponibilidad...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-100 rounded-3xl text-center max-w-2xl mx-auto flex flex-col items-center gap-3">
        <AlertCircle className="text-rose-500 w-8 h-8" />
        <p className="text-sm font-semibold text-rose-600">
          No se pudieron cargar los periodos de no disponibilidad.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header and Add Action */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">No disponibilidad</h2>
          <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-0.5">
            Bloqueos periódicos, almuerzos médicos y feriados
          </p>
        </div>
        {!readOnly && (
          <Button
            onClick={handleOpenCreateModal}
            icon={<Plus size={18} />}
            className="sm:self-center"
          >
            Agregar Bloqueo
          </Button>
        )}
      </div>

      {/* List of Blocks */}
      {blocks.length === 0 ? (
        <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto flex flex-col items-center gap-3">
          <Calendar size={40} className="text-slate-300" />
          <p className="text-sm font-bold text-slate-600">Sin bloqueos registrados</p>
          <p className="text-xs text-slate-400">
            Define horarios repetitivos en los cuales no se deben agendar citas de forma automática.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between gap-4 hover:shadow-md hover:border-slate-200/60 transition-all duration-200"
              data-testid={`block-card-${block.id}`}
            >
              {/* Header inside Card */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-sm md:text-base">{block.name}</h3>
                    <Badge
                      variant={block.active ? 'success' : 'neutral'}
                      size="sm"
                      label={block.active ? 'Activo' : 'Inactivo'}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Clock size={12} className="text-indigo-500" />
                    <span>
                      {block.start_time} - {block.end_time}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {!readOnly && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(block)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      aria-label={`Editar ${block.name}`}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(block.id)}
                      disabled={isDeleting}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      aria-label={`Eliminar ${block.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>

              {/* Days List */}
              <div className="flex flex-wrap gap-1">
                {block.days_of_week.map((d) => (
                  <Badge
                    key={d}
                    variant="purple"
                    size="sm"
                    label={DAYS_MAP[d] || `Día ${d}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBlock ? 'Editar Bloqueo de Horario' : 'Crear Bloqueo de Horario'}
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
              Guardar Bloqueo
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4" aria-label="unavailability-form">
          <Input
            label="Nombre del Bloqueo"
            placeholder="ej. Almuerzo del Equipo, Reunión Clínica"
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

          {/* Days of Week multiselect */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 ml-1">
              Días Aplicables <span className="text-rose-500">*</span>
            </label>
            <div className="flex bg-slate-50 border border-slate-100 p-1.5 rounded-2xl justify-between gap-1">
              {DAYS_SHORT.map((day) => {
                const isSelected = selectedDays.includes(day.id)
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => handleDayToggle(day.id)}
                    aria-label={`Toggle día ${DAYS_MAP[day.id]}`}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/40'
                    }`}
                  >
                    {day.label}
                  </button>
                )
              })}
            </div>
            {formErrors.days && (
              <p className="text-xs font-medium text-rose-500 ml-1 mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {formErrors.days}
              </p>
            )}
          </div>

          {/* Time Picker Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="unavailability-start-time" className="text-sm font-semibold text-slate-700 ml-1">
                Hora de Inicio <span className="text-rose-500">*</span>
              </label>
              <input
                id="unavailability-start-time"
                type="time"
                aria-label="Hora de Inicio"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value)
                  setFormErrors((prev) => {
                    const next = { ...prev }
                    delete next.startTime
                    return next
                  })
                }}
                className={`w-full px-4 py-2.5 bg-white border rounded-xl text-slate-700 transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 ${
                  formErrors.startTime ? 'border-rose-300' : 'border-slate-200'
                }`}
                required
              />
              {formErrors.startTime && (
                <p className="text-xs font-medium text-rose-500 ml-1 mt-1 flex items-center gap-1">
                  {formErrors.startTime}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="unavailability-end-time" className="text-sm font-semibold text-slate-700 ml-1">
                Hora de Término <span className="text-rose-500">*</span>
              </label>
              <input
                id="unavailability-end-time"
                type="time"
                aria-label="Hora de Término"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value)
                  setFormErrors((prev) => {
                    const next = { ...prev }
                    delete next.endTime
                    return next
                  })
                }}
                className={`w-full px-4 py-2.5 bg-white border rounded-xl text-slate-700 transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 ${
                  formErrors.endTime ? 'border-rose-300' : 'border-slate-200'
                }`}
                required
              />
              {formErrors.endTime && (
                <p className="text-xs font-medium text-rose-500 ml-1 mt-1 flex items-center gap-1">
                  {formErrors.endTime}
                </p>
              )}
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-2">
            <div className="flex gap-2.5 items-center">
              <Info size={16} className="text-indigo-500" />
              <div>
                <p className="text-sm font-bold text-slate-700">Bloqueo Activo</p>
                <p className="text-[10px] text-slate-400 font-medium">
                  Define si este bloqueo de reserva está actualmente en vigor
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Toggle Estado Bloqueo"
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
