'use client'

import React, { useState } from 'react'
import { useInviteTeamMember, usePlatformTeam, useResendTeamInvite, useRevokeTeamMember } from '@/lib/api/hooks/use-platform'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { CopyField, Dot, PageHeader, PlatformOnly, hace } from '@/components/backoffice/shared'

export default function TeamPage() {
  return (
    <PlatformOnly>
      <Equipo />
    </PlatformOnly>
  )
}

function Equipo() {
  const { data: equipo = [], isLoading, isError } = usePlatformTeam()
  const invitar = useInviteTeamMember()
  const quitar = useRevokeTeamMember()
  const reenviar = useResendTeamInvite()
  const [enlace, setEnlace] = useState<{ id: string; link: string } | null>(null)
  const [correo, setCorreo] = useState('')
  const [resultado, setResultado] = useState<{ email: string; promoted: boolean; link: string | null } | null>(null)
  const [confirmando, setConfirmando] = useState<string | null>(null)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!correo.includes('@')) return
    const r = await invitar.mutateAsync(correo.trim())
    setResultado({ email: r.email, promoted: r.promoted, link: r.invite_link })
    setCorreo('')
  }

  return (
    <div className="flex flex-col gap-5 max-w-[980px]">
      <PageHeader
        title="Equipo Dentral"
        subtitle="Superusuarios de la plataforma: entran al backoffice, crean clínicas, deciden sus accesos y pueden trabajar dentro de cualquiera."
        back={{ href: '/backoffice', label: 'Backoffice' }}
      />

      <form onSubmit={enviar} data-card>
        <div data-hd><h2>Invitar al equipo</h2></div>
        <div className="px-[18px] py-4 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              data-inp
              type="email"
              placeholder="nombre@deviaty.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="flex-1 min-w-[220px]"
              style={{ height: '36px' }}
              aria-label="Correo del nuevo superusuario"
            />
            <Button type="submit" loading={invitar.isPending} disabled={!correo.includes('@')}>
              Dar acceso de superusuario
            </Button>
          </div>
          <span className="text-[12px] text-[var(--muted)]">
            {invitar.isError
              ? <span className="text-[var(--neg)]">{(invitar.error as Error)?.message}</span>
              : 'Si el correo ya tiene cuenta en una clínica, se le suma el acceso. Si no, recibe una invitación para crear su contraseña.'}
          </span>
          {resultado && (
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[12.5px] text-[var(--ink)]">
                {resultado.promoted
                  ? `${resultado.email} ya tenía cuenta: ahora también es superusuario. Lo verá la próxima vez que inicie sesión.`
                  : `Invitación enviada a ${resultado.email}. Enlace por si el correo no llega:`}
              </span>
              {resultado.link && <CopyField value={resultado.link} />}
            </div>
          )}
        </div>
      </form>

      <div data-card>
        <div data-hd>
          <h2>Superusuarios</h2>
          <span data-lbl>{equipo.length}</span>
        </div>
        {isLoading ? (
          <div className="py-12 flex justify-center"><Spinner /></div>
        ) : isError ? (
          <p className="px-[18px] py-5 text-[13px] text-[var(--neg)]">No se pudo cargar el equipo.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table data-tbl>
              <thead>
                <tr>
                  <th>Correo</th>
                  <th>Estado</th>
                  <th>Acceso</th>
                  <th>Desde</th>
                  <th style={{ textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {equipo.map((m) => (
                  <React.Fragment key={m.id}>
                  <tr>
                    <td>
                      <span className="flex flex-col min-w-0">
                        <span className="text-[var(--ink)] font-medium truncate">
                          {m.email}{m.is_you && <span className="text-[var(--muted)] font-normal"> · tú</span>}
                        </span>
                        {m.clinic && <span className="text-[11.5px] text-[var(--dim)]">También trabaja en {m.clinic}</span>}
                      </span>
                    </td>
                    <td>
                      {m.invite_pending ? (
                        <span data-badge><Dot tone="neg" />Invitación pendiente</span>
                      ) : (
                        <span data-badge><Dot tone={m.active ? 'pos' : 'dim'} />{m.active ? 'Activo' : 'Desactivado'}</span>
                      )}
                    </td>
                    <td>
                      <span data-badge>{m.from_server ? 'Fijado en el servidor' : 'Dado en el backoffice'}</span>
                    </td>
                    <td className="text-[var(--muted)] whitespace-nowrap">{hace(m.created_at)}</td>
                    <td style={{ textAlign: 'right' }}>
                      {m.is_you || m.from_server ? (
                        <span className="text-[11.5px] text-[var(--dim)]" title={m.from_server ? 'Se quita en PLATFORM_ADMIN_EMAILS del servidor' : undefined}>
                          {m.is_you ? '' : 'Solo en el servidor'}
                        </span>
                      ) : confirmando === m.id ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Button size="sm" variant="danger" loading={quitar.isPending} onClick={() => quitar.mutate(m.id, { onSettled: () => setConfirmando(null) })}>
                            Sí, quitar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmando(null)}>No</Button>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          {m.invite_pending && (
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={reenviar.isPending && reenviar.variables === m.id}
                              onClick={async () => {
                                const r = await reenviar.mutateAsync(m.id)
                                setEnlace({ id: m.id, link: r.invite_link })
                              }}
                            >
                              Reenviar invitación
                            </Button>
                          )}
                          <Button size="sm" variant="secondary" onClick={() => setConfirmando(m.id)}>Quitar acceso</Button>
                        </span>
                      )}
                    </td>
                  </tr>
                  {enlace?.id === m.id && (
                    <tr>
                      <td colSpan={5}>
                        <div className="flex flex-col gap-1.5 py-1">
                          <span className="text-[12px] text-[var(--muted)]">
                            Invitación reenviada (la anterior deja de servir). Si tampoco llega, manda este enlace por WhatsApp:
                          </span>
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
        )}
        {quitar.isError && (
          <p className="px-[18px] py-3 text-[12.5px] text-[var(--neg)] border-t border-[var(--line)]">{(quitar.error as Error)?.message}</p>
        )}
      </div>
    </div>
  )
}
