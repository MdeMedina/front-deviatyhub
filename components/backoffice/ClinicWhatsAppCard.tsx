'use client'

import React, { useState } from 'react'
import { CheckCircle2, Circle, AlertTriangle } from 'lucide-react'
import { useClinicWhatsApp, useClinicWhatsAppAction } from '@/lib/api/hooks/use-platform'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Dot, hace } from './shared'

const CALIDAD: Record<string, { label: string; tone: 'pos' | 'neg' | 'dim' }> = {
  GREEN: { label: 'Alta', tone: 'pos' },
  YELLOW: { label: 'Media', tone: 'neg' },
  RED: { label: 'Baja', tone: 'neg' },
}

function Paso({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-[12.5px]">
      {ok ? <CheckCircle2 size={14} className="text-[var(--pos)] shrink-0 mt-[1px]" /> : <Circle size={14} className="text-[var(--dim)] shrink-0 mt-[1px]" />}
      <span className={ok ? 'text-[var(--ink-soft)]' : 'text-[var(--ink)]'}>{children}</span>
    </li>
  )
}

/**
 * WhatsApp de la clínica, configurado por el equipo de Dentral. Dos caminos:
 * el número de Dentral (uno solo, para una clínica a la vez) o el número
 * propio de la clínica, conectado a la app de Dentral en Meta.
 */
