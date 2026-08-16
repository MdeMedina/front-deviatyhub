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
    <div className="flex h-[calc(100vh-10rem)] w-full overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Columna Izquierda: Master (Lista) */}
      <div className="w-[380px] flex-shrink-0 border-r border-slate-100 hidden md:block">
        <ConversationList onSelect={handleSelect} selectedId={selectedId} />
      </div>

      {/* Columna Derecha: Detail (Chat) */}
      <div className="flex-1 min-w-0 relative">
        <ConversationDetail conversationId={selectedId} />
      </div>
    </div>
  )
}

export default function ConversationsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full text-slate-400">
        Cargando interfaz de mensajería...
      </div>
    }>
      <ConversationsContent />
    </Suspense>
  )
}
