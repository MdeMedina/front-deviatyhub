'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
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

const fmtPrice = (n: number) => `$${(n ?? 0).toLocaleString('es-CL')}`

export default function TreatmentDetailPage() {
  const { id } = useParams()
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
      <div className="flex flex-col items-center justify-center p-8 bg-[var(--card)] border border-[var(--line)] rounded-[10px] min-h-[380px] max-w-md mx-auto text-center shadow-[0_1px_2px_rgba(20,20,25,0.05)]">
        <div className="w-11 h-11 border border-[var(--line)] rounded-[7px] bg-[var(--head)] flex items-center justify-center text-[var(--neg)] mb-3">
          <AlertCircle size={22} />
        </div>
        <h2 className="text-[18px] font-semibold text-[var(--ink)] mb-1.5">Acceso Denegado</h2>
        <p className="text-[13px] text-[var(--muted)] leading-relaxed mb-5">
          No tienes permisos para ver el catálogo clínico de tratamientos.
        </p>
        <Link
          href="/knowledge-base"
          className="inline-flex items-center justify-center px-4 py-2 bg-[var(--ink)] hover:opacity-85 text-[var(--bg)] font-medium rounded-[7px] text-[13px] transition-opacity"
        >
          Volver
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 min-h-[500px] gap-3">
        <Spinner size="lg" />
        <span className="microlabel text-[10px]">Cargando ficha del tratamiento...</span>
      </div>
    )
  }

  if (isError || !treatment) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 bg-[var(--card)] border border-[var(--line)] rounded-[10px] text-center max-w-2xl mx-auto mt-12 shadow-[0_1px_2px_rgba(20,20,25,0.05)]">
        <div className="w-11 h-11 border border-[var(--line)] rounded-[7px] bg-[var(--head)] flex items-center justify-center text-[var(--neg)]">
          <AlertCircle size={22} />
        </div>
        <div>
          <h3 className="text-[15px] font-semibold text-[var(--ink)]">Error al cargar ficha</h3>
          <p className="text-[13px] text-[var(--muted)] mt-1">
            No se pudo obtener la información de este tratamiento clínico. Es posible que haya sido eliminado.
          </p>
        </div>
        <Link href="/knowledge-base?tab=treatments" data-btn>
          <ArrowLeft size={14} strokeWidth={1.75} />
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

  const getInitials = (name: string) => {
    if (!name) return 'DR'
    const parts = name.replace(/^(Dra?\.?\s+)/i, '').trim().split(/\s+/)
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }

  return (
    <div className="flex flex-col gap-5 max-w-[1340px] mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[var(--line)]">
        <div className="flex items-center gap-3">
          <Link
            href="/knowledge-base?tab=treatments"
            data-btn
            style={{ width: '32px', height: '32px', padding: 0 }}
            title="Volver al catálogo"
            aria-label="Volver al catálogo"
            data-testid="back-to-treatments"
          >
            <ArrowLeft size={16} strokeWidth={1.75} />
          </Link>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[24px] font-semibold tracking-[-0.028em] text-[var(--ink)] leading-tight">
                {treatment.name}
              </h1>
              <Badge variant={treatment.active ? 'success' : 'neutral'} size="sm" dot>
                {treatment.active ? 'Activo en Clínica' : 'Desactivado'}
              </Badge>
            </div>
            <p className="text-[13.5px] text-[var(--muted)]">
              Ficha técnica clínico-arancelaria y ofertas vigentes
            </p>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left column */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Description */}
          <div data-card>
            <div data-hd>
              <h2>Descripción e indicaciones clínicas</h2>
            </div>
            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p className="text-[13.5px] text-[var(--muted)] leading-relaxed m-0">
                {treatment.description || 'No se han ingresado detalles descriptivos adicionales para este tratamiento médico.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--line)] rounded-[8px] p-3">
                  <span data-icon><Clock size={16} strokeWidth={1.75} /></span>
                  <div>
                    <p className="microlabel m-0">Duración estándar</p>
                    <p className="text-[13px] font-medium text-[var(--ink)] m-0 mt-0.5">{treatment.duration_min} minutos por sesión</p>
                  </div>
                </div>

                {treatment.encyclopedia_ref && (
                  <div className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--line)] rounded-[8px] p-3">
                    <span data-icon><Sparkles size={16} strokeWidth={1.75} /></span>
                    <div className="min-w-0">
                      <p className="microlabel m-0">Enciclopedia médica</p>
                      <p className="text-[13px] font-medium text-[var(--ink)] m-0 mt-0.5 truncate" title={treatment.encyclopedia_ref}>
                        {treatment.encyclopedia_ref}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div data-card>
            <div data-hd>
              <h2>Estructura de aranceles clínicos</h2>
            </div>
            <div style={{ padding: '18px' }} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[8px] p-4 text-center flex flex-col gap-1">
                <p className="microlabel m-0">Precio general</p>
                <p data-mono className="text-[18px] font-medium text-[var(--ink)] m-0">{fmtPrice(treatment.price)}</p>
              </div>

              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[8px] p-4 text-center flex flex-col gap-1">
                <div className="flex items-center justify-center gap-1.5">
                  <p className="microlabel m-0">Arancel Isapre</p>
                  <Badge variant={treatment.accepts_isapre ? 'success' : 'neutral'} size="sm" dot>
                    {treatment.accepts_isapre ? 'Sí' : 'No'}
                  </Badge>
                </div>
                <p data-mono className="text-[18px] font-medium text-[var(--ink)] m-0">{fmtPrice(treatment.price_isapre ?? treatment.price)}</p>
              </div>

              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[8px] p-4 text-center flex flex-col gap-1">
                <div className="flex items-center justify-center gap-1.5">
                  <p className="microlabel m-0">Arancel Fonasa</p>
                  <Badge variant={treatment.accepts_fonasa ? 'success' : 'neutral'} size="sm" dot>
                    {treatment.accepts_fonasa ? 'Sí' : 'No'}
                  </Badge>
                </div>
                <p data-mono className="text-[18px] font-medium text-[var(--ink)] m-0">{fmtPrice(treatment.price_fonasa ?? treatment.price)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Doctors */}
        <div data-card>
          <div data-hd>
            <h2>Especialistas habilitados</h2>
          </div>
          <div style={{ padding: '18px' }}>
            {treatment.doctors?.length === 0 ? (
              <p className="text-[12.5px] text-[var(--muted)] m-0">
                No hay doctores vinculados a este tratamiento.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {treatment.doctors?.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2.5 bg-[var(--surface)] border border-[var(--line)] rounded-[8px]"
                  >
                    <span className="flex items-center gap-2.5">
                      <span style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'var(--head)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', fontSize: '11px', fontWeight: 600, color: 'var(--ink)' }}>
                        {getInitials(doc.name)}
                      </span>
                      <span className="text-[13px] font-medium text-[var(--ink)]">{doc.name}</span>
                    </span>
                    <Badge variant="info" size="sm" dot>Habilitado</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Offers */}
      <div data-card>
        <div data-hd>
          <div className="flex items-center gap-2">
            <Tag size={15} strokeWidth={1.75} className="text-[var(--blue)]" />
            <h2>Promociones y ofertas temporales</h2>
          </div>
          {canEdit && (
            <button data-btn="primary" onClick={handleOpenOfferModal} data-testid="add-offer-btn">
              <Plus size={14} strokeWidth={1.9} />
              Nueva oferta
            </button>
          )}
        </div>

        <div style={{ padding: '18px' }}>
          {!treatment.offers || treatment.offers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <div style={{ width: '44px', height: '44px', border: '1px solid var(--line)', borderRadius: '7px', background: 'var(--head)', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
                <Tag size={22} strokeWidth={1.75} />
              </div>
              <p className="text-[14.5px] font-semibold text-[var(--ink)] m-0">Sin promociones activas</p>
              <p className="text-[12.5px] text-[var(--muted)] m-0 max-w-[340px]">
                Configura ofertas para este tratamiento para campañas o temporadas específicas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {treatment.offers.map((offer) => (
                <div
                  key={offer.id}
                  className="relative bg-[var(--card)] border border-[var(--line)] rounded-[10px] p-4 pl-5 flex flex-col justify-between gap-3 overflow-hidden"
                  data-testid={`offer-card-${offer.id}`}
                >
                  <div className="absolute top-0 left-0 w-[3px] h-full bg-[var(--blue)]" />

                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[13.5px] font-semibold text-[var(--ink)] leading-tight m-0">
                        {offer.label}
                      </h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant={offer.active ? 'success' : 'neutral'} size="sm" dot>
                          {offer.active ? 'Activa' : 'Pausada'}
                        </Badge>
                        {canEdit && (
                          <button
                            data-btn
                            onClick={() => handleOpenDeleteModal(offer.id)}
                            style={{ width: '26px', height: '26px', padding: 0 }}
                            title="Eliminar Oferta"
                            aria-label={`Eliminar ${offer.label}`}
                            data-testid={`delete-offer-${offer.id}`}
                          >
                            <Trash2 size={13} strokeWidth={1.75} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      {offer.discount_pct > 0 && (
                        <div className="flex items-center gap-1.5 text-[12.5px] text-[var(--blue)] font-medium">
                          <Percent size={12} />
                          <span>{offer.discount_pct}% de descuento</span>
                        </div>
                      )}
                      {offer.fixed_price > 0 && (
                        <div className="flex items-center gap-1.5 text-[12.5px] text-[var(--pos)] font-medium">
                          <DollarSign size={12} />
                          <span>Arancel especial: <span data-mono>{fmtPrice(offer.fixed_price)}</span></span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-[var(--line-soft)] pt-2.5 text-[11px] text-[var(--muted)] flex items-center gap-1.5">
                    <Calendar size={11} />
                    <span>Vigencia: <span data-mono>{formatDate(offer.valid_from)} – {formatDate(offer.valid_until)}</span></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CREATE OFFER MODAL */}
      <Modal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        title="Crear Nueva Promoción"
        size="lg"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setIsOfferModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => handleSaveOffer({ preventDefault: () => {} } as React.FormEvent)}
              loading={createOffer.isPending}
              icon={<Save size={14} />}
            >
              Guardar Promoción
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveOffer} className="flex flex-col gap-4" aria-label="offer-form">
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
              <label htmlFor="valid-from" className="microlabel flex items-center gap-1">
                Vigente Desde <span className="text-[var(--muted)]">*</span>
              </label>
              <input
                id="valid-from"
                type="date"
                data-inp
                className="tabular"
                value={validFrom}
                onChange={(e) => {
                  setValidFrom(e.target.value)
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.validFrom
                    return next
                  })
                }}
                style={{ borderColor: errors.validFrom ? 'var(--neg)' : undefined }}
                required
              />
              {errors.validFrom && (
                <p className="text-[11px] font-medium text-[var(--neg)] mt-0.5">{errors.validFrom}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="valid-until" className="microlabel flex items-center gap-1">
                Vigente Hasta <span className="text-[var(--muted)]">*</span>
              </label>
              <input
                id="valid-until"
                type="date"
                data-inp
                className="tabular"
                value={validUntil}
                onChange={(e) => {
                  setValidUntil(e.target.value)
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.validUntil
                    return next
                  })
                }}
                style={{ borderColor: errors.validUntil ? 'var(--neg)' : undefined }}
                required
              />
              {errors.validUntil && (
                <p className="text-[11px] font-medium text-[var(--neg)] mt-0.5">{errors.validUntil}</p>
              )}
            </div>
          </div>

          {/* Active status */}
          <div className="flex items-center justify-between border border-[var(--line)] bg-[var(--surface)] rounded-[7px] p-3.5">
            <div>
              <p className="text-[13px] font-medium text-[var(--ink)] m-0">Oferta activa</p>
              <p className="text-[12px] text-[var(--muted)] m-0 mt-0.5">
                Habilita la aplicación de esta promoción en cotizaciones del bot
              </p>
            </div>
            <button
              type="button"
              aria-label="Toggle Estado Oferta"
              onClick={() => setOfferActive(!offerActive)}
              style={{
                width: '38px',
                height: '22px',
                borderRadius: '999px',
                border: '1px solid var(--line)',
                background: offerActive ? 'var(--blue)' : 'var(--surface-2)',
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
                  left: offerActive ? '18px' : '2px',
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

      {/* CONFIRM DELETE MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Eliminación"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteOfferConfirm}
              loading={deleteOffer.isPending}
              icon={<Trash2 size={14} />}
            >
              Eliminar Promoción
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3 p-3.5 bg-[var(--surface)] border border-[var(--line)] rounded-[7px]">
          <AlertCircle size={20} className="shrink-0 mt-0.5 text-[var(--neg)]" />
          <div>
            <p className="text-[13.5px] font-medium text-[var(--ink)] m-0">¿Deseas desvincular esta promoción?</p>
            <p className="text-[12.5px] text-[var(--muted)] mt-1 leading-relaxed m-0">
              Esta acción eliminará el descuento y arancel especial asociado a este tratamiento de forma permanente.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
