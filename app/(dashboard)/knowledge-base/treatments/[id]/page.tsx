'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  AlertCircle,
  Clock,
  DollarSign,
  Tag,
  Calendar,
  Users,
  Plus,
  Trash2,
  Percent,
  CheckCircle,
  Save,
  BookOpen,
  Sparkles
} from 'lucide-react'
import {
  useTreatmentDetail,
  useCreateOffer,
  useDeleteOffer
} from '@/lib/api/hooks/use-clinic'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useUIStore } from '@/lib/stores/ui.store'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'

export default function TreatmentDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const addToast = useUIStore((state) => state.addToast)
  const { hasPermission } = useAuthStore()

  const canView = hasPermission('knowledge_base.view')
  const canEdit = hasPermission('knowledge_base.edit')

  const treatmentId = id as string

  // Queries & Mutations
  const { data: treatment, isLoading, isError } = useTreatmentDetail(treatmentId)
  const createOffer = useCreateOffer(treatmentId)
  const deleteOffer = useDeleteOffer(treatmentId)

  // Local State
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false)
  const [offerLabel, setOfferLabel] = useState('')
  const [discountPct, setDiscountPct] = useState('')
  const [fixedPrice, setFixedPrice] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [offerActive, setOfferActive] = useState(true)

  // Form Validation State
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null)

  if (!canView) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50 min-h-[calc(100vh-10rem)] animate-in fade-in">
        <div className="bg-white border border-slate-100 rounded-3xl p-8 max-w-md w-full text-center shadow-xl shadow-slate-100/50">
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Acceso Denegado</h2>
          <p className="text-slate-500 text-sm mb-6">
            No tienes permisos para ver el catálogo clínico de tratamientos.
          </p>
          <Link
            href="/knowledge-base"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-colors"
          >
            Volver
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 min-h-[500px]">
        <Spinner size="lg" className="text-indigo-600 mb-4" />
        <p className="text-sm font-semibold text-slate-500">Cargando ficha del tratamiento...</p>
      </div>
    )
  }

  if (isError || !treatment) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-100 rounded-3xl text-center max-w-2xl mx-auto flex flex-col items-center gap-4 mt-12">
        <AlertCircle className="text-rose-500 w-10 h-10" />
        <div>
          <h3 className="text-base font-bold text-rose-800">Error al cargar ficha</h3>
          <p className="text-sm text-rose-600 mt-1">
            No se pudo obtener la información de este tratamiento clínico. Es posible que haya sido eliminado.
          </p>
        </div>
        <Link
          href="/knowledge-base?tab=treatments"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-bold text-rose-700 transition-colors shadow-sm"
        >
          <ArrowLeft size={14} />
          Volver a Tratamientos
        </Link>
      </div>
    )
  }

  // Offer Modal Controls
  const handleOpenOfferModal = () => {
    setOfferLabel('')
    setDiscountPct('')
    setFixedPrice('')
    setValidFrom('')
    setValidUntil('')
    setOfferActive(true)
    setErrors({})
    setIsOfferModalOpen(true)
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!offerLabel.trim()) {
      newErrors.label = 'La etiqueta de la oferta es requerida.'
    }

    const pct = Number(discountPct)
    if (discountPct !== '' && (isNaN(pct) || pct < 0 || pct > 100)) {
      newErrors.discountPct = 'El porcentaje debe ser un número entre 0 y 100.'
    }

    const priceNum = Number(fixedPrice)
    if (fixedPrice !== '' && (isNaN(priceNum) || priceNum < 0)) {
      newErrors.fixedPrice = 'El precio fijo debe ser mayor o igual a 0.'
    }

    if (!discountPct && !fixedPrice) {
      newErrors.discountPct = 'Debe indicar al menos un porcentaje de descuento o un precio fijo.'
    }

    if (!validFrom) {
      newErrors.validFrom = 'La fecha de inicio de vigencia es requerida.'
    }
    if (!validUntil) {
      newErrors.validUntil = 'La fecha de término de vigencia es requerida.'
    }
    if (validFrom && validUntil && validFrom > validUntil) {
      newErrors.validUntil = 'La fecha de término debe ser posterior a la fecha de inicio.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveOffer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      label: offerLabel,
      discount_pct: discountPct ? Number(discountPct) : 0,
      fixed_price: fixedPrice ? Number(fixedPrice) : 0,
      valid_from: new Date(validFrom).toISOString(),
      valid_until: new Date(validUntil).toISOString(),
      active: offerActive
    }

    createOffer.mutate(payload, {
      onSuccess: () => {
        addToast({
          title: 'Promoción creada',
          message: `La oferta "${offerLabel}" ha sido asociada con éxito.`,
          type: 'success'
        })
        setIsOfferModalOpen(false)
      },
      onError: () => {
        addToast({
          title: 'Error al crear',
          message: 'No se pudo registrar la oferta promocional.',
          type: 'error'
        })
      }
    })
  }

  const handleOpenDeleteModal = (offerId: string) => {
    setSelectedOfferId(offerId)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteOfferConfirm = () => {
    if (!selectedOfferId) return

    deleteOffer.mutate(selectedOfferId, {
      onSuccess: () => {
        addToast({
          title: 'Promoción desvinculada',
          message: 'La oferta ha sido eliminada del tratamiento clínico.',
          type: 'success'
        })
        setIsDeleteModalOpen(false)
      },
      onError: () => {
        addToast({
          title: 'Error al eliminar',
          message: 'Ocurrió un error al intentar eliminar la oferta.',
          type: 'error'
        })
      }
    })
  }

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return isoString
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-300">
      {/* Header element */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/knowledge-base?tab=treatments"
            className="p-3 text-slate-400 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all group"
            title="Volver al catálogo"
            data-testid="back-to-treatments"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                {treatment.name}
              </h1>
              <Badge
                variant={treatment.active ? 'success' : 'neutral'}
                label={treatment.active ? 'Activo en Clínica' : 'Desactivado'}
                size="sm"
              />
            </div>
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-0.5">
              Ficha Técnica Clínico-Arancelaria & Ofertas Vigentes
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Main information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Technical Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-50 pb-2">
                <BookOpen size={16} className="text-indigo-500" />
                Descripción e Indicaciones Clínicas
              </h2>
              <p className="text-sm text-slate-500 font-medium mt-3 leading-relaxed">
                {treatment.description || 'No se han ingresado detalles descriptivos adicionales para este tratamiento médico.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/60">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Duración Estándar</p>
                  <p className="text-sm font-bold text-slate-700">{treatment.duration_min} minutos por sesión</p>
                </div>
              </div>

              {treatment.encyclopedia_ref && (
                <div className="flex items-center gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/60">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Enciclopedia Médica</p>
                    <p className="text-xs font-semibold text-purple-700 truncate max-w-[200px]" title={treatment.encyclopedia_ref}>
                      {treatment.encyclopedia_ref}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-50 pb-2">
              <DollarSign size={16} className="text-indigo-500" />
              Estructura de Aranceles Clínicos
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Precio General</p>
                <p className="text-lg font-black text-slate-800">${(treatment.price ?? 0).toLocaleString('es-CL')}</p>
              </div>

              <div className="bg-sky-50/40 border border-sky-100 p-4 rounded-2xl text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <p className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">Arancel Isapre</p>
                  <Badge variant={treatment.accepts_isapre ? 'success' : 'neutral'} label={treatment.accepts_isapre ? 'Sí' : 'No'} size="sm" />
                </div>
                <p className="text-lg font-black text-sky-900">${(treatment.price_isapre ?? treatment.price ?? 0).toLocaleString('es-CL')}</p>
              </div>

              <div className="bg-emerald-50/40 border border-emerald-100 p-4 rounded-2xl text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Arancel Fonasa</p>
                  <Badge variant={treatment.accepts_fonasa ? 'success' : 'neutral'} label={treatment.accepts_fonasa ? 'Sí' : 'No'} size="sm" />
                </div>
                <p className="text-lg font-black text-emerald-900">${(treatment.price_fonasa ?? treatment.price ?? 0).toLocaleString('es-CL')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Doctors */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-50 pb-2">
              <Users size={16} className="text-indigo-500" />
              Especialistas Habilitados
            </h2>

            {treatment.doctors?.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium italic py-2">
                No hay doctores vinculados a este tratamiento.
              </p>
            ) : (
              <div className="space-y-2">
                {treatment.doctors?.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-slate-50/80 border border-slate-100 rounded-xl hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xs uppercase">
                        {doc.name.substring(0, 2)}
                      </div>
                      <span className="text-xs font-bold text-slate-700">{doc.name}</span>
                    </div>
                    <Badge variant="purple" size="sm" label="Habilitado" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Offers and Promotions Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-50 pb-4">
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-indigo-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Promociones & Ofertas Temporales</h2>
              <p className="text-[10px] text-slate-400 font-medium">Asocia campañas de descuento o precios especiales válidos en rangos de fechas definidos.</p>
            </div>
          </div>
          {canEdit && (
            <Button
              onClick={handleOpenOfferModal}
              icon={<Plus size={16} />}
              size="sm"
              data-testid="add-offer-btn"
            >
              Nueva Oferta
            </Button>
          )}
        </div>

        {/* List of Offers */}
        {!treatment.offers || treatment.offers.length === 0 ? (
          <div className="py-8 text-center bg-slate-50/40 border border-dashed border-slate-200 rounded-2xl max-w-xl mx-auto flex flex-col items-center gap-2">
            <Tag size={32} className="text-slate-300" />
            <p className="text-xs font-bold text-slate-500">Sin promociones activas</p>
            <p className="text-[10px] text-slate-400">
              Configura ofertas para este tratamiento para campañas o temporadas específicas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {treatment.offers.map((offer) => (
              <div
                key={offer.id}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 relative group overflow-hidden"
                data-testid={`offer-card-${offer.id}`}
              >
                {/* Decorative Side Tag */}
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />

                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-extrabold text-slate-800 leading-tight">
                      {offer.label}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge
                        variant={offer.active ? 'success' : 'neutral'}
                        label={offer.active ? 'Activa' : 'Pausada'}
                        size="sm"
                      />
                      {canEdit && (
                        <button
                          onClick={() => handleOpenDeleteModal(offer.id)}
                          className="p-1 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Eliminar Oferta"
                          data-testid={`delete-offer-${offer.id}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 pt-2">
                    {offer.discount_pct > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold">
                        <Percent size={12} />
                        <span>{offer.discount_pct}% de descuento</span>
                      </div>
                    )}
                    {offer.fixed_price > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                        <DollarSign size={12} />
                        <span>Arancel especial: ${offer.fixed_price.toLocaleString('es-CL')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-50 pt-3 text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <Calendar size={11} className="text-slate-300" />
                  <span>Vigencia: {formatDate(offer.valid_from)} - {formatDate(offer.valid_until)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE OFFER MODAL */}
      <Modal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        title="Crear Nueva Promoción"
      >
        <form onSubmit={handleSaveOffer} className="space-y-4" aria-label="offer-form">
          <Input
            label="Etiqueta / Nombre de la Campaña"
            placeholder="ej. Descuento Cyber dental, Promo de Invierno"
            value={offerLabel}
            onChange={(val) => {
              setOfferLabel(val)
              setErrors((prev) => {
                const next = { ...prev }
                delete next.label
                return next
              })
            }}
            error={errors.label}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Porcentaje de Descuento (%)"
              placeholder="ej. 15"
              type="number"
              value={discountPct}
              onChange={(val) => {
                setDiscountPct(val)
                setErrors((prev) => {
                  const next = { ...prev }
                  delete next.discountPct
                  return next
                })
              }}
              error={errors.discountPct}
              leftIcon={<Percent size={14} />}
            />

            <Input
              label="Arancel Fijo Especial ($)"
              placeholder="ej. 35000"
              type="number"
              value={fixedPrice}
              onChange={(val) => {
                setFixedPrice(val)
                setErrors((prev) => {
                  const next = { ...prev }
                  delete next.fixedPrice
                  return next
                })
              }}
              error={errors.fixedPrice}
              leftIcon={<DollarSign size={14} />}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="valid-from" className="text-sm font-semibold text-slate-700 ml-1">
                Vigente Desde <span className="text-rose-500">*</span>
              </label>
              <input
                id="valid-from"
                type="date"
                value={validFrom}
                onChange={(e) => {
                  setValidFrom(e.target.value)
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.validFrom
                    return next
                  })
                }}
                className={`w-full px-4 py-2.5 bg-white border rounded-xl text-slate-700 text-xs transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 ${
                  errors.validFrom ? 'border-rose-300' : 'border-slate-200'
                }`}
                required
              />
              {errors.validFrom && (
                <p className="text-[10px] font-medium text-rose-500 ml-1 mt-1">{errors.validFrom}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="valid-until" className="text-sm font-semibold text-slate-700 ml-1">
                Vigente Hasta <span className="text-rose-500">*</span>
              </label>
              <input
                id="valid-until"
                type="date"
                value={validUntil}
                onChange={(e) => {
                  setValidUntil(e.target.value)
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.validUntil
                    return next
                  })
                }}
                className={`w-full px-4 py-2.5 bg-white border rounded-xl text-slate-700 text-xs transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 ${
                  errors.validUntil ? 'border-rose-300' : 'border-slate-200'
                }`}
                required
              />
              {errors.validUntil && (
                <p className="text-[10px] font-medium text-rose-500 ml-1 mt-1">{errors.validUntil}</p>
              )}
            </div>
          </div>

          {/* Active status */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-2">
            <div className="flex gap-2.5 items-center">
              <CheckCircle size={16} className="text-indigo-500" />
              <div>
                <p className="text-sm font-bold text-slate-700">Oferta Activa</p>
                <p className="text-[10px] text-slate-400 font-medium">
                  Habilita la aplicación de esta promoción en cotizaciones del bot
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Toggle Estado Oferta"
              onClick={() => setOfferActive(!offerActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:ring-2 focus:ring-indigo-100 focus:ring-offset-1 ${
                offerActive ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  offerActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsOfferModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={createOffer.isPending}
              icon={<Save size={16} />}
            >
              Guardar Promoción
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Eliminación"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm">
            <AlertCircle size={20} className="shrink-0 mt-0.5 text-rose-500" />
            <div>
              <p className="font-bold">¿Deseas desvincular esta promoción?</p>
              <p className="text-xs text-rose-600 mt-1 leading-relaxed">
                Esta acción eliminará el descuento y arancel especial asociado a este tratamiento de forma permanente.
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
              onClick={handleDeleteOfferConfirm}
              loading={deleteOffer.isPending}
              icon={<Trash2 size={16} />}
            >
              Eliminar Promoción
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
