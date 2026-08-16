import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import {
  IClinicConfig,
  IClinicSchedule,
  IUnavailabilityBlock,
  IPolicy,
  IDoctor,
  ITreatment,
  IEncyclopediaEntry,
  ITreatmentOffer
} from '@/lib/types'

// ==========================================
// 1. CONFIGURACIÓN GENERAL & HORARIOS
// ==========================================

export const useClinicConfig = () => {
  return useQuery({
    queryKey: ['clinic', 'config'],
    queryFn: () => apiClient.get<IClinicConfig>(ENDPOINTS.clinic.config),
  })
}

export const useUpdateClinicConfig = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<IClinicConfig>) =>
      apiClient.patch<IClinicConfig>(ENDPOINTS.clinic.config, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic', 'config'] })
    },
  })
}

export const useClinicSchedules = () => {
  return useQuery({
    queryKey: ['clinic', 'schedules'],
    queryFn: () => apiClient.get<IClinicSchedule[]>(ENDPOINTS.clinic.schedules),
  })
}

export const useUpdateSchedules = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (schedules: IClinicSchedule[]) =>
      apiClient.put<IClinicSchedule[]>(ENDPOINTS.clinic.schedules, schedules),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic', 'schedules'] })
    },
  })
}

export const useUnavailability = () => {
  return useQuery({
    queryKey: ['clinic', 'unavailability'],
    queryFn: () => apiClient.get<IUnavailabilityBlock[]>(ENDPOINTS.clinic.unavailability),
  })
}

export const useCreateUnavailability = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Omit<IUnavailabilityBlock, 'id'>) =>
      apiClient.post<IUnavailabilityBlock>(ENDPOINTS.clinic.unavailability, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic', 'unavailability'] })
    },
  })
}

export const useUpdateUnavailability = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: IUnavailabilityBlock) =>
      apiClient.put<IUnavailabilityBlock>(ENDPOINTS.clinic.unavailabilityById(id), body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic', 'unavailability'] })
    },
  })
}

export const useDeleteUnavailability = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(ENDPOINTS.clinic.unavailabilityById(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic', 'unavailability'] })
    },
  })
}

// ==========================================
// 2. POLÍTICAS DE SERVICIO
// ==========================================

export const usePolicies = () => {
  return useQuery({
    queryKey: ['clinic', 'policies'],
    queryFn: () => apiClient.get<IPolicy[]>(ENDPOINTS.clinic.policies),
  })
}

export const useCreatePolicy = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Omit<IPolicy, 'id'>) =>
      apiClient.post<IPolicy>(ENDPOINTS.clinic.policies, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic', 'policies'] })
    },
  })
}

export const useUpdatePolicy = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: IPolicy) =>
      apiClient.put<IPolicy>(ENDPOINTS.clinic.policyById(id), body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic', 'policies'] })
    },
  })
}

export const useDeletePolicy = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(ENDPOINTS.clinic.policyById(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic', 'policies'] })
    },
  })
}

// ==========================================
// 3. DOCTORES / ESPECIALISTAS
// ==========================================

export const useDoctors = () => {
  return useQuery({
    queryKey: ['doctors'],
    queryFn: () => apiClient.get<IDoctor[]>(ENDPOINTS.doctors.list),
  })
}

export const useCreateDoctor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Omit<IDoctor, 'id'>) =>
      apiClient.post<IDoctor>(ENDPOINTS.doctors.list, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      queryClient.invalidateQueries({ queryKey: ['treatments'] })
      queryClient.invalidateQueries({ queryKey: ['treatment'] })
    },
  })
}

export const useUpdateDoctor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: IDoctor) =>
      apiClient.put<IDoctor>(ENDPOINTS.doctors.byId(id), body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      queryClient.invalidateQueries({ queryKey: ['doctor', data.id] })
      queryClient.invalidateQueries({ queryKey: ['treatments'] })
      queryClient.invalidateQueries({ queryKey: ['treatment'] })
    },
  })
}

export const useDeleteDoctor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(ENDPOINTS.doctors.byId(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      queryClient.invalidateQueries({ queryKey: ['treatments'] })
      queryClient.invalidateQueries({ queryKey: ['treatment'] })
    },
  })
}

// ==========================================
// 4. TRATAMIENTOS & ARANCELES
// ==========================================

export const useTreatments = () => {
  return useQuery({
    queryKey: ['treatments'],
    queryFn: () => apiClient.get<ITreatment[]>(ENDPOINTS.treatments.list),
  })
}

export const useTreatmentDetail = (id: string) => {
  return useQuery({
    queryKey: ['treatment', id],
    queryFn: () => apiClient.get<ITreatment>(ENDPOINTS.treatments.byId(id)),
    enabled: !!id,
  })
}

export const useCreateTreatment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Omit<ITreatment, 'id' | 'offers'>) =>
      apiClient.post<ITreatment>(ENDPOINTS.treatments.list, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments'] })
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      queryClient.invalidateQueries({ queryKey: ['doctor'] })
    },
  })
}

export const useUpdateTreatment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: Omit<ITreatment, 'offers'>) =>
      apiClient.put<ITreatment>(ENDPOINTS.treatments.byId(id), body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['treatments'] })
      queryClient.invalidateQueries({ queryKey: ['treatment', data.id] })
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      queryClient.invalidateQueries({ queryKey: ['doctor'] })
    },
  })
}

export const useDeleteTreatment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(ENDPOINTS.treatments.byId(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments'] })
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      queryClient.invalidateQueries({ queryKey: ['doctor'] })
    },
  })
}

// ==========================================
// 5. ENCICLOPEDIA BASE
// ==========================================

export const useEncyclopedia = () => {
  return useQuery({
    queryKey: ['encyclopedia'],
    queryFn: () => apiClient.get<IEncyclopediaEntry[]>(ENDPOINTS.treatments.encyclopedia),
  })
}

// ==========================================
// 6. PROMOCIONES Y OFERTAS TEMPORALES
// ==========================================

export const useCreateOffer = (treatmentId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Omit<ITreatmentOffer, 'id'>) =>
      apiClient.post<ITreatmentOffer>(ENDPOINTS.treatments.offers(treatmentId), body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments'] })
      queryClient.invalidateQueries({ queryKey: ['treatment', treatmentId] })
    },
  })
}

export const useDeleteOffer = (treatmentId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (offerId: string) =>
      apiClient.delete<void>(ENDPOINTS.treatments.offer(treatmentId, offerId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments'] })
      queryClient.invalidateQueries({ queryKey: ['treatment', treatmentId] })
    },
  })
}
