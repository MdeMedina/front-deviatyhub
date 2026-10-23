'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import { 
  IAppointment, 
  IAppointmentDetail, 
  IApiResponse, 
  IPaginatedResponse,
  AppointmentStatus 
} from '@/lib/types'

interface UseAppointmentsParams {
  startDate?: string
  endDate?: string
  status?: AppointmentStatus
  doctorId?: string
  page?: number
  limit?: number
}

/**
 * Hook to fetch a list of appointments with optional filtering.
 */
export const useAppointments = (params: UseAppointmentsParams = {}) => {
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: async () => {
      // Build query string manually or use URLSearchParams
      const query = new URLSearchParams()
      if (params.startDate) query.append('startDate', params.startDate)
      if (params.endDate) query.append('endDate', params.endDate)
      if (params.status) query.append('status', params.status)
      if (params.doctorId) query.append('doctorId', params.doctorId)
      if (params.page) query.append('page', params.page.toString())
      if (params.limit) query.append('limit', params.limit.toString())

      const queryString = query.toString()
      const url = `${ENDPOINTS.agenda.appointments}${queryString ? `?${queryString}` : ''}`
      
      // apiClient ya devuelve el contenido de "data" del sobre, y este endpoint
      // responde un array plano (no viene paginado).
      return apiClient.get<IAppointment[]>(url)
    }
  })
}

/**
 * Hook to fetch full details of a specific appointment.
 */
export const useAppointmentDetail = (id: string | null) => {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: async () => {
      if (!id) throw new Error('Appointment ID is required')
      return apiClient.get<IAppointmentDetail>(ENDPOINTS.agenda.byId(id))
    },
    enabled: !!id
  })
}

/**
 * Hook to update the status of an appointment (e.g., CONFIRMED, CANCELLED).
 */
export const useUpdateAppointmentStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string, status: AppointmentStatus }) => {
      return apiClient.patch<any>(ENDPOINTS.agenda.status(id), { status })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['appointment', variables.id] })
    }
  })
}

/**
 * Hook to reschedule an appointment.
 */
export const useRescheduleAppointment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, scheduled_at }: { id: string, scheduled_at: string }) => {
      return apiClient.patch<any>(ENDPOINTS.agenda.reschedule(id), { scheduled_at })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['appointment', variables.id] })
    }
  })
}

// ─── Coordinación con Dentalink ─────────────────────────────────────

export interface CoordinationItem {
  id: string
  code: string | null
  action: 'crear' | 'mover' | 'anular'
  status: string
  scheduled_at: string
  duration_min: number
  source: 'AGENT' | 'HUMAN' | 'EXTERNAL'
  doctor: string | null
  treatment: string | null
  patient: string | null
  phone: string | null
  rut: string | null
  conversation_id: string | null
  updated_at: string | null
}

export interface CoordinationData {
  enabled: boolean
  last_sync: { at: string; ok: boolean; error?: string | null } | null
  items: CoordinationItem[]
}

/** Lo agendado, movido o anulado desde Dentral que falta repetir en Dentalink. */
export const useCoordination = () =>
  useQuery({
    queryKey: ['coordination'],
    queryFn: () => apiClient.get<CoordinationData>(ENDPOINTS.agenda.coordination),
    refetchInterval: 60_000,
  })

export const useCoordinationActions = () => {
  const qc = useQueryClient()
  const refrescar = () => {
    qc.invalidateQueries({ queryKey: ['coordination'] })
    qc.invalidateQueries({ queryKey: ['appointments'] })
  }
  return {
    marcar: useMutation({
      mutationFn: (id: string) => apiClient.post(ENDPOINTS.agenda.coordinated(id), {}),
      onSuccess: refrescar,
    }),
    sincronizar: useMutation({
      mutationFn: () => apiClient.post(ENDPOINTS.agenda.coordinationSync, {}),
      onSuccess: refrescar,
    }),
  }
}