export function ClinicWhatsAppCard({ clinicId, clinicName }: { clinicId: string; clinicName: string }) {
  const { data: w, isLoading, isError } = useClinicWhatsApp(clinicId)
  const accion = useClinicWhatsAppAction(clinicId)
  const [formPropio, setFormPropio] = useState(false)
  const [confirmar, setConfirmar] = useState<'dentral' | 'disconnect' | null>(null)
  const [phone, setPhone] = useState('')
  const [waba, setWaba] = useState('')
  const [token, setToken] = useState('')

  if (isLoading) return <div data-card className="py-10 flex justify-center"><Spinner /></div>
  if (isError || !w) return <div data-card className="px-[18px] py-5 text-[13px] text-[var(--neg)]">No se pudo cargar el WhatsApp de la clínica.</div>

  const ocupado = accion.isPending
  const dentral = w.dentral_number
  const otraTieneDentral = dentral?.holder && dentral.holder.id !== clinicId
  const usaDentralPorServidor = w.mode === null && dentral?.holder?.id === clinicId && dentral.assigned_in === 'server'
  const calidad = w.meta?.quality_rating ? CALIDAD[w.meta.quality_rating] : null

  const abrirPropio = () => {
    setPhone(w.mode === 'own' ? w.phone_number_id || '' : '')
    setWaba(w.waba_id || '')
    setToken('')
    setFormPropio(true)
  }

  return (
    <div data-card>
      <div data-hd>
        <h2>WhatsApp</h2>
        <span data-badge>
          <Dot tone={w.connected ? 'pos' : w.mode || usaDentralPorServidor ? 'neg' : 'dim'} />
          {w.mode === 'dentral' ? 'Número de Dentral'
            : w.mode === 'own' ? 'Número propio'
            : usaDentralPorServidor ? 'Número de Dentral (por el servidor)'
            : 'Sin conectar'}
        </span>
      </div>

      <div className="px-[18px] py-4 flex flex-col gap-4">
        {/* Lo que dice Meta del número conectado */}
        {(w.mode || usaDentralPorServidor) && (
          <div className="flex flex-col gap-2">
            {w.meta?.display_phone_number ? (
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="tabular text-[18px] font-semibold text-[var(--ink)]">{w.meta.display_phone_number}</span>
                {w.meta.verified_name && <span className="text-[13px] text-[var(--muted)]">{w.meta.verified_name}</span>}
              </div>
            ) : (
              <span className="text-[13px] text-[var(--muted)]">
                {usaDentralPorServidor
                  ? 'Recibe el número de Dentral porque el servidor la tiene como clínica por defecto. Asígnalo aquí para que quede registrado.'
                  : 'Aún sin verificar con Meta.'}
              </span>
            )}
            <dl className="grid grid-cols-[130px_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[12.5px]">
              <dt data-lbl className="pt-[2px]">ID del número</dt>
              <dd className="tabular text-[var(--ink-soft)] break-all">{w.phone_number_id || dentral?.phone_number_id || '—'}</dd>
              {w.mode === 'own' && (<>
                <dt data-lbl className="pt-[2px]">Cuenta (WABA)</dt>
                <dd className="tabular text-[var(--ink-soft)] break-all">{w.waba_id || <span className="text-[var(--neg)]">Falta</span>}</dd>
                <dt data-lbl className="pt-[2px]">Token</dt>
                <dd className="text-[var(--ink-soft)]">{w.has_own_token ? 'Propio de la clínica' : 'El de Dentral'}</dd>
              </>)}
              {calidad && (<>
                <dt data-lbl className="pt-[2px]">Calidad en Meta</dt>
                <dd><span data-badge><Dot tone={calidad.tone} />{calidad.label}</span></dd>
              </>)}
              <dt data-lbl className="pt-[2px]">Verificado</dt>
              <dd className="text-[var(--ink-soft)]">
                {w.last_tested_at ? `${hace(w.last_tested_at)} · ${w.last_test_ok ? 'bien' : 'falló'}` : 'nunca'}
              </dd>
            </dl>
            {w.last_error && !w.last_test_ok && (
              <p className="flex items-start gap-1.5 text-[12px] text-[var(--neg)]">
                <AlertTriangle size={13} className="shrink-0 mt-[1px]" /> Meta respondió: {w.last_error}
              </p>
            )}
          </div>
        )}

        {/* Lo que falta para que el número funcione de verdad */}
        {w.mode === 'own' && (
          <ul className="flex flex-col gap-1.5">
            <Paso ok={!!w.last_test_ok}>Meta reconoce el número con el token</Paso>
            <Paso ok={!!w.waba_id}>ID de la cuenta de WhatsApp Business</Paso>
            <Paso ok={!!w.webhooks?.subscribed}>
              Cuenta suscrita a Dentral (sin esto no llegan los mensajes)
              {w.webhooks?.error && <span className="block text-[11.5px] text-[var(--neg)]">{w.webhooks.error}</span>}
            </Paso>
          </ul>
        )}

        {/* Formulario del número propio */}
        {formPropio && (
          <form
            className="flex flex-col gap-2.5 p-3 rounded-[8px] border border-[var(--line)] bg-[var(--head)]"
            onSubmit={(e) => {
              e.preventDefault()
              accion.mutate(
                { accion: 'own', datos: { phone_number_id: phone.trim(), waba_id: waba.trim() || undefined, access_token: token.trim() || undefined } },
                { onSuccess: () => setFormPropio(false) },
              )
            }}
          >
            <label className="flex flex-col gap-1">
              <span data-lbl>ID del número de teléfono</span>
              <input data-inp className="tabular" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="123456789012345" style={{ height: 34 }} required />
            </label>
            <label className="flex flex-col gap-1">
              <span data-lbl>ID de la cuenta de WhatsApp Business (WABA)</span>
              <input data-inp className="tabular" value={waba} onChange={(e) => setWaba(e.target.value)} placeholder="109876543210987" style={{ height: 34 }} />
            </label>
            <label className="flex flex-col gap-1">
              <span data-lbl>Token de acceso (opcional)</span>
              <input data-inp type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder={w.has_own_token ? '•••••••• (se conserva el actual)' : 'Vacío = token de Dentral'} style={{ height: 34 }} />
              <span className="text-[11.5px] text-[var(--muted)]">
                Si la clínica compartió su cuenta de WhatsApp con Dentral en Meta, déjalo vacío. Los IDs están en Meta → WhatsApp → Configuración de la API.
              </span>
            </label>
            <div className="flex gap-2">
              <Button type="submit" size="sm" loading={ocupado}>Guardar y verificar</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setFormPropio(false)}>Cancelar</Button>
            </div>
          </form>
        )}

        {/* Confirmaciones */}
        {confirmar === 'dentral' && (
          <div className="flex flex-col gap-2 p-3 rounded-[8px] border border-[var(--line)] bg-[var(--head)] text-[12.5px]">
            <span className="text-[var(--ink)]">
              {otraTieneDentral
                ? <>El número de Dentral lo tiene <strong>{dentral?.holder?.name}</strong>. Si lo pasas a {clinicName}, esa clínica deja de recibir mensajes por WhatsApp.</>
                : <>{clinicName} pasa a atender el número de Dentral{w.mode === 'own' ? ' y deja su número propio' : ''}.</>}
            </span>
            <div className="flex gap-2">
              <Button size="sm" loading={ocupado} onClick={() => accion.mutate({ accion: 'dentral' }, { onSettled: () => setConfirmar(null) })}>
                Sí, asignar el número de Dentral
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmar(null)}>Cancelar</Button>
            </div>
          </div>
        )}
        {confirmar === 'disconnect' && (
          <div className="flex flex-col gap-2 p-3 rounded-[8px] border border-[var(--line)] bg-[var(--head)] text-[12.5px]">
            <span className="text-[var(--ink)]">{clinicName} deja de recibir y enviar mensajes por WhatsApp hasta que se vuelva a conectar.</span>
            <div className="flex gap-2">
              <Button size="sm" variant="danger" loading={ocupado} onClick={() => accion.mutate({ accion: 'disconnect' }, { onSettled: () => setConfirmar(null) })}>
                Sí, desconectar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmar(null)}>Cancelar</Button>
            </div>
          </div>
        )}

        {accion.isError && <p className="text-[12px] text-[var(--neg)]">{(accion.error as Error)?.message}</p>}

        {/* Acciones */}
        {!formPropio && !confirmar && (
          <div className="flex gap-2 flex-wrap">
            {w.mode !== 'dentral' && dentral && (
              <Button size="sm" variant={w.mode ? 'secondary' : 'primary'} onClick={() => setConfirmar('dentral')}>
                Usar el número de Dentral
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={abrirPropio}>
              {w.mode === 'own' ? 'Editar número propio' : 'Conectar número propio'}
            </Button>
            {w.mode && (
              <Button size="sm" variant="secondary" loading={ocupado} onClick={() => accion.mutate({ accion: 'verify' })}>
                Verificar con Meta
              </Button>
            )}
            {w.mode === 'own' && (
              <Button size="sm" variant="secondary" loading={ocupado} disabled={!w.waba_id} onClick={() => accion.mutate({ accion: 'subscribe' })}>
                Suscribir a Dentral
              </Button>
            )}
            {w.mode && (
              <Button size="sm" variant="danger" onClick={() => setConfirmar('disconnect')}>Desconectar</Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
