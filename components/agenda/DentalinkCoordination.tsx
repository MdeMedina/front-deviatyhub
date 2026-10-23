'use client'

import React from 'react'
import Link from 'next/link'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { es } from 'date-fns/locale'
import { MessageSquare, RefreshCw } from 'lucide-react'
import { useCoordination, useCoordinationActions, type CoordinationItem } from '@/lib/api/hooks/use-appointments'
import { Button } from '@/components/ui/Button'

const ACCION: Record<CoordinationItem['action'], { texto: string; tono: string }> = {
  crear: { texto: 'Agendar en Dentalink', tono: 'var(--blue)' },
  mover: { texto: 'Mover en Dentalink', tono: 'var(--ink)' },
  anular: { texto: 'Anular en Dentalink', tono: 'var(--neg)' },
}

const ORIGEN: Record<CoordinationItem['source'], string> = {
  AGENT: 'por el agente',
  HUMAN: 'desde el panel',
  EXTERNAL: 'por el agente',
}

/**
 * En las clínicas con Dentalink, la agenda oficial es la de Dentalink. Todo lo
 * que se agenda, mueve o anula en Dentral (sobre todo el agente por chat) hay
 * que repetirlo allí. Este listado es lo que falta: se marca a mano y la
 * sincronización lo verifica.
 */
export function DentalinkCoordination() {
  const { data } = useCoordination()
  const { marcar, sincronizar } = useCoordinationActions()

  if (!data?.enabled) return null
  const items = data.items
  const s = data.last_sync

  return (
    <div data-card style={items.length ? { borderColor: 'var(--blue)' } : undefined}>
      <div data-hd>
        <h2>
          Por pasar a Dentalink
          {items.length > 0 && (
            <span className="ml-2 inline-grid place-items-center min-w-[24px] h-[24px] px-1.5 rounded-full bg-[var(--blue-solid)] text-[var(--on-blue)] text-[13px] tabular">
              {items.length}
            </span>
          )}
        </h2>
        <span className="flex items-center gap-3">
          <span className="text-[13.5px] text-[var(--muted)]">
            {s
              ? `${s.ok ? 'Sincronizado' : 'Falló la sincronización'} hace ${formatDistanceToNowStrict(new Date(s.at), { locale: es })}`
              : 'Aún no se sincroniza'}
          </span>
          <Button size="sm" variant="secondary" loading={sincronizar.isPending} onClick={() => sincronizar.mutate()} icon={<RefreshCw />}>
            Sincronizar ahora
          </Button>
        </span>
      </div>

      {sincronizar.isError && (
        <p className="px-[22px] pt-3 text-[14px] text-[var(--neg)]">{(sincronizar.error as Error)?.message}</p>
      )}

      {items.length === 0 ? (
        <p className="px-[22px] py-4 text-[14.5px] text-[var(--muted)]">
          Todo al día: lo agendado por el agente ya está en Dentalink.
        </p>
      ) : (
        <>
          <p className="px-[22px] pt-3 text-[14px] text-[var(--muted)]">
            Manda la agenda de Dentalink. Repite allí cada cambio y márcalo como hecho; la próxima sincronización lo comprueba.
          </p>
          <div className="overflow-x-auto">
            <table data-tbl>
              <thead>
                <tr>
                  <th>Qué hacer</th>
                  <th>Cuándo</th>
                  <th>Paciente</th>
                  <th>Profesional y tratamiento</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => {
                  const accion = ACCION[a.action] ?? ACCION.crear
                  return (
                    <tr key={a.id}>
                      <td>
                        <span className="font-semibold" style={{ color: accion.tono }}>{accion.texto}</span>
                        <div className="text-[13px] text-[var(--muted)]">
                          {ORIGEN[a.source]}{a.updated_at ? ` · hace ${formatDistanceToNowStrict(new Date(a.updated_at), { locale: es })}` : ''}
                        </div>
                      </td>
                      <td className="tabular whitespace-nowrap">
                        <span className="text-[var(--ink)] font-medium">{format(new Date(a.scheduled_at), "EEE d MMM", { locale: es })}</span>
                        <div className="text-[13px] text-[var(--muted)]">{format(new Date(a.scheduled_at), 'HH:mm')} · {a.duration_min} min</div>
                      </td>
                      <td>
                        <span className="text-[var(--ink)]">{a.patient || 'Sin nombre'}</span>
                        <div className="text-[13px] text-[var(--muted)] tabular">{[a.rut, a.phone].filter(Boolean).join(' · ') || '—'}</div>
                      </td>
                      <td>
                        <span className="text-[var(--ink)]">{a.doctor || '—'}</span>
                        <div className="text-[13px] text-[var(--muted)]">{a.treatment || '—'}{a.code ? ` · ${a.code}` : ''}</div>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          {a.conversation_id && (
                            <Link href={`/conversations?id=${a.conversation_id}`} title="Ver la conversación" className="text-[var(--muted)] hover:text-[var(--ink)]">
                              <MessageSquare size={17} />
                            </Link>
                          )}
                          <Button size="sm" loading={marcar.isPending && marcar.variables === a.id} onClick={() => marcar.mutate(a.id)}>
                            Ya lo hice
                          </Button>
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
