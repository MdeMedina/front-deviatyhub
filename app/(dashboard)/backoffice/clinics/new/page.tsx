'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { useActAsClinic, useCreateClinic, type CreateClinicResult } from '@/lib/api/hooks/use-platform'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { CopyField, PageHeader, PlatformOnly } from '@/components/backoffice/shared'

export default function NewClinicPage() {
  return (
    <PlatformOnly>
      <NuevaClinica />
    </PlatformOnly>
  )
}

/** Mismo criterio que el backend: minúsculas, sin tildes, palabras separadas por guiones. */
function slugDe(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function NuevaClinica() {
  const crear = useCreateClinic()
  const { enter } = useActAsClinic()

  const [nombre, setNombre] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEditado, setSlugEditado] = useState(false)
  const [plan, setPlan] = useState<'STARTER' | 'PRO'>('STARTER')
  const [correoFacturacion, setCorreoFacturacion] = useState('')
  const [correoDueno, setCorreoDueno] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [resultado, setResultado] = useState<CreateClinicResult | null>(null)

  const slugFinal = slugEditado ? slug : slugDe(nombre)
  const listo = nombre.trim().length >= 2 && slugFinal && correoFacturacion.includes('@') && correoDueno.includes('@')

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!listo) return
    const r = await crear.mutateAsync({
      name: nombre.trim(),
      slug: slugFinal,
      plan,
      billingEmail: correoFacturacion.trim(),
      adminEmail: correoDueno.trim(),
      phone: telefono.trim() || undefined,
      address: direccion.trim() || undefined,
    })
    setResultado(r)
  }

  if (resultado) {
    return (
      <div className="flex flex-col gap-5 max-w-[720px]">
        <PageHeader title="Clínica creada" back={{ href: '/backoffice/clinics', label: 'Clínicas' }} />
        <div data-card>
          <div className="px-5 py-5 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-[var(--pos)] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <p className="text-[14.5px] font-semibold text-[var(--ink)]">{resultado.clinic.name}</p>
                <p className="text-[13px] text-[var(--muted)] leading-relaxed">
                  Le enviamos la invitación a <span className="text-[var(--ink)]">{resultado.admin.email}</span>.
                  El agente queda <strong className="font-medium text-[var(--ink)]">en pausa</strong> hasta que la clínica
                  tenga profesionales, tratamientos y WhatsApp conectado.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span data-lbl>Enlace de invitación</span>
              <CopyField value={resultado.invite_link} />
              <span className="text-[12px] text-[var(--muted)]">
                Por si el correo no llega. Vence el {new Date(resultado.invite_expires).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}.
              </span>
            </div>
            <div className="flex gap-2 flex-wrap pt-1">
              <Button onClick={() => enter({ id: resultado.clinic.id, name: resultado.clinic.name })}>
                Entrar a su panel para configurarla
              </Button>
              <Link
                href={`/backoffice/clinics/${resultado.clinic.id}`}
                className="h-9 px-3.5 inline-flex items-center rounded-[7px] border border-[var(--line)] bg-[var(--card)] text-[13px] text-[var(--ink-soft)] hover:border-[var(--dim)] hover:text-[var(--ink)] transition-colors"
              >
                Ver la ficha
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 max-w-[720px]">
      <PageHeader
        title="Nueva clínica"
        subtitle="Crea el espacio de la clínica e invita a la persona que la va a administrar."
        back={{ href: '/backoffice/clinics', label: 'Clínicas' }}
      />

      <form onSubmit={enviar} data-card>
        <div data-hd><h2>Datos de la clínica</h2></div>
        <div className="px-5 py-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="Nombre" value={nombre} onChange={setNombre} placeholder="Clínica Dental Providencia" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Input
              label="Identificador"
              value={slugFinal}
              onChange={(v) => { setSlugEditado(true); setSlug(slugDe(v)) }}
              placeholder="clinica-dental-providencia"
            />
            <span className="text-[12px] text-[var(--muted)]">Único en la plataforma. Se genera con el nombre.</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="plan" className="microlabel">Plan</label>
            <select id="plan" data-inp value={plan} onChange={(e) => setPlan(e.target.value as 'STARTER' | 'PRO')} style={{ height: '36px' }}>
              <option value="STARTER">Starter</option>
              <option value="PRO">Pro</option>
            </select>
          </div>
          <Input label="Teléfono" value={telefono} onChange={setTelefono} placeholder="+56 2 2345 6789" />
          <Input label="Correo de facturación" type="email" value={correoFacturacion} onChange={setCorreoFacturacion} placeholder="facturacion@clinica.cl" required />
          <div className="sm:col-span-2">
            <Input label="Dirección" value={direccion} onChange={setDireccion} placeholder="Av. Providencia 1234, of. 502, Providencia" />
          </div>
        </div>

        <div data-hd style={{ borderTop: '1px solid var(--line)' }}><h2>Quién la administra</h2></div>
        <div className="px-5 py-5 flex flex-col gap-1.5">
          <Input label="Correo del administrador" type="email" value={correoDueno} onChange={setCorreoDueno} placeholder="admin@clinica.cl" required />
          <span className="text-[12px] text-[var(--muted)]">
            Recibe una invitación para crear su contraseña y entra directo al panel de su clínica como Administrador. Desde ahí invita a su equipo.
          </span>
        </div>

        <div className="px-5 py-4 border-t border-[var(--line)] bg-[var(--head)] flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[12.5px] text-[var(--muted)]">
            Se crea con horario de lunes a viernes de 9:00 a 18:00 y el agente en pausa.
          </span>
          <div className="flex items-center gap-3">
            {crear.isError && (
              <span className="text-[12.5px] text-[var(--neg)]">{(crear.error as Error)?.message || 'No se pudo crear.'}</span>
            )}
            <Button type="submit" disabled={!listo} loading={crear.isPending}>Crear clínica</Button>
          </div>
        </div>
      </form>
    </div>
  )
}
