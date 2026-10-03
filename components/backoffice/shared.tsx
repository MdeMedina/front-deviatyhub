'use client'

import React, { ReactNode, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Check, Copy } from 'lucide-react'
import { formatDistanceToNowStrict } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuthStore } from '@/lib/stores/auth.store'
import type { PlatformClinicRow } from '@/lib/api/hooks/use-platform'

/** Todo el backoffice es solo para el equipo de la plataforma. */
export function PlatformOnly({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (user?.platform_admin) return <>{children}</>
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-[var(--card)] border border-[var(--line)] rounded-[10px] min-h-[380px] max-w-md mx-auto text-center">
      <div className="w-11 h-11 border border-[var(--line)] rounded-[7px] bg-[var(--head)] flex items-center justify-center text-[var(--neg)] mb-3">
        <AlertCircle size={22} />
      </div>
      <h2 className="text-[18px] font-semibold text-[var(--ink)] mb-1.5">Solo para el equipo de Dentral</h2>
      <p className="text-[13px] text-[var(--muted)] leading-relaxed mb-5">
        El backoffice es la administración de la plataforma. Tu cuenta es de una clínica.
      </p>
      <Link href="/dashboard" className="text-[13px] font-medium text-[var(--blue)] hover:underline">
        Volver al panel
      </Link>
    </div>
  )
}

export function PageHeader({ title, subtitle, actions, back }: {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
  back?: { href: string; label: string }
}) {
  return (
    <div className="flex items-end justify-between gap-5 flex-wrap pb-4 border-b border-[var(--line)]">
      <div className="flex flex-col gap-1 min-w-0">
        {back && (
          <Link href={back.href} className="microlabel hover:text-[var(--ink)] transition-colors w-fit">
            ← {back.label}
          </Link>
        )}
        <h1 className="text-[24px] font-semibold tracking-[-0.028em] text-[var(--ink)] leading-tight">{title}</h1>
        {subtitle && <p className="text-[13.5px] text-[var(--muted)]">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div data-card className="px-4 py-3.5 flex flex-col gap-1.5 min-w-0">
      <span data-lbl>{label}</span>
      <span className="tabular text-[24px] font-semibold tracking-[-0.02em] text-[var(--ink)] leading-none">{value}</span>
      {hint && <span className="text-[12px] text-[var(--muted)]">{hint}</span>}
    </div>
  )
}

export function Dot({ tone }: { tone: 'pos' | 'neg' | 'dim' | 'blue' }) {
  const color = { pos: 'var(--pos)', neg: 'var(--neg)', dim: 'var(--dim)', blue: 'var(--blue)' }[tone]
  return <span data-dot style={{ background: color }} />
}

export function hace(fecha: string | null | undefined): string {
  if (!fecha) return '—'
  return `hace ${formatDistanceToNowStrict(new Date(fecha), { locale: es })}`
}

export const MODO_AGENTE: Record<string, { label: string; tone: 'pos' | 'blue' | 'dim' }> = {
  AUTONOMOUS: { label: 'Autónomo', tone: 'pos' },
  SUPERVISED: { label: 'Supervisado', tone: 'blue' },
  PAUSED: { label: 'En pausa', tone: 'dim' },
}

export function estadoWhatsApp(w: PlatformClinicRow['whatsapp']): { label: string; tone: 'pos' | 'neg' | 'dim' } {
  if (w.source === 'server') return { label: 'Número del servidor', tone: 'pos' }
  if (w.connected) return { label: 'Conectado', tone: 'pos' }
  if (w.configured) return { label: 'Sin verificar', tone: 'neg' }
  return { label: 'Sin configurar', tone: 'dim' }
}

/** Campo de solo lectura con botón de copiar (enlaces de invitación). */
export function CopyField({ value }: { value: string }) {
  const [copiado, setCopiado] = useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1800)
    } catch {
      inputRef.current?.select()
    }
  }
  return (
    <div className="flex items-center gap-2 min-w-0">
      <input
        ref={inputRef}
        data-inp
        readOnly
        value={value}
        onFocus={(e) => e.currentTarget.select()}
        className="tabular text-[12px] flex-1 min-w-0"
        style={{ height: '34px' }}
      />
      <button
        type="button"
        onClick={copiar}
        className="h-[34px] px-3 inline-flex items-center gap-1.5 rounded-[7px] border border-[var(--line)] bg-[var(--card)] text-[12.5px] text-[var(--ink-soft)] hover:border-[var(--dim)] hover:text-[var(--ink)] transition-colors cursor-pointer shrink-0"
      >
        {copiado ? <Check size={13} /> : <Copy size={13} />}
        {copiado ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  )
}
