'use client'

import React, { useState } from 'react'
import { Search, MessageSquare, Calendar, Clock, MessageCircle } from 'lucide-react'
import { useConversations } from '@/lib/api/hooks/use-conversations'
import { useConversationSocketListeners } from '@/lib/socket/hooks/use-socket-listeners'
import { ConversationStatus, Channel } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'

interface ConversationListProps {
  selectedId?: string | null
  onSelect: (id: string) => void
}

export const ConversationList: React.FC<ConversationListProps> = ({ 
  selectedId, 
  onSelect 
}) => {
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: response, isLoading, isError, refetch } = useConversations({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchQuery || undefined
  })

  useConversationSocketListeners()

  const conversations = response?.data || []

  return (
    <div className="flex flex-col h-full bg-[var(--card)] border-r border-[var(--line)]">
      {/* Header & Filter Tabs */}
      <div className="p-3.5 border-b border-[var(--line)] bg-[var(--head)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[14.5px] font-semibold text-[var(--ink)] tracking-[-0.012em]">Chats</h2>
            <Badge variant="neutral" size="sm">{conversations.length}</Badge>
          </div>
        </div>
        
        <Input 
          placeholder="Buscar contacto..." 
          value={searchQuery}
          onChange={setSearchQuery}
          leftIcon={<Search size={14} />}
          className="w-full"
        />

        {/* Segmented Filter Tabs */}
        <div className="inline-flex gap-1 p-1 bg-[var(--surface-2)] border border-[var(--line)] rounded-[8px] w-full">
          <FilterTab 
            active={statusFilter === 'all'} 
            onClick={() => setStatusFilter('all')}
            label="Todos"
          />
          <FilterTab 
            active={statusFilter === ConversationStatus.OPEN} 
            onClick={() => setStatusFilter(ConversationStatus.OPEN)}
            label="Abiertos"
          />
          <FilterTab 
            active={statusFilter === ConversationStatus.HUMAN_TAKEOVER} 
            onClick={() => setStatusFilter(ConversationStatus.HUMAN_TAKEOVER)}
            label="En curso"
          />
          <FilterTab 
            active={statusFilter === ConversationStatus.CLOSED} 
            onClick={() => setStatusFilter(ConversationStatus.CLOSED)}
            label="Cerrados"
          />
        </div>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Spinner size="md" />
            <span className="microlabel text-[10px]">Cargando chats</span>
          </div>
        ) : isError ? (
          <div className="p-6 text-center">
            <p className="text-[13px] text-[var(--neg)] mb-3">Error de conexión al cargar conversaciones</p>
            <button 
              onClick={() => refetch && refetch()}
              className="text-[12px] font-medium text-[var(--blue)] hover:underline"
            >
              Reintentar
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-12">
            <EmptyState 
              title="No hay conversaciones"
              description="No se encontraron conversaciones con los filtros actuales."
              icon={<MessageSquare size={20} />}
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--line-soft)]">
            {conversations.map((conv) => (
              <ConversationItem 
                key={conv.id}
                conversation={conv}
                isActive={selectedId === conv.id}
                onClick={() => onSelect(conv.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FilterTab({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-1 text-center rounded-[6px] text-[11.5px] font-medium transition-colors cursor-pointer ${
        active 
          ? 'bg-[var(--card)] text-[var(--ink)] shadow-[0_1px_2px_rgba(20,20,25,0.05)] border border-[var(--line)]' 
          : 'text-[var(--muted)] hover:text-[var(--ink)] border border-transparent'
      }`}
    >
      {label}
    </button>
  )
}

function ConversationItem({ 
  conversation, 
  isActive, 
  onClick 
}: { 
  conversation: any, 
  isActive: boolean, 
  onClick: () => void 
}) {
  const isWhatsApp = conversation.channel === Channel.WHATSAPP
  const isHuman = conversation.status === ConversationStatus.HUMAN_TAKEOVER
  const isClosed = conversation.status === ConversationStatus.CLOSED
  const statusLabel = isHuman ? 'Humano' : isClosed ? 'Cerrado' : 'IA'
  
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3.5 transition-colors cursor-pointer relative group ${
        isActive 
          ? 'bg-[var(--blue-tint)] before:content-[""] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:bg-[var(--blue)]' 
          : 'hover:bg-[var(--surface)]'
      }`}
    >
      <div className="flex justify-between items-start mb-1">
        <span className="text-[13.5px] font-semibold text-[var(--ink)] truncate pr-2">
          {conversation.contact?.name || 'Usuario desconocido'}
        </span>
        <span className="microlabel text-[10px] whitespace-nowrap flex items-center gap-1 tabular">
          <Clock size={10} />
          {new Date(conversation.last_message?.sent_at || conversation.started_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <p className="text-[12px] text-[var(--muted)] line-clamp-1 mb-2.5">
        {conversation.last_message?.content || 'Iniciando conversación...'}
      </p>

      <div className="flex items-center gap-1.5 flex-wrap">
        <div className="w-5 h-5 rounded-[4px] border border-[var(--line)] bg-[var(--surface)] flex items-center justify-center text-[var(--muted)]">
          <MessageCircle size={10} />
        </div>
        <Badge 
          variant={isHuman ? 'warning' : isClosed ? 'neutral' : 'info'}
          size="sm"
        >
          {statusLabel}
        </Badge>
        {conversation.appointment_id && (
          <Badge variant="success" size="sm" icon={<Calendar size={10} />}>Cita</Badge>
        )}
      </div>
    </button>
  )
}
