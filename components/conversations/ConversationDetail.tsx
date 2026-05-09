'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, User, Phone, Mail, Link, Shield, ShieldOff, AlertCircle, Info } from 'lucide-react'
import { useConversationDetail } from '@/lib/api/hooks/use-conversations'
import { useTakeover } from '@/lib/api/hooks/use-conversations'
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
      await sendMessage.mutateAsync(messageInput)
      setMessageInput('')
    } catch (error) {
      // Error handled by global toast if configured, or we can add local handling
    }
  }

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50/30">
        <EmptyState 
          title="Selecciona un chat"
          description="Elige una conversación de la lista para ver el historial y tomar el control."
          icon={<Info size={48} className="text-slate-200" />}
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white gap-3">
        <Spinner size="lg" className="text-indigo-600" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando detalles</span>
      </div>
    )
  }

  if (isError || !conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState 
          title="Error al cargar"
          description="No pudimos obtener los detalles de esta conversación."
          icon={<AlertCircle size={48} className="text-rose-200" />}
        />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* Header */}
      <header className="p-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
            {conversation.contact.name?.charAt(0) || '?'}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{conversation.contact.name}</h3>
            <div className="flex items-center gap-2">
              <Badge variant={isHumanControl ? 'warning' : 'info'} size="sm">
                {isHumanControl ? 'Control Humano' : 'IA Atendiendo'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canTakeover && (
            isHumanControl ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => release.mutate()}
                loading={release.isPending}
                icon={<ShieldOff size={14} />}
              >
                Liberar
              </Button>
            ) : (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => takeover.mutate()}
                loading={takeover.isPending}
                icon={<Shield size={14} />}
              >
                Tomar Control
              </Button>
            )
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-50/50">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {conversation.messages.map((msg, idx) => (
              <MessageBubble key={msg.id || idx} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <footer className="p-4 bg-white border-t border-slate-100">
            {!isHumanControl ? (
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
                <Info size={18} className="text-indigo-600 shrink-0" />
                <p className="text-xs text-indigo-800 font-medium leading-relaxed">
                  El bot está manejando esta conversación. Para responder manualmente, pulsa <strong>"Tomar Control"</strong>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSend} className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea 
                    rows={1}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500/20 resize-none min-h-[44px] max-h-32 transition-all custom-scrollbar"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend(e)
                      }
                    }}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={!messageInput.trim() || sendMessage.isPending}
                  loading={sendMessage.isPending}
                  className="rounded-2xl h-11 w-11 p-0 flex items-center justify-center shrink-0"
                >
                  <Send size={18} className={messageInput.trim() ? 'translate-x-0.5' : ''} />
                </Button>
              </form>
            )}
          </footer>
        </div>

        {/* Info Sidebar */}
        <aside className="w-72 border-l border-slate-100 p-6 hidden lg:block overflow-y-auto">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Información del Contacto</h4>
          
          <div className="space-y-6">
            <ContactInfoItem icon={<User size={16} />} label="Nombre" value={conversation.contact.name} />
            <ContactInfoItem icon={<Phone size={16} />} label="Teléfono" value={conversation.contact.phone} />
            <ContactInfoItem icon={<Mail size={16} />} label="Email" value={conversation.contact.email || 'No proporcionado'} />
            <ContactInfoItem icon={<Link size={16} />} label="Instagram" value={conversation.contact.instagram_user || 'No vinculado'} />
            
            <div className="pt-6 border-t border-slate-50">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Contexto Actual</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Estado Bot</span>
                  <Badge variant="neutral" size="sm">{conversation.current_step}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Canal</span>
                  <Badge variant="purple" size="sm">{conversation.channel}</Badge>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: any }) {
  const isUser = message.role === MessageRole.USER
  const isAssistant = message.role === MessageRole.ASSISTANT
  const isHuman = message.role === MessageRole.HUMAN

  return (
    <div className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[80%] space-y-1 ${isUser ? 'order-1' : 'order-2'}`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isUser 
            ? 'bg-white text-slate-800 border border-slate-100 rounded-tl-none' 
            : isAssistant
              ? 'bg-indigo-600 text-white rounded-tr-none'
              : 'bg-amber-500 text-white rounded-tr-none'
        }`}>
          {message.content}
        </div>
        <p className={`text-[10px] font-bold text-slate-400 px-1 ${isUser ? 'text-left' : 'text-right'}`}>
          {isAssistant ? 'IA' : isHuman ? 'Agente' : 'Usuario'} • {new Date(message.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

function ContactInfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex gap-3">
      <div className="text-slate-400 mt-0.5">{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{label}</p>
        <p className="text-sm font-semibold text-slate-700 break-all">{value}</p>
      </div>
    </div>
  )
}
