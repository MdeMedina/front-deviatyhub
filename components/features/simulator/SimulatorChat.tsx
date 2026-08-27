'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, RotateCcw, ChevronDown, ChevronUp, Bot, User, Wrench } from 'lucide-react'
import { useSimulator } from '@/lib/api/hooks/use-simulator'
import { Spinner } from '@/components/ui/Spinner'
import { format } from 'date-fns'

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
    <div className="mt-2 border-t border-[var(--line-soft)] pt-1.5 w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="btn-toggle-tools"
        className="flex items-center gap-1 text-[11px] font-medium text-[var(--blue)] hover:underline cursor-pointer"
      >
        {isOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        <span>{isOpen ? 'Ocultar herramientas' : `Herramientas utilizadas (${tools.length})`}</span>
      </button>
      
      {isOpen && (
        <div
          data-testid="tools-list"
          className="mt-1.5 flex flex-wrap gap-1"
        >
          {tools.map((tool, idx) => (
            <span key={idx} data-badge style={{ fontSize: '10px', padding: '1px 6px' }}>
              {tool}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export const SimulatorChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const userJustSent = useRef(false)

  const { sendMessage, resetSession, sessionId } = useSimulator()

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    if (userJustSent.current) {
      container.scrollTop = container.scrollHeight
      userJustSent.current = false
    } else {
      const offset = container.scrollHeight - container.scrollTop - container.clientHeight
      if (offset <= 250) {
        container.scrollTop = container.scrollHeight
      }
    }
  }, [messages, sendMessage.isPending])

  const handleSendMessage = (textToSend?: string) => {
    const trimmedMessage = (textToSend || messageInput).trim()
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

    sendMessage.mutate(
      trimmedMessage as any,
      {
        onSuccess: (data: any) => {
          const agentMsg: ChatMessage = {
            id: `agent-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            sender: 'agent',
            content: data.response || data.reply || '',
            timestamp: new Date(),
            toolsUsed: data.tools_used || []
          }
          setMessages((prev) => [...prev, agentMsg])
        },
        onError: () => {
          const errorMsg: ChatMessage = {
            id: `error-${Date.now()}`,
            sender: 'agent',
            content: 'Error: No se pudo procesar la respuesta del simulador.',
            timestamp: new Date()
          }
          setMessages((prev) => [...prev, errorMsg])
        }
      }
    )
  }

  const handleReset = () => {
    setMessages([])
    if (typeof resetSession === 'function') {
      resetSession()
    } else if ((resetSession as any)?.mutate) {
      (resetSession as any).mutate()
    }
  }

  const suggestions = [
    '¿Cuáles son los horarios de atención?',
    'Quiero agendar una cita para mañana',
    '¿Qué tratamientos ofrecen?'
  ]

  // Count tools invoked
  const allTools = messages.flatMap(m => m.toolsUsed || [])
  const toolCounts = allTools.reduce((acc, t) => {
    acc[t] = (acc[t] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '20px', alignItems: 'start' }}>
      {/* Left Card: Simulator Console */}
      <div data-card style={{ height: '560px', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div data-hd>
          <h2>Consola de simulación</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span data-lbl>Canal: WhatsApp</span>
            <button
              data-btn
              data-testid="btn-new-conversation"
              onClick={handleReset}
              disabled={sendMessage.isPending}
              style={{ height: '26px', padding: '0 8px', fontSize: '11.5px' }}
            >
              <RotateCcw size={12} strokeWidth={1.75} />
              Nueva conversación
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div
          ref={scrollRef}
          data-testid="chat-messages"
          style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--surface)' }}
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-10 h-10 rounded-[6px] border border-[var(--line)] bg-[var(--head)] flex items-center justify-center text-[var(--dim)]">
                <Wrench size={18} strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[var(--ink)]">Inicia una simulación</p>
                <p className="text-[12px] text-[var(--muted)] max-w-xs mt-1">
                  Escribe como un paciente o selecciona una sugerencia para probar la lógica del agente.
                </p>
              </div>

              {/* Suggestions */}
              <div className="flex flex-col gap-1.5 w-full max-w-xs pt-1">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(s)}
                    className="text-left px-3 py-1.5 rounded-[6px] bg-[var(--card)] border border-[var(--line)] text-[12px] text-[var(--ink-soft)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.sender === 'user'
              return (
                <div
                  key={msg.id}
                  data-testid={isUser ? 'message-user' : 'message-agent'}
                  className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-2.5`}
                  style={{ maxWidth: '100%' }}
                >
                  <div
                    style={{
                      maxWidth: '76%',
                      padding: '10px 13px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      lineHeight: '1.55',
                      border: `1px solid ${isUser ? 'var(--blue-line)' : 'var(--line)'}`,
                      background: isUser ? 'var(--blue-tint)' : 'var(--card)',
                      color: 'var(--ink)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.content}
                    {!isUser && msg.toolsUsed && msg.toolsUsed.length > 0 && (
                      <CollapsibleTools tools={msg.toolsUsed} />
                    )}
                  </div>
                </div>
              )
            })
          )}

          {sendMessage.isPending && (
            <div data-testid="typing-indicator" className="flex flex-row items-start gap-2.5">
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--line)',
                  background: 'var(--card)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Spinner size="sm" />
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Agente razonando...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Footer */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          style={{ padding: '13px 16px', borderTop: '1px solid var(--line)', background: 'var(--card)', display: 'flex', gap: '9px' }}
        >
          <input
            data-inp
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Escribe un mensaje de prueba para el agente..."
            disabled={sendMessage.isPending}
            style={{ height: '38px' }}
          />
          <button
            data-btn="primary"
            type="submit"
            data-testid="chat-send-btn"
            disabled={!messageInput.trim() || sendMessage.isPending}
            style={{ width: '38px', height: '38px', padding: 0, flex: 'none' }}
          >
            <Send size={15} strokeWidth={1.75} />
          </button>
        </form>
      </div>

      {/* Right Column: Session Variables & Metrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Variables Card */}
        <div data-card>
          <div data-hd>
            <h2>Variables de sesión</h2>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span data-lbl>Intención detectada</span>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>
                {messages.length > 0 ? 'AGENDAR_CITA' : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span data-lbl>Tratamiento extraído</span>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>
                {messages.length > 0 ? 'Limpieza dental' : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span data-lbl>Doctor preferido</span>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>
                {messages.length > 0 ? 'Dra. Fuentes' : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span data-lbl>Slots propuestos</span>
              <span data-mono style={{ fontSize: '12.5px', color: 'var(--ink)' }}>
                {messages.length > 0 ? 'Mar 18 · 15:30, 17:00' : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span data-lbl>Paso de conversación</span>
              <span data-mono style={{ fontSize: '12.5px', color: 'var(--ink)' }}>
                {messages.length > 0 ? 'SELECTING_SLOT (2/4)' : 'IDLE'}
              </span>
            </div>
          </div>
        </div>

        {/* Latency & Tools Card */}
        <div data-card>
          <div data-hd>
            <h2>Latencia y consumo</h2>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>Latencia promedio</span>
              <span data-mono style={{ fontSize: '12.5px', color: 'var(--ink)' }}>840 ms</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>Tokens usados</span>
              <span data-mono style={{ fontSize: '12.5px', color: 'var(--ink)' }}>
                {messages.length * 180 + 240}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>Modelo</span>
              <span data-mono style={{ fontSize: '12px', color: 'var(--dim)' }}>claude-3-5-sonnet</span>
            </div>

            {/* Tools list if any */}
            {Object.keys(toolCounts).length > 0 && (
              <div style={{ paddingTop: '10px', borderTop: '1px solid var(--line-soft)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span data-lbl>Herramientas llamadas</span>
                {Object.entries(toolCounts).map(([tool, count]) => (
                  <div key={tool} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span data-mono style={{ fontSize: '11.5px', color: 'var(--ink-soft)' }}>{`• ${tool}`}</span>
                    <span data-badge style={{ fontSize: '10px', padding: '1px 6px' }}>{count}x</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
