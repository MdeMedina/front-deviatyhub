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
      
      return apiClient.get<IPaginatedResponse<IAppointment>>(url)
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
