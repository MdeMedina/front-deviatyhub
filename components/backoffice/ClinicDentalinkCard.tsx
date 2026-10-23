'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useClinicDentalink, useDentalinkActions, useDentalinkDentistas, type DentalinkSync } from '@/lib/api/hooks/use-platform'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Dot, hace } from './shared'

const MOTIVO: Record<DentalinkSync['motivo'], string> = {
  diaria: 'diaria, antes de abrir',
  periodica: 'de cada 2 horas',
  manual: 'manual',
}

function Cifra({ label, value }: { label: string; value?: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span data-lbl>{label}</span>
      <span className="tabular text-[20px] font-semibold text-[var(--ink)] leading-none">{value ?? 0}</span>
    </div>
  )
}

/**
 * Dentalink como agenda oficial de la clínica. Manda Dentalink: cada día antes
 * de abrir (y cada 2 h en horario) se traen sus citas y bloqueos. Lo que se
 * agenda por chat lo pasa el personal a Dentalink y la sincronización lo
 * verifica. Lo configura el equipo de Dentral: token, sucursal y qué
 * profesional de Dentalink es cada uno de Dentral.
 */
export function ClinicDentalinkCard({ clinicId }: { clinicId: string }) {
  const { data: d, isLoading, isError } = useClinicDentalink(clinicId)
  const acciones = useDentalinkActions(clinicId)
  const [token, setToken] = useState('')
  const [editarToken, setEditarToken] = useState(false)
  const [sucursal, setSucursal] = useState<string>('')
  const [vinculos, setVinculos] = useState<Record<string, string>>({})
  const [confirmarQuitar, setConfirmarQuitar] = useState(false)

  const conectado = !!d?.connected
  const { data: dentistas, isLoading: cargandoDentistas, error: errorDentistas } = useDentalinkDentistas(clinicId, conectado)

  useEffect(() => {
    if (d) setVinculos(Object.fromEntries(d.doctors.map((doc) => [doc.id, doc.external_id ?? ''])))
  }, [d])

  const cambiosVinculo = useMemo(
    () => !!d && d.doctors.some((doc) => (doc.external_id ?? '') !== (vinculos[doc.id] ?? '')),
    [d, vinculos],
  )

  if (isLoading) return <div data-card className="py-10 flex justify-center"><Spinner /></div>
  if (isError || !d) return <div data-card className="px-[22px] py-5 text-[14.5px] text-[var(--neg)]">No se pudo cargar Dentalink.</div>

  const sucursales = acciones.configurar.data?.sucursales ?? d.sucursales ?? []
  const s = d.last_sync
  const errorConfig = acciones.configurar.isError ? (acciones.configurar.error as Error)?.message : null
  const vinculados = d.doctors.filter((doc) => doc.external_id).length

  const conectar = (e: React.FormEvent) => {
    e.preventDefault()
    acciones.configurar.mutate(
      { token: token.trim() || undefined, id_sucursal: sucursal ? Number(sucursal) : undefined },
      { onSuccess: () => { setToken(''); setEditarToken(false) } },
    )
  }

  return (
    <div data-card>
      <div data-hd>
        <h2>Dentalink</h2>
        <span data-badge>
          <Dot tone={conectado ? (s && !s.ok ? 'neg' : 'pos') : d.has_token ? 'neg' : 'dim'} />
          {conectado ? (s && !s.ok ? 'Conectado · última sincronización falló' : 'Conectado') : d.has_token ? 'Falta elegir sucursal' : 'Sin conectar'}
        </span>
      </div>

      <div className="px-[22px] py-4 flex flex-col gap-5">
        <p className="text-[14px] text-[var(--muted)] leading-relaxed">
          Manda la agenda de Dentalink. Cada día, una hora antes de abrir y luego cada 2 horas en horario de atención, se traen sus
          citas y bloqueos, y el agente deja de ofrecer esas horas. Lo que el agente agenda por chat lo tiene que pasar el personal
          a Dentalink: la clínica lo ve en su agenda, en «Por pasar a Dentalink».
        </p>

        {/* Conexión */}
        {(!d.has_token || editarToken || (d.has_token && !d.sucursal)) ? (
          <form onSubmit={conectar} className="flex flex-col gap-3">
            {(!d.has_token || editarToken) && (
              <label className="flex flex-col gap-1.5">
                <span data-lbl>Token de la API de Dentalink</span>
                <input
                  data-inp
                  type="password"
                  autoComplete="off"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder={d.has_token ? 'Deja vacío para conservar el actual' : 'Lo genera la clínica en Dentalink › Configuración API'}
                />
              </label>
            )}
            {sucursales.length > 1 && (
              <label className="flex flex-col gap-1.5">
                <span data-lbl>Sucursal</span>
                <select data-inp value={sucursal} onChange={(e) => setSucursal(e.target.value)}>
                  <option value="">Elige la sucursal…</option>
                  {sucursales.map((x) => (
                    <option key={x.id} value={x.id}>{x.nombre}{x.habilitada ? '' : ' (deshabilitada)'}</option>
                  ))}
                </select>
              </label>
            )}
            {errorConfig && <span className="text-[14px] text-[var(--neg)]">{errorConfig}</span>}
            <div className="flex gap-2">
              <Button type="submit" loading={acciones.configurar.isPending} disabled={!token.trim() && !d.has_token}>
                {sucursales.length > 1 ? 'Guardar sucursal' : 'Verificar y conectar'}
              </Button>
              {editarToken && <Button variant="ghost" onClick={() => setEditarToken(false)}>Cancelar</Button>}
            </div>
            <span className="text-[13px] text-[var(--muted)]">El token se guarda cifrado y no vuelve a mostrarse.</span>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex flex-col gap-0.5">
              <span data-lbl>Sucursal</span>
              <span className="text-[15px] font-medium text-[var(--ink)]">{d.sucursal?.nombre ?? `#${d.sucursal?.id}`}</span>
              {d.timezone && <span className="text-[13px] text-[var(--muted)]">Zona horaria en Dentalink: {d.timezone}</span>}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={() => acciones.sincronizar.mutate()} loading={acciones.sincronizar.isPending} disabled={vinculados === 0}>
                Sincronizar ahora
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setEditarToken(true)}>Cambiar token</Button>
              {confirmarQuitar ? (
                <>
                  <Button size="sm" variant="danger" loading={acciones.desconectar.isPending} onClick={() => acciones.desconectar.mutate(undefined, { onSuccess: () => setConfirmarQuitar(false) })}>
                    Sí, desconectar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmarQuitar(false)}>No</Button>
                </>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setConfirmarQuitar(true)}>Desconectar</Button>
              )}
            </div>
          </div>
        )}

        {/* Última sincronización */}
        {conectado && (
          <div className="flex flex-col gap-3 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] px-4 py-3.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[14.5px] font-medium text-[var(--ink)]">
                {s ? `Última sincronización ${hace(s.at)} · ${MOTIVO[s.motivo]}` : 'Todavía no se ha sincronizado'}
              </span>
              {s && <span data-badge><Dot tone={s.ok ? 'pos' : 'neg'} />{s.ok ? 'Bien' : 'Falló'}</span>}
            </div>
            {acciones.sincronizar.isError && <span className="text-[14px] text-[var(--neg)]">{(acciones.sincronizar.error as Error)?.message}</span>}
            {s?.error && <span className="text-[14px] text-[var(--neg)]">{s.error}</span>}
            {s?.ok && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                <Cifra label="Leídas" value={s.citas_leidas} />
                <Cifra label="Nuevas" value={s.creadas} />
                <Cifra label="Cambiadas" value={s.actualizadas} />
                <Cifra label="Anuladas" value={s.anuladas} />
                <Cifra label="Coordinadas" value={s.coordinadas} />
                <Cifra label="Por pasar" value={d.pending_coordination} />
              </div>
            )}
            {s?.ok && <span className="text-[13px] text-[var(--muted)]">Rango: {s.desde} a {s.hasta} · {s.bloqueos ?? 0} bloqueos de horario</span>}
            {s?.aviso && <span className="text-[14px] text-[var(--ink-soft)]">⚠ {s.aviso}</span>}
            {!!s?.dentistas_sin_vincular?.length && (
              <div className="flex items-start gap-2 text-[14px] text-[var(--ink)]">
                <AlertTriangle size={16} className="text-[var(--neg)] shrink-0 mt-[2px]" />
                <span>
                  Hay citas de profesionales de Dentalink sin vincular, que no se trajeron:{' '}
                  {s.dentistas_sin_vincular.map((x) => `${x.nombre || `#${x.id}`} (${x.citas})`).join(', ')}.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Vínculo de profesionales */}
        {conectado && (
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <span className="text-[15px] font-semibold text-[var(--ink)]">Profesionales</span>
              <span className="text-[13px] text-[var(--muted)]">{vinculados} de {d.doctors.length} vinculados · sin vínculo no se traen sus citas</span>
            </div>
            {cargandoDentistas ? (
              <div className="py-4 flex justify-center"><Spinner /></div>
            ) : errorDentistas ? (
              <span className="text-[14px] text-[var(--neg)]">{(errorDentistas as Error).message}</span>
            ) : (
              <table data-tbl>
                <thead>
                  <tr>
                    <th>En Dentral</th>
                    <th>En Dentalink</th>
                  </tr>
                </thead>
                <tbody>
                  {d.doctors.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <span className="font-medium text-[var(--ink)]">{doc.name}</span>
                        {doc.booking_mode === 'coordinar' && <span className="ml-2 text-[13px] text-[var(--muted)]">coordina el equipo</span>}
                      </td>
                      <td>
                        <select
                          data-inp
                          value={vinculos[doc.id] ?? ''}
                          onChange={(e) => setVinculos((v) => ({ ...v, [doc.id]: e.target.value }))}
                        >
                          <option value="">Sin vincular</option>
                          {(dentistas ?? []).map((x) => (
                            <option key={x.id} value={String(x.id)}>{x.nombre}{x.habilitado ? '' : ' (deshabilitado)'}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {acciones.vincular.isError && <span className="text-[14px] text-[var(--neg)]">{(acciones.vincular.error as Error)?.message}</span>}
            <div>
              <Button
                size="sm"
                disabled={!cambiosVinculo}
                loading={acciones.vincular.isPending}
                onClick={() => acciones.vincular.mutate(d.doctors.map((doc) => ({ doctor_id: doc.id, external_id: vinculos[doc.id] || null })))}
              >
                Guardar vínculos
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
