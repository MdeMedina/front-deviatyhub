'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import type { IAbsence, IAgendaAbsence, IDoctor, IScheduleBlock } from '@/lib/types'

/**
 * Ficha del profesional que corresponde a la cuenta conectada.
 * Devuelve 404 para quien no es profesional (administración), así que no se
 * reintenta: no es un fallo, es que esa persona no tiene jornada propia.
 */
export const useMyDoctorProfile = (enabled = true) => {
  return useQuery({
    queryKey: ['doctor', 'me'],
    queryFn: () => apiClient.get<IDoctor>(ENDPOINTS.doctors.me),
    enabled,
    retry: false,
  })
}

export const useDoctorSchedule = (doctorId?: string) => {
  return useQuery({
    queryKey: ['doctor-schedule', doctorId],
    queryFn: () => apiClient.get<IScheduleBlock[]>(ENDPOINTS.doctors.schedule(doctorId!)),
    enabled: !!doctorId,
  })
}

/** La jornada se envía completa y reemplaza a la anterior. */
export const useSaveDoctorSchedule = (doctorId?: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (blocks: IScheduleBlock[]) =>
      apiClient.put<IScheduleBlock[]>(ENDPOINTS.doctors.schedule(doctorId!), {
        blocks: blocks.map(({ day_of_week, start_time, end_time, active }) => ({
          day_of_week,
          start_time,
          end_time,
          active: active ?? true,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-schedule', doctorId] })
      // Las horas que se ofrecen dependen de esta jornada.
      queryClient.invalidateQueries({ queryKey: ['agenda'] })
    },
  })
}

export const useDoctorAbsences = (doctorId?: string) => {
  return useQuery({
    queryKey: ['doctor-absences', doctorId],
    queryFn: () => apiClient.get<IAbsence[]>(ENDPOINTS.doctors.absences(doctorId!)),
    enabled: !!doctorId,
  })
}

export const useCreateAbsence = (doctorId?: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { starts_at: string; ends_at: string; all_day?: boolean; reason?: string }) =>
      apiClient.post<IAbsence>(ENDPOINTS.doctors.absences(doctorId!), body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-absences', doctorId] })
      queryClient.invalidateQueries({ queryKey: ['agenda'] })
    },
  })
}

export const useDeleteAbsence = (doctorId?: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (absenceId: string) =>
      apiClient.delete<void>(ENDPOINTS.doctors.absence(doctorId!, absenceId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-absences', doctorId] })
      queryClient.invalidateQueries({ queryKey: ['agenda'] })
    },
  })
}

/**
 * Ausencias que caen dentro del rango que muestra la agenda.
 *
 * Sin esto, en pantalla no hay forma de distinguir un hueco libre de un día en
 * el que ese profesional no viene: los dos se ven en blanco.
 */
export const useAgendaAbsences = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['agenda-absences', startDate, endDate],
    queryFn: () => {
      const q = new URLSearchParams()
      if (startDate) q.append('startDate', startDate)
      if (endDate) q.append('endDate', endDate)
      return apiClient.get<IAgendaAbsence[]>(`${ENDPOINTS.agenda.absences}?${q.toString()}`)
    },
    enabled: !!startDate && !!endDate,
  })
}
