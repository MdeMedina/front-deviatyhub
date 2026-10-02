'use client'

import React from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { usePlatformClinics, usePlatformOverview } from '@/lib/api/hooks/use-platform'
import { Spinner } from '@/components/ui/Spinner'
import { Dot, PageHeader, PlatformOnly, Stat, estadoWhatsApp, hace } from '@/components/backoffice/shared'
import { formatCount } from '@/lib/utils/metrics-format'

export default function BackofficePage() {
  return (
    <PlatformOnly>
      <Resumen />
    </PlatformOnly>
  )
}

function Resumen() {
  const { data: o, isLoading } = usePlatformOverview()
  const { data: clinicas = [] } = usePlatformClinics()

  // Lo que pide atención: clínicas activas a las que les falta algo para operar.
  const pendientes = clinicas.filter(
    (c) => c.active && (!c.whatsapp.connected || c.agent_mode === 'PAUSED' || c.doctors === 0),
  )

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Backoffice"
        subtitle="Toda la plataforma: clínicas, actividad del agente y lo que falta por poner en marcha."
        actions={
          <Link
            href="/backoffice/clinics/new"
            className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-[7px] bg-[var(--blue-solid)] text-[var(--on-blue)] text-[13px] font-medium hover:opacity-[.88] transition-opacity"
          >
            <Plus size={14} /> Nueva clínica
          </Link>
        }
      />

      {isLoading || !o ? (
        <div className="py-16 flex justify-center"><Spinner /></div>
      ) : (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
          <Stat label="Clínicas activas" value={`${o.active_clinics}`} hint={`de ${o.clinics} creadas`} />
          <Stat label="Conversaciones · 30 d" value={formatCount(o.conversations_30d)} />
          <Stat label="Mensajes entrantes · 7 d" value={formatCount(o.inbound_messages_7d)} />
          <Stat label="Citas del agente · 30 d" value={formatCount(o.agent_appointments_30d)} />
          <Stat label="Derivaciones · 30 d" value={formatCount(o.human_takeovers_30d)} hint="conversaciones en manos del equipo" />
        </div>
      )}

      <div data-card>
        <div data-hd>
          <h2>Por poner en marcha</h2>
          <span data-lbl>{pendientes.length} clínica{pendientes.length === 1 ? '' : 's'}</span>
        </div>
        {pendientes.length === 0 ? (
          <p className="px-[18px] py-6 text-[13px] text-[var(--muted)]">
            Todas las clínicas activas tienen WhatsApp conectado, profesionales y el agente encendido.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table data-tbl>
              <thead>
                <tr>
                  <th>Clínica</th>
                  <th>Falta</th>
                  <th>Última actividad</th>
                </tr>
              </thead>
              <tbody>
                {pendientes.map((c) => {
                  const falta = [
                    !c.whatsapp.connected && `WhatsApp: ${estadoWhatsApp(c.whatsapp).label.toLowerCase()}`,
                    c.doctors === 0 && 'sin profesionales',
                    c.agent_mode === 'PAUSED' && 'agente en pausa',
                  ].filter(Boolean)
                  return (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/backoffice/clinics/${c.id}`} className="font-medium text-[var(--ink)] hover:text-[var(--blue)]">
                          {c.name}
                        </Link>
                      </td>
                      <td>
                        <span className="flex flex-wrap gap-1.5">
                          {falta.map((f) => (
                            <span key={String(f)} data-badge><Dot tone="neg" />{f}</span>
                          ))}
                        </span>
                      </td>
                      <td className="text-[var(--muted)]">{hace(c.last_activity_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
