'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { 
  IPaginatedResponse, 
  IConversationListItem, 
  IConversationDetail,
  ConversationFilters 
} from '@/lib/types'

export const useConversations = (filters: ConversationFilters = {}) => {
  return useQuery({
    queryKey: ['conversations', filters],
    queryFn: () => 
      apiClient.get<IPaginatedResponse<IConversationListItem>>(
        ENDPOINTS.conversations.list,
        { params: filters }
      ),
    refetchInterval: 30000, // 30s polling fallback
    staleTime: 10000,
  })
}

export const useConversationDetail = (id: string) => {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: () => 
      apiClient.get<IConversationDetail>(
        ENDPOINTS.conversations.byId(id)
      ),
    enabled: !!id,
    staleTime: 5000,
  })
}

export const useTakeover = (conversationId: string) => {
  const queryClient = useQueryClient()

  const takeover = useMutation({
    mutationFn: () => 
      apiClient.post(ENDPOINTS.conversations.takeover(conversationId), {}),
    onSuccess: () => 
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] })
  })

  const release = useMutation({
    mutationFn: () => 
      apiClient.post(ENDPOINTS.conversations.release(conversationId), {}),
    onSuccess: () => 
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] })
  })

  const sendMessage = useMutation({
    mutationFn: (content: string) =>
      apiClient.post(ENDPOINTS.conversations.message(conversationId), { content }),
    onSuccess: () => 
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] })
  })

  return { takeover, release, sendMessage }
}
