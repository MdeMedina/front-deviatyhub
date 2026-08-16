'use client'

import React, { useState } from 'react'
import { Search, MessageSquare, Camera, RefreshCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useConversations } from '@/lib/api/hooks/use-conversations'
import { useConversationSocketListeners } from '@/lib/socket/hooks/use-socket-listeners'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ConversationListProps {
  onSelect: (id: string) => void
  selectedId?: string | null
}

export const ConversationList: React.FC<ConversationListProps> = ({ onSelect, selectedId }) => {
  const [statusFilter, setStatusFilter] = useState<string>('OPEN')
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading, isError, refetch } = useConversations({ 
    status: statusFilter as any,
  })

  useConversationSocketListeners()

  const conversations = data?.data || []

  const filteredConversations = conversations.filter(conv => 
    conv.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderStatusTabs = () => {
    const tabs = [
      { id: 'OPEN', label: 'Abiertas' },
      { id: 'HUMAN_TAKEOVER', label: 'En curso' },
      { id: 'CLOSED', label: 'Cerradas' },
    ]

    return (
      <div className="flex gap-2 p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
              statusFilter === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <div className="p-4 bg-red-50 rounded-full text-red-500">
          <RefreshCcw size={32} />
        </div>
        <h3 className="font-bold text-slate-800">Error de conexión</h3>
        <Button onClick={() => refetch()} variant="secondary" size="sm">
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-100 overflow-hidden">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Mensajes</h2>
          <Badge label={`${conversations.length}`} variant="purple" size="sm" />
        </div>
        <Input
          placeholder="Buscar contacto..."
          value={searchQuery}
          onChange={(val) => setSearchQuery(val)}
          leftIcon={<Search size={18} className="text-slate-400" />}
        />
      </div>

      {renderStatusTabs()}

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Spinner size="lg" label="Cargando chats..." />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="py-12">
            <EmptyState 
              title="No hay conversaciones" 
              description={searchQuery ? 'Prueba con otros términos' : 'Las nuevas consultas aparecerán aquí'}
              icon={<MessageSquare size={48} className="text-slate-200" />}
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            <AnimatePresence mode="popLayout">
              {filteredConversations.map((conv) => (
                <motion.button
                  key={conv.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => onSelect(conv.id)}
                  className={`w-full p-4 flex gap-4 text-left transition-colors hover:bg-slate-50 relative ${
                    selectedId === conv.id ? 'bg-indigo-50/50' : ''
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 font-bold text-lg">
                      {conv.contact?.name?.[0] || '?'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-lg shadow-sm border border-slate-100">
                      {conv.channel === 'WHATSAPP' ? (
                        <MessageSquare size={12} className="text-emerald-500 fill-emerald-500" />
                      ) : (
                        <Camera size={12} className="text-purple-500" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-slate-800 truncate">
                        {conv.contact?.name || 'Desconocido'}
                      </h4>
                      <span className="text-[10px] font-medium text-slate-400">
                        {conv.started_at ? format(new Date(conv.started_at), 'HH:mm', { locale: es }) : ''}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 truncate leading-tight mb-2">
                      {conv.last_message?.content || 'Sin mensajes'}
                    </p>
                    <Badge 
                      label={conv.status === 'OPEN' ? 'IA' : 'Humano'} 
                      variant={conv.status === 'OPEN' ? 'success' : 'warning'} 
                      size="sm"
                      dot 
                    />
                  </div>

                  {selectedId === conv.id && (
                    <motion.div 
                      layoutId="active-chat"
                      className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-600 rounded-r-full"
                    />
                  )}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
