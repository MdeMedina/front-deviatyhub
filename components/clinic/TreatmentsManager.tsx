import React, { useState } from 'react'
import Link from 'next/link'
import {
  useTreatments,
  useCreateTreatment,
  useUpdateTreatment,
  useDeleteTreatment,
  useEncyclopedia,
} from '@/lib/api/hooks/use-clinic'
import { useUIStore } from '@/lib/stores/ui.store'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import {
  Plus,
  Search,
  Clock,
  DollarSign,
  Pencil,
  Trash2,
  BookOpen,
  AlertCircle,
  Stethoscope,
  Save,
  ArrowUpRight,
} from 'lucide-react'
import { ITreatment } from '@/lib/types'

const fmtPrice = (n: number) => `$${(n ?? 0).toLocaleString('es-CL')}`

export interface TreatmentsManagerProps {
  readOnly?: boolean
}

export const TreatmentsManager: React.FC<TreatmentsManagerProps> = ({ readOnly }) => {
  const { data: treatments = [], isLoading, isError } = useTreatments()
  const createTreatment = useCreateTreatment()
  const updateTreatment = useUpdateTreatment()
  const deleteTreatment = useDeleteTreatment()
  const addToast = useUIStore((state) => state.addToast)

  // Local state
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState<ITreatment | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('')
  const [encyclopediaQuery, setEncyclopediaQuery] = useState('')

  // Validation errors
  const [errors, setErrors] = useState<{
    name?: string
    price?: string
    duration?: string
  }>({})

  // Encyclopedia query hook
  const { data: encyclopediaData = [], isLoading: isLoadingEnc } = useEncyclopedia()

  // Local filter for autocomplete
  const encyclopediaResults = encyclopediaQuery.trim().length >= 2
    ? encyclopediaData.filter(
        (entry) =>
          entry.name.toLowerCase().includes(encyclopediaQuery.toLowerCase()) ||
          entry.description.toLowerCase().includes(encyclopediaQuery.toLowerCase())
      )
    : []

  // Filtered treatments
  const filteredTreatments = treatments.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openAddModal = () => {
    setSelectedTreatment(null)
    setName('')
    setDescription('')
    setPrice('')
    setDuration('')
    setEncyclopediaQuery('')
    setErrors({})
    setIsFormModalOpen(true)
  }

  const openEditModal = (treatment: ITreatment) => {
    setSelectedTreatment(treatment)
    setName(treatment.name)
    setDescription(treatment.description)
    setPrice(String(treatment.price))
    setDuration(String(treatment.duration_min))
    setEncyclopediaQuery('')
    setErrors({})
    setIsFormModalOpen(true)
  }

  const openDeleteModal = (treatment: ITreatment) => {
    setSelectedTreatment(treatment)
    setIsDeleteModalOpen(true)
  }

  const handleSelectEncyclopedia = (title: string, desc: string) => {
    setName(title)
    setDescription(desc)
    setEncyclopediaQuery('') // Close suggestions
  }

  const validate = () => {
    const newErrors: typeof errors = {}
    if (!name.trim()) {
      newErrors.name = 'El nombre del tratamiento es requerido'
    }

    const priceNum = Number(price)
    if (price === '' || isNaN(priceNum)) {
      newErrors.price = 'El precio debe ser un número válido'
    } else if (priceNum < 0) {
      newErrors.price = 'El precio debe ser mayor o igual a 0'
    }

    const durationNum = Number(duration)
    if (duration === '' || isNaN(durationNum)) {
      newErrors.duration = 'La duración debe ser un número válido'
    } else if (durationNum <= 0) {
      newErrors.duration = 'La duración debe ser mayor a 0 minutos'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const payload: Omit<ITreatment, 'id' | 'offers'> = {
      name,
      description,
      price: Number(price),
      duration_min: Number(duration),
      price_isapre: Number(price),
      price_fonasa: Number(price),
      accepts_isapre: selectedTreatment?.accepts_isapre ?? true,
      accepts_fonasa: selectedTreatment?.accepts_fonasa ?? true,
      active: selectedTreatment?.active ?? true,
      encyclopedia_ref: selectedTreatment?.encyclopedia_ref ?? '',
      doctors: selectedTreatment?.doctors ?? [],
    }

    if (selectedTreatment) {
      // Edit
      updateTreatment.mutate(
        { ...selectedTreatment, ...payload },
        {
          onSuccess: () => {
            addToast({
              title: 'Tratamiento actualizado',
              message: 'El tratamiento ha sido modificado exitosamente.',
              type: 'success',
            })
            setIsFormModalOpen(false)
          },
          onError: () => {
            addToast({
              title: 'Error al actualizar',
              message: 'Ocurrió un error al actualizar el tratamiento.',
              type: 'error',
            })
          },
        }
      )
    } else {
      // Create
      createTreatment.mutate(payload, {
        onSuccess: () => {
          addToast({
            title: 'Tratamiento creado',
            message: 'El nuevo tratamiento se ha agregado al catálogo.',
            type: 'success',
          })
          setIsFormModalOpen(false)
        },
        onError: () => {
          addToast({
            title: 'Error al guardar',
            message: 'Ocurrió un error al registrar el tratamiento.',
            type: 'error',
          })
        },
      })
    }
  }

  const handleDeleteConfirm = () => {
    if (!selectedTreatment) return

    deleteTreatment.mutate(selectedTreatment.id, {
      onSuccess: () => {
        addToast({
          title: 'Tratamiento eliminado',
          message: 'El tratamiento se ha eliminado con éxito.',
          type: 'success',
        })
        setIsDeleteModalOpen(false)
      },
      onError: () => {
        addToast({
          title: 'Error al eliminar',
          message: 'Ocurrió un error al intentar eliminar el tratamiento.',
          type: 'error',
        })
      },
    })
  }

  if (isLoading) {
    return (
      <div data-card>
        <div style={{ padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '260px', gap: '8px' }}>
          <Spinner size="md" />
          <span className="microlabel text-[10px]">Cargando catálogo de tratamientos...</span>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div data-card>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--neg)', margin: 0 }}>
            No se pudo cargar el listado de tratamientos. Por favor, intente de nuevo.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div data-card>
        <div data-hd>
          <h2>Tratamientos</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative', width: '240px', maxWidth: '46vw' }}>
              <Search size={14} strokeWidth={1.75} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dim)' }} />
              <input
                data-inp
                type="text"
                placeholder="Buscar tratamientos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ height: '32px', paddingLeft: '31px' }}
              />
            </div>
            {!readOnly && (
              <button data-btn onClick={openAddModal}>
                <Plus size={14} strokeWidth={1.9} />
                Agregar Tratamiento
              </button>
            )}
          </div>
        </div>

        {filteredTreatments.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '8px', textAlign: 'center' }}>
            <div style={{ width: '44px', height: '44px', border: '1px solid var(--line)', borderRadius: '7px', background: 'var(--head)', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
              <BookOpen size={22} strokeWidth={1.75} />
            </div>
            <p style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>No se encontraron tratamientos</p>
            <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: 0, maxWidth: '340px' }}>
              Intenta modificar tu término de búsqueda o agrega un nuevo tratamiento al catálogo.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table data-tbl>
              <thead>
                <tr>
                  <th>Tratamiento</th>
                  <th>Duración</th>
                  <th>Precio</th>
                  <th>Isapre</th>
                  <th>Fonasa</th>
                  <th>Estado</th>
                  {!readOnly && <th style={{ textAlign: 'right' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filteredTreatments.map((treatment) => (
                  <tr key={treatment.id}>
                    <td style={{ color: 'var(--ink)', fontWeight: 500 }}>{treatment.name}</td>
                    <td data-mono>{treatment.duration_min} min</td>
                    <td data-mono>{fmtPrice(treatment.price)}</td>
                    <td data-mono>{treatment.accepts_isapre ? fmtPrice(treatment.price_isapre) : '—'}</td>
                    <td data-mono>{treatment.accepts_fonasa ? fmtPrice(treatment.price_fonasa) : '—'}</td>
                    <td>
                      <span data-badge>
                        <span data-dot style={{ background: treatment.active ? 'var(--pos)' : undefined }} />
                        {treatment.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    {!readOnly && (
                      <td>
                        <span style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <Link
                            data-btn
                            href={`/knowledge-base/treatments/${treatment.id}`}
                            style={{ width: '28px', height: '28px', padding: 0 }}
                            title="Ver ficha completa"
                            aria-label={`Ver ficha de ${treatment.name}`}
                            data-testid={`view-treatment-${treatment.id}`}
                          >
                            <ArrowUpRight size={14} strokeWidth={1.75} />
                          </Link>
                          <button
                            data-btn
                            onClick={() => openEditModal(treatment)}
                            style={{ width: '28px', height: '28px', padding: 0 }}
                            title="Editar Tratamiento"
                          >
                            <Pencil size={14} strokeWidth={1.75} />
                          </button>
                          <button
                            data-btn
                            onClick={() => openDeleteModal(treatment)}
                            style={{ width: '28px', height: '28px', padding: 0 }}
                            title="Eliminar Tratamiento"
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

      {/* CRUD Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedTreatment ? 'Editar tratamiento' : 'Nuevo tratamiento'}
        size="lg"
      >
        <form onSubmit={handleSave} aria-label="treatment-form" className="flex flex-col gap-4">
          {/* Medical Encyclopedia Autocomplete */}
          <div className="border border-[var(--line)] bg-[var(--surface)] rounded-[7px] p-3.5 flex flex-col gap-2 relative">
            <label className="microlabel flex items-center gap-1.5 text-[var(--blue)]">
              <BookOpen size={13} />
              Referencia de enciclopedia médica
            </label>
            <div className="relative">
              <Search size={14} strokeWidth={1.75} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dim)' }} />
              <input
                data-inp
                type="text"
                placeholder="Escribe para buscar (ej: Endodoncia, Limpieza)..."
                value={encyclopediaQuery}
                onChange={(e) => setEncyclopediaQuery(e.target.value)}
                style={{ paddingLeft: '31px' }}
              />
            </div>

            {/* Suggestions Dropdown */}
            {encyclopediaQuery.length >= 2 && (
              <div className="absolute left-3.5 right-3.5 top-full mt-1 bg-[var(--card)] border border-[var(--line)] rounded-[8px] shadow-[0_12px_30px_rgba(0,0,0,0.12)] z-50 max-h-48 overflow-y-auto">
                {isLoadingEnc ? (
                  <div className="p-3 text-center text-[12px] text-[var(--muted)] flex items-center justify-center gap-2">
                    <Spinner size="sm" />
                    Buscando en catálogo médico...
                  </div>
                ) : encyclopediaResults.length === 0 ? (
                  <div className="p-3 text-center text-[12px] text-[var(--muted)]">
                    No se encontraron coincidencias médicas.
                  </div>
                ) : (
                  encyclopediaResults.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => handleSelectEncyclopedia(entry.name, entry.description)}
                      className="w-full text-left p-3 hover:bg-[var(--surface)] transition-colors flex items-start gap-2 border-b border-[var(--line-soft)] last:border-b-0 cursor-pointer"
                    >
                      <Stethoscope size={14} className="text-[var(--blue)] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[12.5px] font-medium text-[var(--ink)] m-0">{entry.name}</p>
                        <p className="text-[11px] text-[var(--muted)] line-clamp-1 m-0 mt-0.5">
                          {entry.description}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Form Fields */}
          <Input
            label="Nombre del tratamiento"
            placeholder="Ej: Endodoncia dental simple"
            value={name}
            onChange={setName}
            error={errors.name}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="treatment-description" className="microlabel">Descripción</label>
            <textarea
              id="treatment-description"
              placeholder="Escribe los detalles e indicaciones de este tratamiento..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              data-inp
              className="resize-none"
              style={{ height: 'auto', padding: '10px 12px', lineHeight: 1.55 }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Precio ($)"
              placeholder="Ej: 45000"
              type="number"
              value={price}
              onChange={setPrice}
              error={errors.price}
              leftIcon={<DollarSign size={14} />}
              required
            />

            <Input
              label="Duración (mins)"
              placeholder="Ej: 45"
              type="number"
              value={duration}
              onChange={setDuration}
              error={errors.duration}
              leftIcon={<Clock size={14} />}
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[var(--line-soft)]">
            <Button variant="secondary" type="button" onClick={() => setIsFormModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={createTreatment.isPending || updateTreatment.isPending}
              icon={<Save size={14} />}
            >
              Guardar Tratamiento
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Eliminación"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 p-3.5 bg-[var(--surface)] border border-[var(--line)] rounded-[7px]">
            <AlertCircle size={20} className="shrink-0 mt-0.5 text-[var(--neg)]" />
            <div>
              <p className="text-[13.5px] font-medium text-[var(--ink)] m-0">¿Estás seguro de eliminar este tratamiento?</p>
              <p className="text-[12.5px] text-[var(--muted)] mt-1 leading-relaxed m-0">
                Esta acción eliminará el tratamiento <strong className="text-[var(--ink)]">{selectedTreatment?.name}</strong> del catálogo de forma permanente. Las citas agendadas con este tratamiento no se alterarán.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2.5">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              loading={deleteTreatment.isPending}
              icon={<Trash2 size={14} />}
            >
              Confirmar Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
