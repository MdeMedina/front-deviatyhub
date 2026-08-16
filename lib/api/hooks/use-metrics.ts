import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { IMetricsSummary } from '@/lib/types'

export type MetricsPeriod = '1d' | '7d' | '30d'

export const useMetrics = (period: MetricsPeriod) => {
  return useQuery({
    queryKey: ['metrics', period],
    queryFn: () =>
      apiClient.get<IMetricsSummary>(ENDPOINTS.metrics.summary, {
        params: { period }
      }),
    staleTime: 60000, // Metrics don't change every second
    refetchInterval: 300000, // Refetch every 5 minutes
  })
}
