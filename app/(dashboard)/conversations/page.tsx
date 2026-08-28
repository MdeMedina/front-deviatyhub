'use client'

import React, { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ConversationList } from '@/components/features/conversations/ConversationList'
import { ConversationDetail } from '@/components/features/conversations/ConversationDetail'

function ConversationsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('id')

  const handleSelect = (id: string) => {
    router.push(`/conversations?id=${id}`)
  }

  return (
    <div className="flex flex-col gap-5 max-w-[1340px] mx-auto">
      {/* Header Bar */}
      <div className="flex items-end justify-between gap-5 flex-wrap pb-4 border-b border-[var(--line)]">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-semibold tracking-[-0.028em] text-[var(--ink)] leading-tight">
            Conversaciones
          </h1>
          <p className="text-[13.5px] text-[var(--muted)]">
            Supervisa e interviene chats en tiempo real de WhatsApp e Instagram.
          </p>
        </div>

        <div data-badge style={{ height: '32px' }}>
          <span data-dot style={{ background: 'var(--pos)' }} />
          Socket conectado
        </div>
      </div>

      {/* 3-Column Layout Container (data-conv grid: 320 | 1fr | 268, responsive) */}
      <div
        data-card
        data-conv
        className="w-full overflow-hidden"
        style={{ height: 'calc(100vh - 220px)', minHeight: '520px' }}
      >
        {/* Columna 1: Lista (se oculta bajo 820px) */}
        <div data-conv-list="true" className="border-r border-[var(--line)] h-full flex flex-col min-w-0">
          <ConversationList onSelect={handleSelect} selectedId={selectedId} />
        </div>

        {/* Columnas 2 y 3: hilo + panel de contacto (siblings del grid) */}
        <ConversationDetail conversationId={selectedId} />
      </div>
    </div>
  )
}

export default function ConversationsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-130px)] text-[var(--muted)] text-[13px]">
        Cargando interfaz de mensajería...
      </div>
    }>
      <ConversationsContent />
    </Suspense>
  )
}
