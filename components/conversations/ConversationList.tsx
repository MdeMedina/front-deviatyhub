'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, MessageSquare, Calendar, Link, Clock } from 'lucide-react'
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

  // Listen for socket events to keep list updated
  useConversationSocketListeners()

  const conversations = response?.data || []

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header & Filters */}
      <div className="p-4 border-b border-slate-100 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Chats</h2>
          <Badge variant="neutral" size="sm">{conversations.length}</Badge>
        </div>
        
        <Input 
          placeholder="Buscar contacto..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search size={16} className="text-slate-400" />}
          className="bg-slate-50/50 border-none h-10"
        />

        <div className="flex gap-1 p-1 bg-slate-50 rounded-xl overflow-x-auto no-scrollbar">
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
            label="Human"
          />
          <FilterTab 
            active={statusFilter === ConversationStatus.CLOSED} 
            onClick={() => setStatusFilter(ConversationStatus.CLOSED)}
            label="Cerrados"
          />
        </div>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-3"
            >
              <Spinner size="md" className="text-indigo-600" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando chats</span>
            </motion.div>
          ) : isError ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 text-center"
            >
              <p className="text-sm text-red-500 font-medium mb-4">Error al cargar conversaciones</p>
              <button 
                onClick={() => refetch()}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider"
              >
                Reintentar
              </button>
            </motion.div>
          ) : conversations.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-20"
            >
              <EmptyState 
                title="Sin resultados"
                description="No se encontraron conversaciones con los filtros actuales."
                icon={<MessageSquare size={48} className="text-slate-200" />}
              />
            </motion.div>
          ) : (
            <div className="divide-y divide-slate-50">
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
        </AnimatePresence>
      </div>
    </div>
  )
}

function FilterTab({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
        active 
          ? 'bg-white text-indigo-600 shadow-sm' 
          : 'text-slate-500 hover:text-slate-700'
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
  
  return (
    <motion.button
      layout
      onClick={onClick}
      className={`w-full text-left p-4 transition-all hover:bg-slate-50 group relative ${
        isActive ? 'bg-indigo-50/50' : ''
      }`}
    >
      {isActive && (
        <motion.div 
          layoutId="active-chat"
          className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600"
        />
      )}
      
      <div className="flex justify-between items-start mb-1">
        <span className="text-sm font-bold text-slate-900 truncate pr-2">
          {conversation.contact.name || 'Usuario desconocido'}
        </span>
        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap flex items-center gap-1">
          <Clock size={10} />
          {new Date(conversation.last_message?.sent_at || conversation.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <p className="text-xs text-slate-500 line-clamp-1 mb-3 group-hover:text-slate-600">
        {conversation.last_message?.content || 'Iniciando conversación...'}
      </p>

      <div className="flex items-center gap-2">
        <div className={`p-1 rounded-md ${isWhatsApp ? 'bg-emerald-50 text-emerald-600' : 'bg-pink-50 text-pink-600'}`}>
          {isWhatsApp ? <MessageSquare size={12} fill="currentColor" /> : <Link size={12} />}
        </div>
        <Badge 
          variant={
            conversation.status === ConversationStatus.OPEN ? 'info' : 
            conversation.status === ConversationStatus.HUMAN_TAKEOVER ? 'warning' : 'neutral'
          }
          size="sm"
        >
          {conversation.status}
        </Badge>
        {conversation.appointment_id && (
          <Badge variant="success" size="sm" icon={<Calendar size={10} />}>Cita</Badge>
        )}
      </div>
    </motion.button>
  )
}
