'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'

export interface ImpactTargets {
  roiMultiple: number
  noShowReduction: number
  conversion: number
  afterHoursShare: number
  frtP50Sec: number
  autonomy: number
  hoursSavedMonth: number
}

export interface ClinicImpact {
  period_days: number
  currency: string
  targets: ImpactTargets
  business: {
    estimated_revenue: number | null
    attended_appointments: number
    no_show_appointments: number
    unmarked_appointments: number
    attendance_rate: number | null
    no_show_rate: number | null
    baseline_no_show_rate: number | null
    no_show_reduction: number | null
    agent_appointments: number
    conversion_rate: number | null
    conversations_with_booking_intent: number
    after_hours_appointments: number
    after_hours_share: number | null
    first_response_p50_sec: number | null
    baseline_first_response_sec: number | null
    autonomy_rate: number | null
    conversations: number
    agent_messages: number
    reception_hours_saved: number
    reception_hours_saved_month: number
  }
}

export type GuaranteeStatus = 'SIN_TICKET' | 'EN_CURSO' | 'GUARANTEE_ACHIEVED' | 'GUARANTEE_TRIGGERED'

export interface GuaranteeMonth {
  from: string
  monthlyFeeUsd: number
  avgTicketUsd: number | null
  thresholdAppointments: number | null
  attributedAttended: number
  guaranteeMet: boolean
  status: GuaranteeStatus
  progress: number | null
  nextInvoiceUsd: number
}

export interface ClinicGuarantee {
  currency: string
  avg_ticket: number | null
  usd_rate: number
  current_month: GuaranteeMonth
  previous_month: GuaranteeMonth
}

export const useClinicImpact = (days: number) =>
  useQuery({
    queryKey: ['impact', days],
    queryFn: () => apiClient.get<ClinicImpact>(ENDPOINTS.metrics.impact, { params: { period: days } }),
    staleTime: 60_000,
  })

export const useClinicGuarantee = () =>
  useQuery({
    queryKey: ['impact', 'guarantee'],
    queryFn: () => apiClient.get<ClinicGuarantee>(ENDPOINTS.metrics.guarantee),
    staleTime: 60_000,
  })

/** "$1.450.000" en la moneda de la clínica. */
export function dinero(valor: number | null | undefined, moneda = 'CLP'): string {
  if (valor == null) return '—'
  try {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: moneda, maximumFractionDigits: 0 }).format(valor)
  } catch {
    return `${Math.round(valor).toLocaleString('es-CL')} ${moneda}`
  }
}

export function pct(v: number | null | undefined): string {
  return v == null ? '—' : `${Math.round(v * 100)} %`
}
