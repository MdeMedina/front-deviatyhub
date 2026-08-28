'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Shield, ShieldOff, AlertCircle, Info } from 'lucide-react'
import { useConversationDetail, useTakeover } from '@/lib/api/hooks/use-conversations'
import { ConversationStatus, MessageRole } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/lib/stores/auth.store'

interface ConversationDetailProps {
  conversationId: string | null
}

export const ConversationDetail: React.FC<ConversationDetailProps> = ({ conversationId }) => {
  const { data: conversation, isLoading, isError } = useConversationDetail(conversationId || '')
  const { takeover, release, sendMessage } = useTakeover(conversationId || '')
  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { hasPermission } = useAuthStore()

  const canTakeover = hasPermission('conversations.takeover')
  const isHumanControl = conversation?.status === ConversationStatus.HUMAN_TAKEOVER

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation?.messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || sendMessage.isPending) return
    
    try {
      await sendMessage.mutate(messageInput.trim(), {})
      setMessageInput('')
    } catch (error) {
      // Handled by global toast
    }
  }

  if (!conversationId) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-[var(--surface)]">
        <EmptyState 
          title="Selecciona un chat"
          description="Elige una conversación de la lista para ver el historial y tomar el control."
          icon={<Info size={22} />}
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-[var(--card)] gap-2">
        <Spinner size="md" />
        <span className="microlabel text-[10px]">Cargando detalles</span>
      </div>
    )
  }

  if (isError || !conversation) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-[var(--card)]">
        <EmptyState 
          title="Error al cargar"
          description="No pudimos obtener los detalles de esta conversación."
          icon={<AlertCircle size={22} className="text-[var(--neg)]" />}
        />
      </div>
    )
  }

  const initial = conversation.contact?.name?.charAt(0) || '?'

  return (
    <>
      {/* Thread column (header + messages + footer) */}
      <div className="flex flex-col h-full min-w-0 overflow-hidden bg-[var(--card)]">
        {/* Thread header */}
        <header className="px-[18px] py-3 border-b border-[var(--line)] bg-[var(--head)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-[30px] h-[30px] rounded-[8px] bg-[var(--blue-solid)] text-[var(--on-blue)] grid place-items-center font-semibold text-[12px] shrink-0">
              {initial}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[13.5px] font-semibold text-[var(--ink)] leading-tight">{conversation.contact?.name}</span>
              <span className="microlabel">
                {isHumanControl ? 'Control humano' : 'IA atendiendo'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canTakeover && (
              isHumanControl ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => release.mutate()}
                  loading={release.isPending}
                  icon={<ShieldOff size={13} />}
                >
                  Liberar
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => takeover.mutate()}
                  loading={takeover.isPending}
                  icon={<Shield size={13} />}
                >
                  Tomar Control Manual
                </Button>
              )
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-[var(--surface)]">
          {conversation.messages?.map((msg: any, idx: number) => (
            <MessageBubble key={msg.id || idx} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer Input Area */}
        <footer className="py-3.5 px-[18px] bg-[var(--card)] border-t border-[var(--line)] shrink-0">
          {!isHumanControl ? (
            <div className="p-3 rounded-[7px] bg-[var(--blue-tint)] border border-[var(--blue-line)] flex items-center gap-2 text-[12.5px] text-[var(--blue)]">
              <Info size={15} className="shrink-0" />
              <p className="leading-relaxed">
                El Agente de IA está atendiendo esta conversación. Para intervenir, pulsa <strong>&quot;Tomar Control Manual&quot;</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                data-inp
                type="text"
                value={messageInput}
                disabled={release.isPending}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Escribe un mensaje..."
                style={{ height: '38px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend(e as any)
                  }
                }}
              />
              <Button
                type="submit"
                aria-label="Enviar"
                disabled={!messageInput.trim() || sendMessage.isPending || release.isPending}
                loading={sendMessage.isPending}
                variant="primary"
                className="h-[38px] w-[38px] p-0 shrink-0"
              >
                <Send size={15} strokeWidth={1.75} />
              </Button>
            </form>
          )}
        </footer>
      </div>

      {/* Right Info Sidebar (grid column 3; hidden below 1240px via data-conv-aside) */}
      <aside data-conv-aside="true" className="border-l border-[var(--line)] bg-[var(--card)] p-[18px] overflow-y-auto flex flex-col gap-[18px] h-full">
        <div className="flex flex-col gap-[14px]">
          <span className="microlabel">Información del Contacto</span>
          <div className="flex flex-col gap-[14px]">
            <ContactInfoItem label="Nombre" value={conversation.contact?.name} />
            <ContactInfoItem label="Teléfono" value={conversation.contact?.phone} mono />
            <ContactInfoItem label="Email" value={conversation.contact?.email || 'No registrado'} breakAll />
            <ContactInfoItem label="Instagram" value={conversation.contact?.instagram_user || 'No vinculado'} muted />
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--line-soft)] flex flex-col gap-3">
          <span className="microlabel">Contexto Actual</span>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-[12px]">
              <span className="text-[var(--muted)]">Estado bot</span>
              <Badge variant="neutral" size="sm">{conversation.current_step}</Badge>
            </div>
            <div className="flex justify-between items-center text-[12px]">
              <span className="text-[var(--muted)]">Canal</span>
              <Badge variant="info" size="sm">{conversation.channel}</Badge>
            </div>
            {conversation.appointment_id && (
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-[var(--muted)]">Cita médica</span>
                <Badge variant="success" size="sm">Agendada</Badge>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

function MessageBubble({ message }: { message: any }) {
  const isUser = message.role === MessageRole.USER
  const isAssistant = message.role === MessageRole.ASSISTANT
  const isHuman = message.role === MessageRole.HUMAN

  return (
    <div className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[75%] space-y-1 ${isUser ? 'order-1' : 'order-2'}`}>
        <div className={`px-3.5 py-2 rounded-[10px] text-[13px] leading-relaxed ${
          isUser
            ? 'bg-[var(--card)] text-[var(--ink)] border border-[var(--line)]'
            : isAssistant
              ? 'bg-[var(--blue-solid)] text-[var(--on-blue)] border border-[var(--blue-solid)]'
              : 'bg-[var(--ink)] text-[var(--bg)] border border-[var(--ink)]'
        }`}>
          {message.content}
        </div>
        <p className={`microlabel px-0.5 tabular ${isUser ? 'text-left' : 'text-right'}`}>
          {isAssistant ? 'IA' : isHuman ? 'Agente' : 'Paciente'} · {new Date(message.sent_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

function ContactInfoItem({
  label,
  value,
  mono = false,
  breakAll = false,
  muted = false,
}: {
  label: string
  value?: string
  mono?: boolean
  breakAll?: boolean
  muted?: boolean
}) {
  return (
    <div className="flex flex-col gap-[3px]">
      <span className="microlabel">{label}</span>
      <span
        {...(mono ? { 'data-mono': true } : {})}
        className={`text-[13px] ${muted ? 'text-[var(--muted)]' : 'text-[var(--ink)]'} ${breakAll ? 'break-all' : ''}`}
      >
        {value || '-'}
      </span>
    </div>
  )
}
