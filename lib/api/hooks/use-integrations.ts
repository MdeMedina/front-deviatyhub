import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { IIntegration, IntegrationType, IIntegrationTestResponse } from '@/lib/types'

export interface IIntegrationField {
  key: string
  label: string
  type: 'text' | 'password'
  required: boolean
  configured: boolean
  value: string
}

export interface IIntegrationDetails {
  type: IntegrationType
  connected: boolean
  last_tested_at: string | null
  last_test_ok: boolean | null
  fields: IIntegrationField[]
}

export const useIntegrations = () => {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: () => apiClient.get<IIntegration[]>(ENDPOINTS.integrations.list),
  })
}

export const useIntegrationDetails = (type: IntegrationType | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['integrations', type],
    queryFn: () => apiClient.get<IIntegrationDetails>(ENDPOINTS.integrations.detail(type!)),
    enabled: enabled && !!type,
  })
}

export const useSaveIntegration = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ type, credentials }: { type: IntegrationType; credentials: Record<string, string> }) =>
      apiClient.put<{ success: boolean; message: string }>(ENDPOINTS.integrations.save(type), credentials),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      queryClient.invalidateQueries({ queryKey: ['integrations', variables.type] })
    },
  })
}

export const useTestIntegration = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (type: IntegrationType) =>
      apiClient.post<IIntegrationTestResponse>(ENDPOINTS.integrations.test(type), {}),
    onSuccess: (_, type) => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      queryClient.invalidateQueries({ queryKey: ['integrations', type] })
    },
  })
}

