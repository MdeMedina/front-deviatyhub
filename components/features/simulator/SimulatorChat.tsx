'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Trash2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { useSimulator } from '@/lib/api/hooks/use-simulator'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ChatMessage {
  id: string
  sender: 'user' | 'agent'
  content: string
  timestamp: Date
  toolsUsed?: string[]
}

const CollapsibleTools: React.FC<{ tools: string[] }> = ({ tools }) => {
  const [isOpen, setIsOpen] = useState(false)

  if (!tools || tools.length === 0) return null

  return (
    <div className="mt-2.5 border-t border-slate-100/80 pt-2 w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="btn-toggle-tools"
        className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-wider"
      >
        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        <span>{isOpen ? 'Ocultar herramientas' : `Herramientas utilizadas (${tools.length})`}</span>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            data-testid="tools-list"
            className="mt-2 flex flex-wrap gap-1.5 overflow-hidden"
          >
            {tools.map((tool, idx) => (
              <Badge key={idx} label={tool} variant="info" size="sm" />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const SimulatorChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const userJustSent = useRef(false)

  const { sendMessage, resetSession } = useSimulator()

  // Handle smart scrolling
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    if (userJustSent.current) {
      container.scrollTop = container.scrollHeight
      userJustSent.current = false
    } else {
      // Agent message or typing indicator arrived.
      // Scroll to bottom only if the user is already near the bottom (threshold of 250px)
      const offset = container.scrollHeight - container.scrollTop - container.clientHeight
      if (offset <= 250) {
        container.scrollTop = container.scrollHeight
      }
    }
  }, [messages, sendMessage.isPending])

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    const trimmedMessage = messageInput.trim()
    if (!trimmedMessage || sendMessage.isPending) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      sender: 'user',
      content: trimmedMessage,
      timestamp: new Date()
    }

    setMessages((prev) => [...prev, userMsg])
    userJustSent.current = true
    setMessageInput('')

    sendMessage.mutate(trimmedMessage, {
      onSuccess: (data) => {
        const agentMsg: ChatMessage = {
          id: `agent-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          sender: 'agent',
          content: data.response,
          timestamp: new Date(),
          toolsUsed: data.tools_used
        }
        setMessages((prev) => [...prev, agentMsg])
      },
      onError: (err: any) => {
        const errMsg: ChatMessage = {
          id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          sender: 'agent',
          content: `Error de Simulación: ${err?.message || 'Ocurrió un error al procesar el mensaje.'}`,
          timestamp: new Date(),
          toolsUsed: []
        }
        setMessages((prev) => [...prev, errMsg])
      }
    })
  }

  const handleResetConversation = () => {
    resetSession()
    setMessages([])
    setMessageInput('')
  }

  const handleSuggestionClick = (suggestion: string) => {
    setMessageInput(suggestion)
  }

  const suggestions = [
    '¿Tienen horas disponibles para hoy?',
    'Quiero agendar una limpieza dental',
    '¿Qué precios tienen para ortodoncia?',
    '¿Atienden por Fonasa o Isapre?'
  ]

  return (
    <div className="flex flex-col bg-white border border-slate-100 rounded-3xl h-[calc(100vh-14rem)] min-h-[500px] shadow-sm overflow-hidden">
      {/* Top Banner / Actions Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Simulación del Agente</h2>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">Entorno de pruebas interactivo</p>
          </div>
        </div>

        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetConversation}
            data-testid="btn-new-conversation"
            icon={<Trash2 size={14} />}
            className="text-xs py-1.5"
          >
            Nueva conversación
          </Button>
        )}
      </div>

      {/* Chat Messages viewport */}
      <div
        ref={scrollRef}
        data-testid="chat-messages"
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20 custom-scrollbar"
      >
        {messages.length === 0 && !sendMessage.isPending ? (
          <div className="h-full flex flex-col justify-center">
            <EmptyState
              title="Inicia una simulación"
              description="Escribe un mensaje abajo o selecciona una de las sugerencias para probar cómo responderá tu agente de IA."
              icon={<Bot size={44} className="text-indigo-400" />}
              className="py-4"
            />
            
            <div className="max-w-md mx-auto w-full px-6 -mt-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">Sugerencias:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="p-3 text-left text-xs font-medium text-slate-600 bg-white hover:bg-indigo-50/40 border border-slate-100 hover:border-indigo-100 rounded-xl transition-all duration-200 shadow-sm active:scale-[0.98]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isUser = msg.sender === 'user'
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    data-testid={`message-${msg.sender}`}
                    className={`flex gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div className={`flex-shrink-0 w-8.5 h-8.5 rounded-full flex items-center justify-center text-white ${
                      isUser ? 'bg-gradient-to-tr from-indigo-500 to-indigo-600' : 'bg-gradient-to-tr from-slate-600 to-slate-700'
                    }`}>
                      {isUser ? <User size={14} /> : <Bot size={14} />}
                    </div>

                    <div className={`max-w-[75%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4.5 py-3 rounded-2xl shadow-sm ${
                        isUser
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none'
                          : 'bg-white border border-slate-150 text-slate-700 rounded-tl-none'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        
                        {!isUser && msg.toolsUsed && (
                          <CollapsibleTools tools={msg.toolsUsed} />
                        )}
                      </div>
                      
                      <span className="text-[10px] text-slate-400 mt-1 font-semibold px-1">
                        {format(msg.timestamp, 'HH:mm', { locale: es })}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Simulated typing status */}
            {sendMessage.isPending && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                data-testid="typing-indicator"
                className="flex gap-3.5 flex-row"
              >
                <div className="flex-shrink-0 w-8.5 h-8.5 rounded-full flex items-center justify-center text-white bg-gradient-to-tr from-slate-600 to-slate-700">
                  <Bot size={14} />
                </div>
                <div className="flex flex-col items-start">
                  <div className="px-5 py-3 bg-white border border-slate-150 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Input area footer panel */}
      <div className="p-4 md:p-6 border-t border-slate-100 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="flex gap-3 items-end"
        >
          <div className="flex-1">
            <Input
              value={messageInput}
              onChange={setMessageInput}
              placeholder="Escribe un mensaje de prueba para el agente..."
              disabled={sendMessage.isPending}
              data-testid="chat-input"
            />
          </div>
          
          <Button
            type="submit"
            disabled={!messageInput.trim() || sendMessage.isPending}
            loading={sendMessage.isPending}
            icon={<Send size={16} />}
            data-testid="chat-send-btn"
            className="px-6 h-[46px] shrink-0"
          >
            Enviar
          </Button>
        </form>
      </div>
    </div>
  )
}
