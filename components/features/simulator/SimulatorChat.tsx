'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Wrench } from 'lucide-react'
import { useSimulator } from '@/lib/api/hooks/use-simulator'
import { Spinner } from '@/components/ui/Spinner'

interface ChatMessage {
  id: string
  sender: 'user' | 'agent'
  content: string
  timestamp: Date
  toolsUsed?: string[]
}

export interface SimulatorChatProps {
  /** Cambia este valor (desde la cabecera de página) para reiniciar la sesión. */
  resetNonce?: number
}

export const SimulatorChat: React.FC<SimulatorChatProps> = ({ resetNonce = 0 }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState('')

  const scrollRef = useRef<HTMLDivElement>(null)
  const userJustSent = useRef(false)
  const prevReset = useRef(resetNonce)

  const { sendMessage, resetSession, sessionId } = useSimulator()

  // Reset driven from the page header
  useEffect(() => {
    if (resetNonce !== prevReset.current) {
      prevReset.current = resetNonce
      setMessages([])
      if (typeof resetSession === 'function') {
        resetSession()
      } else if ((resetSession as any)?.mutate) {
        (resetSession as any).mutate()
      }
    }
  }, [resetNonce, resetSession])

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
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    userJustSent.current = true
    setMessageInput('')

    sendMessage.mutate(trimmedMessage as any, {
      onSuccess: (data: any) => {
        const agentMsg: ChatMessage = {
          id: `agent-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          sender: 'agent',
          content: data.response || data.reply || '',
          timestamp: new Date(),
          toolsUsed: data.tools_used || [],
        }
        setMessages((prev) => [...prev, agentMsg])
      },
      onError: () => {
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          sender: 'agent',
          content: 'Error: No se pudo procesar la respuesta del simulador.',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMsg])
      },
    })
  }

  const suggestions = [
    '¿Cuáles son los horarios de atención?',
    'Quiero agendar una cita para mañana',
    '¿Qué tratamientos ofrecen?',
  ]

  // Count tools invoked
  const allTools = messages.flatMap((m) => m.toolsUsed || [])
  const toolCounts = allTools.reduce((acc, t) => {
    acc[t] = (acc[t] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const toolEntries = Object.entries(toolCounts)

  const started = messages.length > 0

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '20px', alignItems: 'start' }}>
      {/* Left Card: Test session */}
      <div data-card style={{ height: '520px', display: 'flex', flexDirection: 'column' }}>
        {/* Header: title + session id */}
        <div data-hd>
          <h2>Sesión de prueba</h2>
          <span data-lbl>{sessionId || 'sess_local'}</span>
        </div>

        {/* Message Thread */}
        <div
          ref={scrollRef}
          data-testid="chat-messages"
          style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--surface)' }}
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
                  style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: isUser ? 'flex-end' : 'flex-start' }}
                >
                  <div
                    style={{
                      maxWidth: '78%',
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
                  </div>
                  {!isUser && msg.toolsUsed && msg.toolsUsed.length > 0 && (
                    <span data-testid="tools-badges" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {msg.toolsUsed.map((tool, idx) => (
                        <span key={idx} data-badge style={{ fontSize: '10.5px', padding: '2px 7px', background: 'var(--card)' }}>
                          {tool}
                        </span>
                      ))}
                    </span>
                  )}
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
          style={{ padding: '14px 18px', borderTop: '1px solid var(--line)', background: 'var(--card)', display: 'flex', gap: '9px' }}
        >
          <input
            data-inp
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Escribe como si fueras un paciente..."
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

      {/* Right Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Tools invoked */}
        <div data-card>
          <div data-hd>
            <h2>Herramientas invocadas</h2>
          </div>
          <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {toolEntries.length === 0 ? (
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--muted)' }}>
                Aún no se han invocado herramientas en esta sesión.
              </p>
            ) : (
              toolEntries.map(([tool, count]) => (
                <div key={tool} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>{tool}</span>
                  <span data-mono style={{ fontSize: '12.5px', color: 'var(--ink)' }}>{count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Session context */}
        <div data-card>
          <div data-hd>
            <h2>Contexto de la sesión</h2>
          </div>
          <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>Paso actual</span>
              <span data-badge style={{ fontSize: '10.5px' }}>{started ? 'ESPERANDO_HORARIO' : 'IDLE'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>Canal simulado</span>
              <span data-badge style={{ fontSize: '10.5px' }}>WHATSAPP</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>Latencia media</span>
              <span data-mono style={{ fontSize: '12.5px', color: 'var(--ink)' }}>840 ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
