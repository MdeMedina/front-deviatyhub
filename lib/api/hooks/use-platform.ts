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
  whatsapp: WhatsAppStatus
}

export interface WhatsAppStatus {
  /** 'clinic' = número propio; 'dentral' = número de Dentral asignado; 'server' = número del servidor por defecto; null = ninguno. */
  source: 'clinic' | 'dentral' | 'server' | null
  configured: boolean
  connected: boolean
  phone_number_id: string | null
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
  whatsapp: WhatsAppStatus
  access: ClinicAccess
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

export interface ClinicAccess {
  modules: Record<string, boolean>
  agent: {
    enabled: boolean
    channels: Record<string, boolean>
    actions: Record<string, boolean>
    reminders: boolean
  }
}

/** Cambio parcial: solo lo que viene se toca. */
export interface ClinicAccessPatch {
  modules?: Record<string, boolean>
  agent?: Partial<{
    enabled: boolean
    channels: Record<string, boolean>
    actions: Record<string, boolean>
    reminders: boolean
  }>
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

export interface TeamMember {
  id: string
  email: string
  active: boolean
  is_you: boolean
  /** Acceso fijado en el servidor (PLATFORM_ADMIN_EMAILS): no se quita desde aquí. */
  from_server: boolean
  from_backoffice: boolean
  /** Clínica en la que además trabaja, si su cuenta es de una clínica de verdad. */
  clinic: string | null
  invite_pending: boolean
  invite_expires: string | null
  created_at: string | null
}

export interface ClinicWhatsApp {
  mode: 'dentral' | 'own' | null
  phone_number_id: string | null
  waba_id: string | null
  has_own_token: boolean
  connected: boolean
  last_tested_at: string | null
  last_test_ok: boolean | null
  last_error: string | null
  meta: {
    display_phone_number?: string
    verified_name?: string
    quality_rating?: string
    code_verification_status?: string
    name_status?: string
    checked_at: string
  } | null
  webhooks: { subscribed: boolean; checked_at: string; error: string | null } | null
  dentral_number: {
    phone_number_id: string
    holder: { id: string; name: string } | null
    assigned_in: 'backoffice' | 'server'
  } | null
}

export const useClinicWhatsApp = (id: string) =>
  useQuery({
    queryKey: ['platform', 'whatsapp', id],
    queryFn: () => apiClient.get<ClinicWhatsApp>(ENDPOINTS.platform.whatsapp(id)),
    enabled: !!id,
  })

/** Todas las acciones devuelven el estado nuevo; se deja en caché tal cual. */
export const useClinicWhatsAppAction = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (a: { accion: 'dentral' | 'verify' | 'subscribe' | 'disconnect' } | { accion: 'own'; datos: { phone_number_id: string; waba_id?: string; access_token?: string } }) =>
      a.accion === 'disconnect'
        ? apiClient.delete<ClinicWhatsApp>(ENDPOINTS.platform.whatsapp(id))
        : apiClient.post<ClinicWhatsApp>(ENDPOINTS.platform.whatsapp(id, a.accion), a.accion === 'own' ? a.datos : undefined),
    onSuccess: (data) => {
      qc.setQueryData(['platform', 'whatsapp', id], data)
      qc.invalidateQueries({ queryKey: ['platform', 'clinic'] })
      qc.invalidateQueries({ queryKey: ['platform', 'clinics'] })
    },
  })
}

export const usePlatformTeam = () =>
  useQuery({
    queryKey: ['platform', 'team'],
    queryFn: () => apiClient.get<TeamMember[]>(ENDPOINTS.platform.team),
  })

export const useInviteTeamMember = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (email: string) =>
      apiClient.post<{ email: string; promoted: boolean; invite_link: string | null; invite_expires: string | null }>(
        ENDPOINTS.platform.team,
        { email },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform', 'team'] }),
  })
}

export const useResendTeamInvite = () =>
  useMutation({
    mutationFn: (userId: string) =>
      apiClient.post<{ invite_link: string; invite_expires: string }>(ENDPOINTS.platform.teamResend(userId)),
  })

export const useRevokeTeamMember = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => apiClient.delete<TeamMember[]>(ENDPOINTS.platform.teamMember(userId)),
    onSuccess: (data) => qc.setQueryData(['platform', 'team'], data),
  })
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

