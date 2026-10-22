'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'
import { usePlatformClinic, useClinicPrompt, usePromptActions, useReviewPrompt } from '@/lib/api/hooks/use-platform'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Dot, PageHeader, PlatformOnly, hace } from '@/components/backoffice/shared'

export default function PromptPage() {
  return (
    <PlatformOnly>
      <Editor />
    </PlatformOnly>
  )
}

function Editor() {
  const { id } = useParams<{ id: string }>()
  const { data: clinica } = usePlatformClinic(id)
  const { data: p, isLoading, isError } = useClinicPrompt(id)
  const acciones = usePromptActions(id)
  const revisar = useReviewPrompt(id)
  const area = useRef<HTMLTextAreaElement>(null)

  const [texto, setTexto] = useState('')
  const [nota, setNota] = useState('')
  const [cargado, setCargado] = useState(false)
  const [verFijo, setVerFijo] = useState(false)
  const [confirmarBase, setConfirmarBase] = useState(false)
  const [avisosGuardado, setAvisosGuardado] = useState<string[]>([])

  // Al abrir: la versión activa o, si no hay, el prompt del sistema.
  useEffect(() => {
    if (p && !cargado) {
      setTexto(p.active?.content ?? p.base)
      setCargado(true)
    }
  }, [p, cargado])

  const vigente = p?.active?.content ?? p?.base ?? ''
  const sinGuardar = cargado && texto !== vigente

  // Revisión mientras se escribe, con una pausa para no consultar en cada tecla.
  useEffect(() => {
    if (!cargado) return
    const t = setTimeout(() => revisar.mutate(texto), 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto, cargado])

  const insertar = (marcador: string) => {
    const el = area.current
    const valor = `{${marcador}}`
    if (!el) return setTexto((t) => t + valor)
    const ini = el.selectionStart
    const fin = el.selectionEnd
    setTexto((t) => t.slice(0, ini) + valor + t.slice(fin))
    requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = el.selectionEnd = ini + valor.length
    })
  }

  const errores = revisar.data?.errores ?? []
  const avisos = revisar.data?.avisos ?? []
  const igualAlBase = useMemo(() => !!p && texto === p.base, [p, texto])

  if (isLoading) return <div className="py-16 flex justify-center"><Spinner /></div>
  if (isError || !p) return <p className="text-[13px] text-[var(--neg)]">No se pudo cargar el prompt.</p>

  const guardar = () =>
    acciones.guardar.mutate(
      { content: texto, note: nota.trim() || undefined },
      { onSuccess: (r) => { setNota(''); setAvisosGuardado(r.warnings ?? []) } },
    )

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Prompt del agente"
        back={{ href: `/backoffice/clinics/${id}`, label: clinica?.name ?? 'Clínica' }}
        subtitle={
          <span className="flex items-center gap-2 flex-wrap">
            {p.active ? (
              <span data-badge><Dot tone="pos" />Versión propia · {hace(p.active.created_at)}{p.active.created_by ? ` · ${p.active.created_by}` : ''}</span>
            ) : (
              <span data-badge><Dot tone="dim" />Usa el prompt del sistema</span>
            )}
            <span className="text-[12.5px] text-[var(--muted)]">Solo lo ve y lo edita el equipo de Dentral.</span>
          </span>
        }
      />

      {p.base_changed && (
        <div className="flex items-start gap-2.5 rounded-[10px] border border-[var(--neg)] bg-[var(--card)] px-4 py-3 text-[13px] text-[var(--ink)]">
          <AlertTriangle size={16} className="text-[var(--neg)] shrink-0 mt-[1px]" />
          <span>
            El prompt del sistema cambió después de guardar esta versión, así que no incluye las mejoras posteriores.
            Revísala partiendo del prompt del sistema o vuelve a usarlo.
          </span>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        {/* Editor */}
        <div data-card className="flex flex-col min-w-0">
          <div data-hd>
            <h2>Comportamiento</h2>
            <span className="flex items-center gap-2">
              {sinGuardar && <span className="text-[12px] text-[var(--neg)]">Cambios sin guardar</span>}
              <span data-lbl className="tabular">{texto.length.toLocaleString('es-CL')} caracteres</span>
            </span>
          </div>
          <div className="px-[18px] py-2.5 border-b border-[var(--line)] flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="ghost" onClick={() => setTexto(p.base)} disabled={igualAlBase}>Partir del prompt del sistema</Button>
            {p.active && (
              <Button size="sm" variant="ghost" onClick={() => setTexto(p.active!.content)} disabled={texto === p.active.content}>
                Partir de la versión activa
              </Button>
            )}
          </div>
          <textarea
            ref={area}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            spellCheck={false}
            aria-label="Texto de comportamiento del agente"
            className="w-full min-h-[560px] resize-y px-[18px] py-3.5 bg-[var(--card)] text-[13px] leading-relaxed text-[var(--ink)] outline-none"
          />
          {(errores.length > 0 || avisos.length > 0 || avisosGuardado.length > 0) && (
            <ul className="px-[18px] py-3 border-t border-[var(--line)] flex flex-col gap-1.5 text-[12.5px]">
              {errores.map((e) => <li key={e} className="text-[var(--neg)]">✕ {e}</li>)}
              {[...new Set([...avisos, ...avisosGuardado])].map((a) => <li key={a} className="text-[var(--ink-soft)]">⚠ {a}</li>)}
            </ul>
          )}
          <div className="px-[18px] py-3 border-t border-[var(--line)] bg-[var(--head)] flex items-center gap-3 flex-wrap">
            <input
              data-inp
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Nota de esta versión (qué cambiaste y por qué)"
              className="flex-1 min-w-[220px]"
              style={{ height: 34 }}
            />
            {acciones.guardar.isError && <span className="text-[12px] text-[var(--neg)]">{(acciones.guardar.error as Error)?.message}</span>}
            <Button onClick={guardar} loading={acciones.guardar.isPending} disabled={!sinGuardar || errores.length > 0}>
              Guardar y activar
            </Button>
          </div>
        </div>

        {/* Lateral */}
        <div className="flex flex-col gap-5 min-w-0">
          <div data-card>
            <div data-hd><h2>Marcadores</h2></div>
            <ul className="px-[18px] py-3 flex flex-col gap-2.5">
              {Object.entries(p.markers).map(([nombre, desc]) => (
                <li key={nombre} className="flex flex-col gap-0.5">
                  <button type="button" onClick={() => insertar(nombre)} className="w-fit text-[12.5px] font-medium text-[var(--blue)] hover:underline cursor-pointer" title="Insertar en el texto">
                    {`{${nombre}}`}
                  </button>
                  <span className="text-[11.5px] text-[var(--muted)] leading-snug">{desc}</span>
                </li>
              ))}
            </ul>
            <p className="px-[18px] pb-3 text-[11.5px] text-[var(--muted)] leading-snug">
              Cualquier otra llave se envía tal cual. Los datos de la clínica (horario, tratamientos, profesionales) los agrega el sistema solo.
            </p>
          </div>

          <div data-card>
            <div data-hd>
              <h2>Versiones</h2>
              <span data-lbl>{p.versions.length}</span>
            </div>
            {p.versions.length === 0 ? (
              <p className="px-[18px] py-4 text-[12.5px] text-[var(--muted)]">Todavía no hay versiones propias.</p>
            ) : (
              <ul className="flex flex-col">
                {p.versions.map((v) => (
                  <li key={v.id} className="px-[18px] py-2.5 border-t border-[var(--line)] first:border-t-0 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12.5px] text-[var(--ink)]">{new Date(v.created_at).toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      {v.active ? <span data-badge><Dot tone="pos" />Activa</span> : null}
                    </div>
                    {v.note && <span className="text-[12px] text-[var(--ink-soft)] leading-snug">{v.note}</span>}
                    <span className="text-[11.5px] text-[var(--muted)]">
                      {v.created_by ?? 'sin autor'}{!v.based_on_current ? ' · sobre un prompt del sistema anterior' : ''}
                    </span>
                    <div className="flex gap-1.5 pt-0.5">
                      <Button size="sm" variant="ghost" onClick={() => setTexto(v.content)}>Ver en el editor</Button>
                      {!v.active && (
                        <Button size="sm" variant="secondary" loading={acciones.activar.isPending && acciones.activar.variables === v.id} onClick={() => acciones.activar.mutate(v.id, { onSuccess: () => setTexto(v.content) })}>
                          Activar
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {p.active && (
              <div className="px-[18px] py-3 border-t border-[var(--line)] bg-[var(--head)]">
                {confirmarBase ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-[12.5px] text-[var(--ink)]">El agente vuelve a usar el prompt del sistema. Las versiones quedan guardadas.</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="danger" loading={acciones.usarBase.isPending} onClick={() => acciones.usarBase.mutate(undefined, { onSuccess: () => { setConfirmarBase(false); setTexto(p.base) } })}>
                        Sí, volver
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmarBase(false)}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => setConfirmarBase(true)}>Volver al prompt del sistema</Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Parte fija */}
      <div data-card>
        <button type="button" onClick={() => setVerFijo((v) => !v)} className="w-full text-left cursor-pointer" aria-expanded={verFijo}>
          <div data-hd>
            <h2 className="flex items-center gap-1.5">
              {verFijo ? <ChevronDown size={15} /> : <ChevronRight size={15} />} Parte fija (no editable)
            </h2>
            <span data-lbl>Va siempre después del comportamiento</span>
          </div>
        </button>
        {verFijo && (
          <div className="px-[18px] py-3.5 flex flex-col gap-2">
            <p className="text-[12px] text-[var(--muted)] leading-snug">
              Datos de la clínica, calendario, estado de la reserva y el formato de respuesta. El sistema depende de este formato para reservar, por eso no se edita.
            </p>
            <pre className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-[var(--ink-soft)] bg-[var(--surface)] border border-[var(--line)] rounded-[8px] p-3 overflow-x-auto">
              {p.fixed}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
