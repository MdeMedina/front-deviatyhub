'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, LogIn } from 'lucide-react'
import { useActAsClinic, usePlatformClinics } from '@/lib/api/hooks/use-platform'
import { Spinner } from '@/components/ui/Spinner'
import { Dot, MODO_AGENTE, PageHeader, PlatformOnly, estadoWhatsApp, hace } from '@/components/backoffice/shared'

export default function ClinicsPage() {
  return (
    <PlatformOnly>
      <Clinicas />
    </PlatformOnly>
  )
}

function Clinicas() {
  const { data: clinicas = [], isLoading, isError } = usePlatformClinics()
  const { enter } = useActAsClinic()
  const [busqueda, setBusqueda] = useState('')

  const t = busqueda.trim().toLowerCase()
  const visibles = clinicas.filter(
    (c) => !t || c.name.toLowerCase().includes(t) || c.slug.includes(t) || c.billing_email.toLowerCase().includes(t),
  )

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Clínicas"
        subtitle="Cada clínica es un espacio aparte: sus usuarios, su agenda, su agente y su número de WhatsApp."
        back={{ href: '/backoffice', label: 'Backoffice' }}
        actions={
          <Link
            href="/backoffice/clinics/new"
            className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-[7px] bg-[var(--blue-solid)] text-[var(--on-blue)] text-[13px] font-medium hover:opacity-[.88] transition-opacity"
          >
            <Plus size={14} /> Nueva clínica
          </Link>
        }
      />

      <div data-card>
        <div data-hd>
          <div style={{ position: 'relative', width: '280px', maxWidth: '60%' }}>
            <Search size={14} strokeWidth={1.75} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dim)' }} />
            <input
              data-inp
              type="text"
              placeholder="Buscar por nombre o correo…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ height: '32px', paddingLeft: '31px' }}
            />
          </div>
          <span data-lbl>{visibles.length} de {clinicas.length}</span>
        </div>

        {isLoading ? (
          <div className="py-16 flex justify-center"><Spinner /></div>
        ) : isError ? (
          <p className="px-[18px] py-6 text-[13px] text-[var(--neg)]">No se pudieron cargar las clínicas.</p>
        ) : visibles.length === 0 ? (
          <p className="px-[18px] py-6 text-[13px] text-[var(--muted)]">Ninguna clínica coincide con la búsqueda.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table data-tbl>
              <thead>
                <tr>
                  <th>Clínica</th>
                  <th>Estado</th>
                  <th>Agente</th>
                  <th>WhatsApp</th>
                  <th style={{ textAlign: 'right' }}>Profesionales</th>
                  <th style={{ textAlign: 'right' }}>Conversaciones 30 d</th>
                  <th style={{ textAlign: 'right' }}>Citas agente 30 d</th>
                  <th>Última actividad</th>
                  <th style={{ textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((c) => {
                  const wa = estadoWhatsApp(c.whatsapp)
                  const modo = c.agent_mode ? MODO_AGENTE[c.agent_mode] : null
                  return (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/backoffice/clinics/${c.id}`} className="flex flex-col min-w-0 group">
                          <span className="font-medium text-[var(--ink)] group-hover:text-[var(--blue)] truncate">{c.name}</span>
                          <span className="tabular text-[11.5px] text-[var(--dim)]">{c.slug} · {c.plan}</span>
                        </Link>
                      </td>
                      <td>
                        <span data-badge><Dot tone={c.active ? 'pos' : 'dim'} />{c.active ? 'Activa' : 'Inactiva'}</span>
                      </td>
                      <td>
                        {modo ? <span data-badge><Dot tone={modo.tone} />{modo.label}</span> : <span className="text-[var(--dim)]">—</span>}
                      </td>
                      <td>
                        <span data-badge><Dot tone={wa.tone} />{wa.label}</span>
                      </td>
                      <td className="tabular" style={{ textAlign: 'right' }}>{c.doctors}</td>
                      <td className="tabular" style={{ textAlign: 'right' }}>{c.conversations_30d}</td>
                      <td className="tabular" style={{ textAlign: 'right' }}>{c.agent_appointments_30d}</td>
                      <td className="text-[var(--muted)] whitespace-nowrap">{hace(c.last_activity_at)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => enter({ id: c.id, name: c.name })}
                          className="h-7 px-2.5 inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--line)] bg-[var(--card)] text-[12px] text-[var(--ink-soft)] hover:border-[var(--dim)] hover:text-[var(--ink)] transition-colors cursor-pointer whitespace-nowrap"
                          title="Abrir el panel de esta clínica como su administrador"
                        >
                          <LogIn size={12} /> Entrar
                        </button>
                      </td>
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
