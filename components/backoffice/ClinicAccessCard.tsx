'use client'

import React from 'react'
import { useUpdateClinic, useUpdateClinicAccess, type ClinicAccessPatch, type PlatformClinicDetail } from '@/lib/api/hooks/use-platform'

const MODULOS: { key: string; label: string }[] = [
  { key: 'conversations', label: 'Conversaciones' },
  { key: 'agenda', label: 'Agenda' },
  { key: 'knowledge_base', label: 'Base de conocimiento' },
  { key: 'agent_actions', label: 'Acciones del agente' },
  { key: 'simulator', label: 'Simulador' },
  { key: 'metrics', label: 'Métricas' },
  { key: 'integrations', label: 'Integraciones' },
  { key: 'clinic_config', label: 'Configuración' },
  { key: 'users', label: 'Usuarios' },
  { key: 'security', label: 'Seguridad' },
]

const CANALES: { key: string; label: string }[] = [
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'instagram', label: 'Instagram' },
]

const ACCIONES: { key: string; label: string }[] = [
  { key: 'schedule', label: 'Agendar' },
  { key: 'reschedule', label: 'Reagendar' },
  { key: 'cancel', label: 'Cancelar' },
]

function Interruptor({ on, onChange, disabled, label }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className="relative shrink-0 rounded-full border border-[var(--line)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      style={{ width: 34, height: 20, background: on ? 'var(--blue)' : 'var(--surface-2)' }}
    >
      <span
        className="absolute rounded-full bg-white transition-[left] duration-150"
        style={{ top: 2, left: on ? 16 : 2, width: 14, height: 14, boxShadow: '0 1px 2px rgba(0,0,0,.15)' }}
      />
    </button>
  )
}

function Fila({ label, hint, on, onChange, disabled }: { label: string; hint?: string; on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-[7px]">
      <div className="flex flex-col min-w-0">
        <span className={`text-[13px] ${disabled ? 'text-[var(--dim)]' : 'text-[var(--ink)]'}`}>{label}</span>
        {hint && <span className="text-[11.5px] text-[var(--muted)] leading-snug">{hint}</span>}
      </div>
      <Interruptor on={on} onChange={onChange} disabled={disabled} label={label} />
    </div>
  )
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="px-[18px] py-3 border-t border-[var(--line)] first:border-t-0">
      <span data-lbl>{titulo}</span>
      <div className="mt-1 flex flex-col">{children}</div>
    </div>
  )
}

/**
 * Lo que la plataforma le habilita a la clínica. Cada cambio se guarda al
 * momento. La clínica ve el efecto en su próxima recarga; lo que ya tenía
 * abierto con un token emitido antes sigue hasta 15 minutos.
 */
export function ClinicAccessCard({ clinic }: { clinic: PlatformClinicDetail }) {
  const acceso = useUpdateClinicAccess(clinic.id)
  const clinica = useUpdateClinic(clinic.id)
  const a = clinic.access
  const ocupado = acceso.isPending || clinica.isPending
  const guardar = (patch: ClinicAccessPatch) => acceso.mutate(patch)
  const agenteApagado = !a.agent.enabled

  return (
    <div data-card>
      <div data-hd>
        <h2>Accesos</h2>
        {acceso.isError || clinica.isError ? (
          <span className="text-[12px] text-[var(--neg)]">No se pudo guardar</span>
        ) : (
          <span data-lbl>{ocupado ? 'Guardando…' : 'Se guarda al cambiar'}</span>
        )}
      </div>

      <Grupo titulo="Plataforma">
        <Fila
          label="Entrada a la plataforma"
          hint={clinic.active ? 'Sus usuarios pueden iniciar sesión.' : 'Nadie de la clínica puede entrar. El agente tampoco responde.'}
          on={clinic.active}
          onChange={(v) => clinica.mutate({ active: v })}
          disabled={ocupado}
        />
      </Grupo>

      <Grupo titulo="Agente">
        <Fila
          label="Agente"
          hint={agenteApagado ? 'No responde por ningún canal ni envía recordatorios.' : undefined}
          on={a.agent.enabled}
          onChange={(v) => guardar({ agent: { enabled: v } })}
          disabled={ocupado}
        />
        {CANALES.map((c) => (
          <Fila
            key={c.key}
            label={c.label}
            on={a.agent.channels[c.key] !== false}
            onChange={(v) => guardar({ agent: { channels: { [c.key]: v } } })}
            disabled={ocupado || agenteApagado}
          />
        ))}
        {ACCIONES.map((c) => (
          <Fila
            key={c.key}
            label={c.label}
            on={a.agent.actions[c.key] !== false}
            onChange={(v) => guardar({ agent: { actions: { [c.key]: v } } })}
            disabled={ocupado || agenteApagado}
          />
        ))}
        <Fila
          label="Recordatorios"
          hint="3 días, 1 día y 2 horas antes de cada hora."
          on={a.agent.reminders}
          onChange={(v) => guardar({ agent: { reminders: v } })}
          disabled={ocupado || agenteApagado}
        />
      </Grupo>

      <Grupo titulo="Secciones del panel">
        {MODULOS.map((m) => (
          <Fila
            key={m.key}
            label={m.label}
            on={a.modules[m.key] !== false}
            onChange={(v) => guardar({ modules: { [m.key]: v } })}
            disabled={ocupado}
          />
        ))}
      </Grupo>
    </div>
  )
}
