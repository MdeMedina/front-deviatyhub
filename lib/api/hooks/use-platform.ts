'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import { useAuthStore, type ActingClinic } from '@/lib/stores/auth.store'

export interface PlatformOverview {
  clinics: number
  active_clinics: number
  conversations_30d: number
  inbound_messages_7d: number
  agent_appointments_30d: number
  human_takeovers_30d: number
}

export interface PlatformClinicRow {
  id: string
  name: string
  slug: string
  plan: 'STARTER' | 'PRO'
  active: boolean
  billing_email: string
  created_at: string | null
  agent_mode: 'AUTONOMOUS' | 'SUPERVISED' | 'PAUSED' | null
  users: number
  doctors: number
  conversations_30d: number
  agent_appointments_30d: number
  last_activity_at: string | null
  whatsapp: { configured: boolean; connected: boolean; phone_number_id: string | null }
}

export interface PlatformClinicUser {
  id: string
  email: string
  active: boolean
  role: string | null
  is_owner: boolean
  doctor: string | null
  platform_admin: boolean
  created_at: string | null
  invite_pending: boolean
  invite_expires: string | null
}

export interface PlatformClinicDetail {
  id: string
  name: string
  slug: string
  plan: 'STARTER' | 'PRO'
  active: boolean
  billing_email: string
  created_at: string | null
  config: { name: string; address: string; phone: string; email: string; timezone: string } | null
  schedules: { dayOfWeek: number; openTime: string; closeTime: string; isOpen: boolean | null }[]
  agent_mode: PlatformClinicRow['agent_mode']
  counts: { doctors: number; treatments: number; contacts: number }
  integrations: {
    type: string
    configured: boolean
    connected: boolean
    last_tested_at: string | null
    last_test_ok: boolean | null
    external_id: string | null
  }[]
  users: PlatformClinicUser[]
}

export interface CreateClinicInput {
  name: string
  slug?: string
  plan?: 'STARTER' | 'PRO'
  billingEmail: string
  adminEmail: string
  address?: string
  phone?: string
}

export interface CreateClinicResult {
  clinic: { id: string; name: string; slug: string }
  admin: { id: string; email: string }
  invite_link: string
  invite_expires: string
}

export const usePlatformOverview = () =>
  useQuery({
    queryKey: ['platform', 'overview'],
    queryFn: () => apiClient.get<PlatformOverview>(ENDPOINTS.platform.overview),
  })

export const usePlatformClinics = () =>
  useQuery({
    queryKey: ['platform', 'clinics'],
    queryFn: () => apiClient.get<PlatformClinicRow[]>(ENDPOINTS.platform.clinics),
  })

export const usePlatformClinic = (id: string) =>
  useQuery({
    queryKey: ['platform', 'clinic', id],
    queryFn: () => apiClient.get<PlatformClinicDetail>(ENDPOINTS.platform.clinic(id)),
    enabled: !!id,
  })

export const useCreateClinic = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateClinicInput) => apiClient.post<CreateClinicResult>(ENDPOINTS.platform.clinics, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform'] }),
  })
}

export const useUpdateClinic = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<{ name: string; plan: 'STARTER' | 'PRO'; active: boolean; billingEmail: string }>) =>
      apiClient.patch<PlatformClinicDetail>(ENDPOINTS.platform.clinic(id), input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform'] }),
  })
}

export const useResendInvite = (clinicId: string) =>
  useMutation({
    mutationFn: (userId: string) =>
      apiClient.post<{ invite_link: string; invite_expires: string }>(ENDPOINTS.platform.resendInvite(clinicId, userId)),
  })

/**
 * Entrar al panel de una clínica, o salir de él. Se vacía la caché de consultas
 * porque todo lo cargado era de la otra clínica: sin esto, al entrar se verían
 * un momento las conversaciones de la anterior.
 */
export const useActAsClinic = () => {
  const qc = useQueryClient()
  const router = useRouter()
  const setActingClinic = useAuthStore((s) => s.setActingClinic)

  return {
    enter: (clinic: ActingClinic) => {
      setActingClinic(clinic)
      qc.clear()
      router.push('/dashboard')
    },
    exit: (volverA = '/backoffice/clinics') => {
      setActingClinic(null)
      qc.clear()
      router.push(volverA)
    },
  }
}
