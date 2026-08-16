'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, User, Bot, UserCog, AlertCircle, RefreshCcw, Hand, MessageSquare } from 'lucide-react'
import { useConversationDetail, useTakeover } from '@/lib/api/hooks/use-conversations'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ConversationDetailProps {
  conversationId: string | null
}

export const ConversationDetail: React.FC<ConversationDetailProps> = ({ conversationId }) => {
  const [messageInput, setMessageInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const { hasPermission } = useAuthStore()
  const canTakeover = hasPermission('conversations.takeover')

  const { data, isLoading, isError, refetch } = useConversationDetail(conversationId || '')
  const { takeover, release, sendMessage } = useTakeover(conversationId || '')

  const conversation = data

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [conversation?.messages])

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50/50">
        <EmptyState 
          title="Ninguna conversación seleccionada"
          description="Selecciona una conversación del panel izquierdo para ver el detalle y tomar acción."
          icon={<MessageSquare size={48} className="text-slate-200" />}
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <Spinner size="lg" label="Cargando detalles..." />
      </div>
    )
  }

  if (isError || !conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white space-y-4">
        <RefreshCcw size={32} className="text-red-500" />
        <h3 className="font-bold text-slate-800">Error al cargar</h3>
        <p className="text-sm text-slate-500">No pudimos cargar esta conversación.</p>
        <Button onClick={() => refetch()} variant="secondary" size="sm">Reintentar</Button>
      </div>
    )
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || sendMessage.isPending) return
    sendMessage.mutate(messageInput.trim(), {
      onSuccess: () => setMessageInput(''),
    })
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-100 shadow-sm z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {conversation.contact?.name || conversation.contact?.phone || 'Contacto Desconocido'}
            <Badge 
              label={conversation.channel} 
              variant={conversation.channel === 'WHATSAPP' ? 'success' : 'purple'} 
              size="sm" 
            />
          </h2>
          {conversation.contact?.email && (
            <p className="text-sm text-slate-500 mt-1">{conversation.contact.email}</p>
          )}
        </div>
        
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
          <span className="text-sm font-semibold text-slate-600">Estado:</span>
          {conversation.status === 'OPEN' ? (
            <Badge label="Atendiendo IA" variant="success" icon={<Bot size={14} />} dot />
          ) : conversation.status === 'HUMAN_TAKEOVER' ? (
            <Badge label="Control Humano" variant="warning" icon={<UserCog size={14} />} dot />
          ) : (
            <Badge label="Cerrada" variant="neutral" />
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 custom-scrollbar"
      >
        {conversation.messages?.length === 0 ? (
          <div className="text-center text-slate-400 py-10 text-sm">
            No hay mensajes en el historial.
          </div>
        ) : (
          conversation.messages?.map((msg, index) => {
            const isUser = msg.role === 'USER'
            const isAI = msg.role === 'ASSISTANT'
            const isHuman = msg.role === 'HUMAN'

            return (
              <div key={msg.id || index} className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white ${
                  isUser ? 'bg-indigo-500' : isAI ? 'bg-emerald-500' : 'bg-amber-500'
                }`}>
                  {isUser ? <User size={14} /> : isAI ? <Bot size={14} /> : <UserCog size={14} />}
                </div>

                <div className={`max-w-[70%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl ${
                    isUser 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : isAI 
                        ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm' 
                        : 'bg-amber-50 border border-amber-100 text-amber-900 rounded-tl-none shadow-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 font-medium px-1">
                    {msg.sent_at ? format(new Date(msg.sent_at), 'HH:mm', { locale: es }) : ''}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Control Footer */}
      <div className="p-6 border-t border-slate-100 bg-white">
        {conversation.status === 'OPEN' ? (
          <div className="flex flex-col items-center justify-center bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 text-center">
            <Bot size={32} className="text-indigo-400 mb-3" />
            <h4 className="font-semibold text-slate-800 mb-1">El Agente de IA está atendiendo</h4>
            <p className="text-sm text-slate-500 mb-4 max-w-md">
              La inteligencia artificial está conversando con el paciente. Puedes tomar el control si necesitas intervenir manualmente.
            </p>
            {canTakeover && (
              <Button 
                onClick={() => takeover.mutate()} 
                loading={takeover.isPending}
                icon={<Hand size={18} />}
              >
                Tomar Control Manual
              </Button>
            )}
          </div>
        ) : conversation.status === 'HUMAN_TAKEOVER' ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-semibold text-amber-600 flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-md">
                <UserCog size={14} /> Estás al mando de la conversación
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => release.mutate()}
                loading={release.isPending}
                className="text-slate-500 hover:text-slate-700"
              >
                Liberar control a la IA
              </Button>
            </div>
            
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <div className="flex-1">
                <Input
                  value={messageInput}
                  onChange={setMessageInput}
                  placeholder="Escribe un mensaje..."
                  disabled={sendMessage.isPending || release.isPending}
                />
              </div>
              <Button 
                type="submit" 
                disabled={!messageInput.trim() || sendMessage.isPending || release.isPending}
                loading={sendMessage.isPending}
                icon={<Send size={18} />}
                className="px-8"
              >
                Enviar
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex items-center justify-center p-4 bg-slate-50 rounded-xl text-slate-500 text-sm gap-2">
            <AlertCircle size={16} />
            Esta conversación ha sido cerrada y archivada.
          </div>
        )}
      </div>
    </div>
  )
}
