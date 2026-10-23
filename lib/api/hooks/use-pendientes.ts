'use client'

import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../client'
import { ENDPOINTS } from '../endpoints'
import { useUIStore } from '@/lib/stores/ui.store'
import type { IConversationListItem } from '@/lib/types'
import type { CoordinationData } from './use-appointments'

/**
 * Lo que el equipo de la clínica tiene que atender: conversaciones que el
 * agente derivó y nadie tomó, y citas por pasar a Dentalink. Antes una
 * derivación solo se veía con la pantalla de Conversaciones abierta.
 */
export function usePendientesDelEquipo(activo: boolean) {
  const addToast = useUIStore((s) => s.addToast)

  const derivadas = useQuery({
    queryKey: ['conversations', { status: 'HUMAN_TAKEOVER', limit: 50 }],
    queryFn: () =>
      apiClient.get<IConversationListItem[]>(ENDPOINTS.conversations.list, { params: { status: 'HUMAN_TAKEOVER', limit: 50 } }),
    refetchInterval: 30_000,
    enabled: activo,
  })

  const coordinacion = useQuery({
    queryKey: ['coordination'],
    queryFn: () => apiClient.get<CoordinationData>(ENDPOINTS.agenda.coordination),
    refetchInterval: 60_000,
    enabled: activo,
  })

  // Sin asignar = nadie la está atendiendo todavía.
  const sinAtender = (derivadas.data ?? []).filter((c: any) => !c.assigned_user_id && !c.assignedUserId).length
  const porDentalink = coordinacion.data?.enabled ? coordinacion.data.items.length : 0

  // Aviso en pantalla cuando aparece una derivación nueva (no en la primera carga).
  const previo = useRef<number | null>(null)
  useEffect(() => {
    if (!derivadas.isSuccess) return
    if (previo.current !== null && sinAtender > previo.current) {
      addToast({
        type: 'warning',
        title: 'Un paciente espera respuesta',
        message: 'El agente derivó una conversación al equipo. Ábrela en Conversaciones.',
      })
    }
    previo.current = sinAtender
  }, [sinAtender, derivadas.isSuccess, addToast])

  return { sinAtender, porDentalink }
}
