'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, Circle, LogIn } from 'lucide-react'
import {
  useActAsClinic,
  usePlatformClinic,
  useResendInvite,
  useUpdateClinic,
  type PlatformClinicDetail,
} from '@/lib/api/hooks/use-platform'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { CopyField, Dot, MODO_AGENTE, PageHeader, PlatformOnly, hace } from '@/components/backoffice/shared'

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const INTEGRACION: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
  GOOGLE_CALENDAR: 'Google Calendar',
  DENTALINK: 'Dentalink',
  DENTIDESK: 'Dentidesk',
  GMAIL: 'Gmail',
}

export default function ClinicDetailPage() {
  return (
    <PlatformOnly>
      <Ficha />
    </PlatformOnly>
  )
}

/** Lo que tiene que estar para que el agente pueda atender sin que nadie lo vigile. */
function puestaEnMarcha(c: PlatformClinicDetail) {
  const whatsapp = c.integrations.find((i) => i.type === 'WHATSAPP')
  return [
    { ok: c.users.some((u) => u.is_owner && !u.invite_pending), label: 'La persona dueña aceptó la invitación' },
    { ok: c.counts.doctors > 0, label: `Profesionales cargados (${c.counts.doctors})` },
    { ok: c.counts.treatments > 0, label: `Tratamientos con precio (${c.counts.treatments})` },
    { ok: c.schedules.some((s) => s.isOpen), label: 'Horario de atención' },
    { ok: !!whatsapp?.connected, label: whatsapp?.configured ? 'WhatsApp conectado (credenciales sin verificar)' : 'WhatsApp conectado' },
    { ok: c.agent_mode !== 'PAUSED', label: 'Agente encendido' },
  ]
}

