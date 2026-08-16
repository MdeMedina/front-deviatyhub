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
import { Badge } from '@/components/ui/Badge'
import {
  Plus,
  Search,
  Clock,
  DollarSign,
  Edit2,
  Trash2,
  BookOpen,
  AlertCircle,
  Stethoscope,
  Save,
  ArrowRight,
} from 'lucide-react'
import { ITreatment } from '@/lib/types'

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
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-100 shadow-sm min-h-[400px]">
        <Spinner size="lg" className="text-indigo-600 mb-4 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Cargando catálogo de tratamientos...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-100 rounded-3xl text-center max-w-4xl mx-auto">
        <p className="text-sm font-semibold text-rose-600">
          No se pudo cargar el listado de tratamientos. Por favor, intente de nuevo.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Buscar tratamientos por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition-all"
          />
        </div>
        {!readOnly && (
          <Button
            onClick={openAddModal}
            icon={<Plus size={18} />}
            className="shrink-0"
          >
            Agregar Tratamiento
          </Button>
        )}
      </div>

      {/* Grid of Treatments */}
      {filteredTreatments.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-slate-200">
          <BookOpen size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">No se encontraron tratamientos</p>
          <p className="text-xs text-slate-400 mt-1">
            Intenta modificando tu término de búsqueda o agrega un nuevo tratamiento al catálogo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTreatments.map((treatment) => (
            <div
              key={treatment.id}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-base font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                    {treatment.name}
                  </h3>
                  {!readOnly && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModal(treatment)}
                        className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-400 transition-all"
                        title="Editar Tratamiento"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(treatment)}
                        className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 transition-all"
                        title="Eliminar Tratamiento"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed font-medium">
                  {treatment.description || 'Sin descripción adicional.'}
                </p>
              </div>

              <div className="border-t border-slate-50 pt-4 mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-slate-500">
                    <Clock size={13} className="text-indigo-400" />
                    <span className="text-xs font-semibold">{treatment.duration_min} mins</span>
                  </div>
                  <Badge variant="success" size="sm">
                    ${(treatment.price ?? 0).toLocaleString('es-CL')}
                  </Badge>
                </div>
                <Link
                  href={`/knowledge-base/treatments/${treatment.id}`}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 transition-colors hover:underline"
                  title="Ver Ficha Completa"
                  data-testid={`view-treatment-${treatment.id}`}
                >
                  Ficha
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CRUD Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedTreatment ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}
      >
        <form onSubmit={handleSave} aria-label="treatment-form" className="space-y-4">
          {/* Medical Encyclopedia Autocomplete */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 relative">
            <label className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <BookOpen size={14} />
              Referencia de Enciclopedia Médica
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search size={14} />
              </div>
              <input
                type="text"
                placeholder="Escribe para buscar (ej: Endodoncia, Limpieza)..."
                value={encyclopediaQuery}
                onChange={(e) => setEncyclopediaQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Suggestions Drops */}
            {encyclopediaQuery.length >= 2 && (
              <div className="absolute left-4 right-4 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto divide-y divide-slate-50">
                {isLoadingEnc ? (
                  <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Spinner size="sm" className="text-indigo-500" />
                    Buscando en catálogo médico...
                  </div>
                ) : encyclopediaResults.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">
                    No se encontraron coincidencias médicas.
                  </div>
                ) : (
                  encyclopediaResults.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => handleSelectEncyclopedia(entry.name, entry.description)}
                      className="w-full text-left p-3 hover:bg-slate-50 transition-colors flex items-start gap-2"
                    >
                      <Stethoscope size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-slate-700">{entry.name}</p>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
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
          <div className="space-y-3 pt-2">
            <Input
              label="Nombre del Tratamiento"
              placeholder="Ej: Endodoncia Dental Simple"
              value={name}
              onChange={setName}
              error={errors.name}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                Descripción
              </label>
              <textarea
                placeholder="Escribe los detalles e indicaciones de este tratamiento..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 hover:border-slate-300 resize-none"
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
                label="Duración (Mins)"
                placeholder="Ej: 45"
                type="number"
                value={duration}
                onChange={setDuration}
                error={errors.duration}
                leftIcon={<Clock size={14} />}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
            <Button
              variant="secondary"
              onClick={() => setIsFormModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={createTreatment.isPending || updateTreatment.isPending}
              icon={<Save size={16} />}
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
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm">
            <AlertCircle size={20} className="shrink-0 mt-0.5 text-rose-500" />
            <div>
              <p className="font-bold">¿Estás absolutamente seguro?</p>
              <p className="text-xs text-rose-600 mt-1 leading-relaxed">
                Esta acción eliminará el tratamiento <strong>{selectedTreatment?.name}</strong> del catálogo de forma permanente. Las citas agendadas con este tratamiento no se alterarán.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              loading={deleteTreatment.isPending}
              icon={<Trash2 size={16} />}
            >
              Confirmar Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
