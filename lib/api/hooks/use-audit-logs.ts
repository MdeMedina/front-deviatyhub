import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { IAuditLog, AuditLogPeriod } from '@/lib/types'

export const useAuditLogs = (period: AuditLogPeriod) => {
  return useQuery({
    queryKey: ['security', 'audit-logs', period],
    queryFn: () =>
      apiClient.get<IAuditLog[]>(ENDPOINTS.security.auditLogs, {
        params: { period },
      }),
  })
}
