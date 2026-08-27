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
import { Calendar, Plus, Pencil, Trash2, AlertCircle, Save } from 'lucide-react'
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

const DAYS_ABBR: Record<number, string> = {
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
  0: 'Dom',
}

const DAYS_ORDER = [1, 2, 3, 4, 5, 6, 0]

const DAYS_SHORT: { id: number; label: string }[] = [
  { id: 1, label: 'L' },
  { id: 2, label: 'M' },
  { id: 3, label: 'M' },
  { id: 4, label: 'J' },
  { id: 5, label: 'V' },
  { id: 6, label: 'S' },
  { id: 0, label: 'D' },
]

const formatDays = (days: number[]) => {
  return [...days]
    .sort((a, b) => DAYS_ORDER.indexOf(a) - DAYS_ORDER.indexOf(b))
    .map((d) => DAYS_ABBR[d] || `Día ${d}`)
    .join(', ')
}

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
      <div data-card style={{ maxWidth: '760px' }}>
        <div style={{ padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '260px', gap: '8px' }}>
          <Spinner size="md" />
          <span className="microlabel text-[10px]">Cargando periodos de no disponibilidad...</span>
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
            No se pudieron cargar los periodos de no disponibilidad.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div data-card style={{ maxWidth: '760px' }}>
        <div data-hd>
          <h2>Bloques de no disponibilidad</h2>
          {!readOnly && (
            <button data-btn onClick={handleOpenCreateModal}>
              <Plus size={14} strokeWidth={1.9} />
              Agregar Bloqueo
            </button>
          )}
        </div>

        {blocks.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '8px', textAlign: 'center' }}>
            <div style={{ width: '44px', height: '44px', border: '1px solid var(--line)', borderRadius: '7px', background: 'var(--head)', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
              <Calendar size={22} strokeWidth={1.75} />
            </div>
            <p style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>Sin bloqueos registrados</p>
            <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: 0, maxWidth: '340px' }}>
              Define horarios repetitivos en los cuales no se deben agendar citas de forma automática.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table data-tbl>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Días</th>
                  <th>Horario</th>
                  <th>Estado</th>
                  {!readOnly && <th style={{ textAlign: 'right' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {blocks.map((block) => (
                  <tr key={block.id} data-testid={`block-card-${block.id}`}>
                    <td style={{ color: 'var(--ink)', fontWeight: 500 }}>{block.name}</td>
                    <td>{formatDays(block.days_of_week)}</td>
                    <td data-mono>{block.start_time} - {block.end_time}</td>
                    <td>
                      <span data-badge>
                        <span data-dot style={{ background: block.active ? 'var(--pos)' : undefined }} />
                        {block.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    {!readOnly && (
                      <td>
                        <span style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            data-btn
                            onClick={() => handleOpenEditModal(block)}
                            style={{ width: '28px', height: '28px', padding: 0 }}
                            title={`Editar ${block.name}`}
                            aria-label={`Editar ${block.name}`}
                          >
                            <Pencil size={14} strokeWidth={1.75} />
                          </button>
                          <button
                            data-btn
                            onClick={() => handleDelete(block.id)}
                            disabled={isDeleting}
                            style={{ width: '28px', height: '28px', padding: 0 }}
                            title={`Eliminar ${block.name}`}
                            aria-label={`Eliminar ${block.name}`}
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBlock ? 'Editar bloqueo de horario' : 'Crear bloqueo de horario'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isCreating || isUpdating}>
              Cancelar
            </Button>
            <Button onClick={() => handleSubmit()} loading={isCreating || isUpdating} icon={<Save size={14} />}>
              Guardar bloqueo
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" aria-label="unavailability-form">
          <Input
            label="Nombre del bloqueo"
            placeholder="ej. Almuerzo del equipo, Reunión clínica"
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
          <div className="flex flex-col gap-1.5">
            <label className="microlabel flex items-center gap-1">
              Días aplicables <span className="text-[var(--muted)]">*</span>
            </label>
            <div className="flex gap-1.5">
              {DAYS_SHORT.map((day, idx) => {
                const isSelected = selectedDays.includes(day.id)
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleDayToggle(day.id)}
                    aria-label={`Toggle día ${DAYS_MAP[day.id]}`}
                    className={`flex-1 h-9 text-[12.5px] font-medium rounded-[7px] border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--blue-tint)] border-[var(--blue-line)] text-[var(--blue)]'
                        : 'bg-[var(--surface)] border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--dim)]'
                    }`}
                  >
                    {day.label}
                  </button>
                )
              })}
            </div>
            {formErrors.days && (
              <p className="text-xs font-medium text-[var(--neg)] flex items-center gap-1 mt-0.5">
                <AlertCircle size={12} />
                {formErrors.days}
              </p>
            )}
          </div>

          {/* Time Picker Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="unavailability-start-time" className="microlabel flex items-center gap-1">
                Hora de inicio <span className="text-[var(--muted)]">*</span>
              </label>
              <input
                id="unavailability-start-time"
                type="time"
                data-inp
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
                className="tabular"
                style={{ borderColor: formErrors.startTime ? 'var(--neg)' : undefined }}
                required
              />
              {formErrors.startTime && (
                <p className="text-xs font-medium text-[var(--neg)] mt-0.5">{formErrors.startTime}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="unavailability-end-time" className="microlabel flex items-center gap-1">
                Hora de término <span className="text-[var(--muted)]">*</span>
              </label>
              <input
                id="unavailability-end-time"
                type="time"
                data-inp
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
                className="tabular"
                style={{ borderColor: formErrors.endTime ? 'var(--neg)' : undefined }}
                required
              />
              {formErrors.endTime && (
                <p className="text-xs font-medium text-[var(--neg)] mt-0.5">{formErrors.endTime}</p>
              )}
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between border border-[var(--line)] bg-[var(--surface)] rounded-[7px] p-3.5 mt-1">
            <div>
              <p className="text-[13px] font-medium text-[var(--ink)] m-0">Bloqueo activo</p>
              <p className="text-[12px] text-[var(--muted)] m-0 mt-0.5">
                Define si este bloqueo de reserva está actualmente en vigor
              </p>
            </div>
            <button
              type="button"
              aria-label="Toggle Estado Bloqueo"
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