export const useUpdateClinicAccess = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: ClinicAccessPatch) => apiClient.patch<PlatformClinicDetail>(ENDPOINTS.platform.access(id), patch),
    onSuccess: (data) => {
      qc.setQueryData(['platform', 'clinic', id], data)
      qc.invalidateQueries({ queryKey: ['platform', 'clinics'] })
    },
  })
}

export const useInviteClinicAdmin = (clinicId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (email: string) =>
      apiClient.post<{ user: { id: string; email: string }; invite_link: string; invite_expires: string }>(
        ENDPOINTS.platform.users(clinicId),
        { email },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform', 'clinic', clinicId] }),
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

// ─── Métricas de la plataforma ─────────────────────────────────────────

export interface PlatformHealth {
  period_days: number
  telemetry_since: string | null
  sla: {
    unansweredAfterSec: number
    latencyP50Ms: number
    latencyP95Ms: number
    webhookMs: number
    webhookAlertMs: number
    queueDepth: number
    queueDepthAlert: number
    queueAgeAlertSec: number
    parseErrorRate: number
    parseErrorAlertRate: number
    unitCostMinUsd: number
    unitCostMaxUsd: number
    dailyCostAlertUsd: number
  }
  unanswered: { count: number; items: { clinic_id: string; clinic_name: string; conversation_id: string; waiting_sec: number }[] }
  latency: {
    end_to_end: { p50: number | null; p95: number | null }
    llm: { p50: number | null; p95: number | null }
    queue_p95_ms: number | null
    webhook_p95_ms: number | null
  }
  queue:
    | { available: true; waiting: number; active: number; delayed: number; depth: number; oldest_waiting_age_sec: number; failed_last_24h: number }
    | { available: false; error: string }
  llm: {
    turns: number
    replied: number
    errors: number
    error_rate: number | null
    parse_errors: number
    parse_error_rate: number | null
    by_outcome: Record<string, number>
    prompt_tokens: number
    completion_tokens: number
  }
  cost: { total_usd: number; last_24h_usd: number; projected_month_usd: number; simulator_usd: number }
  not_available: { pms: string; rag: string }
}

export interface PlatformClinicMetrics {
  id: string
  name: string
  active: boolean
  currency: string
  turns: number
  ai_cost_usd: number
  ai_cost_month_usd: number
  agent_appointments: number
  attended: number
  unmarked: number
  estimated_revenue: number | null
  autonomy_rate: number | null
  first_response_p50_sec: number | null
  guarantee: {
    current: { status: string; attributedAttended: number; thresholdAppointments: number | null; progress: number | null }
    previous: { status: string; attributedAttended: number; thresholdAppointments: number | null; nextInvoiceUsd: number }
  }
}

export interface ClinicCommercial {
  clinicId: string
  monthlyFeeUsd: number
  avgTicket?: number | null
  currency: string
  usdRate: number
  pilotStartedAt?: string | null
  weeklyAppointments?: number | null
  noShowRate?: number | null
  lostConsultationsWeek?: number | null
  firstResponseTimeSec?: number | null
  receptionHoursWeek?: number | null
  updatedAt?: string | null
}

export const usePlatformHealth = (days: number) =>
  useQuery({
    queryKey: ['platform', 'health', days],
    queryFn: () => apiClient.get<PlatformHealth>(ENDPOINTS.platform.health, { params: { days } }),
    refetchInterval: 60_000,
  })

export const usePlatformClinicsMetrics = (days: number) =>
  useQuery({
    queryKey: ['platform', 'clinics-metrics', days],
    queryFn: () => apiClient.get<PlatformClinicMetrics[]>(ENDPOINTS.platform.clinicsMetrics, { params: { days } }),
  })

export const useClinicCommercial = (id: string) =>
  useQuery({
    queryKey: ['platform', 'commercial', id],
    queryFn: () => apiClient.get<ClinicCommercial>(ENDPOINTS.platform.commercial(id)),
    enabled: !!id,
  })

export const useSaveClinicCommercial = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (datos: Partial<Omit<ClinicCommercial, 'clinicId' | 'updatedAt'>>) =>
      apiClient.put<ClinicCommercial>(ENDPOINTS.platform.commercial(id), datos),
    onSuccess: (data) => {
      qc.setQueryData(['platform', 'commercial', id], data)
      qc.invalidateQueries({ queryKey: ['platform', 'clinics-metrics'] })
    },
  })
}