function Ficha() {
  const { id } = useParams<{ id: string }>()
  const { data: c, isLoading, isError } = usePlatformClinic(id)
  const actualizar = useUpdateClinic(id)
  const reenviar = useResendInvite(id)
  const { enter } = useActAsClinic()
  const [enlace, setEnlace] = useState<{ userId: string; link: string } | null>(null)

  if (isLoading) return <div className="py-16 flex justify-center"><Spinner /></div>
  if (isError || !c) {
    return <p className="text-[13px] text-[var(--neg)]">No se pudo cargar la clínica.</p>
  }

  const pasos = puestaEnMarcha(c)
  const hechos = pasos.filter((p) => p.ok).length
  const modo = c.agent_mode ? MODO_AGENTE[c.agent_mode] : null

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={c.name}
        back={{ href: '/backoffice/clinics', label: 'Clínicas' }}
        subtitle={
          <span className="flex items-center gap-2 flex-wrap">
            <span data-badge><Dot tone={c.active ? 'pos' : 'dim'} />{c.active ? 'Activa' : 'Inactiva'}</span>
            {modo && <span data-badge><Dot tone={modo.tone} />Agente {modo.label.toLowerCase()}</span>}
            <span className="tabular text-[12px] text-[var(--dim)]">{c.slug} · {c.plan} · creada {hace(c.created_at)}</span>
          </span>
        }
        actions={
          <>
            <Button
              variant={c.active ? 'danger' : 'secondary'}
              loading={actualizar.isPending}
              onClick={() => actualizar.mutate({ active: !c.active })}
            >
              {c.active ? 'Desactivar' : 'Reactivar'}
            </Button>
            <Button icon={<LogIn size={14} />} onClick={() => enter({ id: c.id, name: c.name })}>
              Entrar al panel
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="flex flex-col gap-5 min-w-0">
          <div data-card>
            <div data-hd>
              <h2>Usuarios</h2>
              <span data-lbl>{c.users.length}</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table data-tbl>
                <thead>
                  <tr>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {c.users.map((u) => (
                    <React.Fragment key={u.id}>
                      <tr>
                        <td>
                          <span className="flex flex-col min-w-0">
                            <span className="text-[var(--ink)] font-medium truncate">{u.email}</span>
                            {u.doctor && <span className="text-[11.5px] text-[var(--dim)]">{u.doctor}</span>}
                          </span>
                        </td>
                        <td>
                          <span data-badge>{u.role || '—'}{u.is_owner ? ' · dueña' : ''}{u.platform_admin ? ' · Dentral' : ''}</span>
                        </td>
                        <td>
                          {u.invite_pending ? (
                            <span data-badge><Dot tone="neg" />Invitación pendiente</span>
                          ) : (
                            <span data-badge><Dot tone={u.active ? 'pos' : 'dim'} />{u.active ? 'Activo' : 'Inactivo'}</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {u.invite_pending && (
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={reenviar.isPending && reenviar.variables === u.id}
                              onClick={async () => {
                                const r = await reenviar.mutateAsync(u.id)
                                setEnlace({ userId: u.id, link: r.invite_link })
                              }}
                            >
                              Reenviar invitación
                            </Button>
                          )}
                        </td>
                      </tr>
                      {enlace?.userId === u.id && (
                        <tr>
                          <td colSpan={4}>
                            <div className="flex flex-col gap-1.5 py-1">
                              <span className="text-[12px] text-[var(--muted)]">Invitación reenviada. Enlace para mandarlo a mano:</span>
                              <CopyField value={enlace.link} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div data-card>
            <div data-hd><h2>Integraciones</h2></div>
            {c.integrations.length === 0 ? (
              <p className="px-[18px] py-5 text-[13px] text-[var(--muted)]">Ninguna configurada todavía.</p>
            ) : (
              <table data-tbl>
                <thead>
                  <tr>
                    <th>Servicio</th>
                    <th>Estado</th>
                    <th>Última prueba</th>
                    <th>Identificador</th>
                  </tr>
                </thead>
                <tbody>
                  {c.integrations.map((i) => (
                    <tr key={i.type}>
                      <td className="font-medium text-[var(--ink)]">{INTEGRACION[i.type] || i.type}</td>
                      <td>
                        <span data-badge>
                          <Dot tone={i.connected ? 'pos' : i.configured ? 'neg' : 'dim'} />
                          {i.connected ? 'Conectado' : i.configured ? 'Sin verificar' : 'Sin credenciales'}
                        </span>
                      </td>
                      <td className="text-[var(--muted)]">
                        {i.last_tested_at ? `${hace(i.last_tested_at)} · ${i.last_test_ok ? 'bien' : 'falló'}` : '—'}
                      </td>
                      <td className="tabular text-[12px] text-[var(--muted)]">{i.external_id || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5 min-w-0">
          <div data-card>
            <div data-hd>
              <h2>Puesta en marcha</h2>
              <span data-lbl className="tabular">{hechos}/{pasos.length}</span>
            </div>
            <ul className="px-[18px] py-3.5 flex flex-col gap-2.5">
              {pasos.map((p) => (
                <li key={p.label} className="flex items-start gap-2.5 text-[13px]">
                  {p.ok
                    ? <CheckCircle2 size={15} className="text-[var(--pos)] shrink-0 mt-[1px]" />
                    : <Circle size={15} className="text-[var(--dim)] shrink-0 mt-[1px]" />}
                  <span className={p.ok ? 'text-[var(--ink-soft)]' : 'text-[var(--ink)]'}>{p.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div data-card>
            <div data-hd><h2>Datos</h2></div>
            <dl className="px-[18px] py-3.5 grid grid-cols-[110px_minmax(0,1fr)] gap-x-3 gap-y-2.5 text-[13px]">
              <dt data-lbl className="pt-[2px]">Facturación</dt>
              <dd className="text-[var(--ink)] break-words">{c.billing_email}</dd>
              <dt data-lbl className="pt-[2px]">Teléfono</dt>
              <dd className="text-[var(--ink)]">{c.config?.phone || '—'}</dd>
              <dt data-lbl className="pt-[2px]">Dirección</dt>
              <dd className="text-[var(--ink)] break-words">{c.config?.address || '—'}</dd>
              <dt data-lbl className="pt-[2px]">Zona horaria</dt>
              <dd className="tabular text-[var(--ink)]">{c.config?.timezone || '—'}</dd>
              <dt data-lbl className="pt-[2px]">Pacientes</dt>
              <dd className="tabular text-[var(--ink)]">{c.counts.contacts}</dd>
              <dt data-lbl className="pt-[2px]">Horario</dt>
              <dd className="tabular text-[12px] text-[var(--ink-soft)] flex flex-col gap-0.5">
                {c.schedules.length === 0 ? '—' : c.schedules.filter((s) => s.isOpen).map((s) => (
                  <span key={s.dayOfWeek}>{DIAS[s.dayOfWeek]} {s.openTime}–{s.closeTime}</span>
                ))}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
