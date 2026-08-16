import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { IAgentConfig } from '@/lib/types'

export const useAgentConfig = () => {
  return useQuery({
    queryKey: ['agent-config'],
    queryFn: () => apiClient.get<IAgentConfig>(ENDPOINTS.agentConfig),
  })
}

export const useUpdateAgentConfig = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<IAgentConfig>) =>
      apiClient.patch<IAgentConfig>(ENDPOINTS.agentConfig, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-config'] })
    },
  })
}
