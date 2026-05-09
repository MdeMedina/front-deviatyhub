'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { socketClient } from '../socket-client'
import type { 
  ISocketConversationMessage, 
  ISocketConversationNew, 
  ISocketStatusChanged,
  ISocketActionExecuted
} from '@/lib/types'

export const useConversationSocketListeners = () => {
  const queryClient = useQueryClient()

  useEffect(() => {
    // New message in a conversation
    const handleMessage = (payload: ISocketConversationMessage) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', payload.conversation_id] })
      // Also invalidate the list to update "last message" snippet
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    }

    // New conversation started
    const handleNewConversation = (payload: ISocketConversationNew) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    }

    // Status changed (e.g. Taken over by human)
    const handleStatusChanged = (payload: ISocketStatusChanged) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['conversation', payload.conversation_id] })
    }

    // AI Agent executed an action (e.g. Scheduled an appointment)
    const handleActionExecuted = (payload: ISocketActionExecuted) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', payload.conversation_id] })
      if (payload.appointment_id) {
        queryClient.invalidateQueries({ queryKey: ['appointments'] })
      }
    }

    // Register listeners
    socketClient.on('conversation.message', handleMessage)
    socketClient.on('conversation.new', handleNewConversation)
    socketClient.on('conversation.status_changed', handleStatusChanged)
    socketClient.on('conversation.action_executed', handleActionExecuted)

    // Cleanup listeners on unmount
    return () => {
      socketClient.off('conversation.message', handleMessage)
      socketClient.off('conversation.new', handleNewConversation)
      socketClient.off('conversation.status_changed', handleStatusChanged)
      socketClient.off('conversation.action_executed', handleActionExecuted)
    }
  }, [queryClient])
}
