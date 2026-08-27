'use client'

import React from 'react'
import { 
  MessageSquare, 
  Share2, 
  Calendar, 
  Activity, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Info,
  Layers
} from 'lucide-react'
import { IIntegration, IntegrationType } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export interface IntegrationCardProps {
  integration: IIntegration
  onTest: () => void
  isTesting: boolean
  onConfigure?: () => void
}

const brandConfigs = {
  [IntegrationType.WHATSAPP]: {
    name: 'WhatsApp Business',
    description: 'Canal directo para confirmaciones, recordatorios de citas y comunicación con pacientes.',
    icon: MessageSquare,
  },
  [IntegrationType.INSTAGRAM]: {
    name: 'Instagram Direct',
    description: 'Automatización de respuestas directas y captación de pacientes desde stories y publicaciones.',
    icon: Share2,
  },
  [IntegrationType.GOOGLE_CALENDAR]: {
    name: 'Google Calendar',
    description: 'Sincronización en tiempo real de la agenda médica con calendarios de Google Workspace.',
    icon: Calendar,
  },
  [IntegrationType.DENTALINK]: {
    name: 'Dentalink',
    description: 'Integración bidireccional de fichas clínicas, presupuestos y agendas odontológicas.',
    icon: Activity,
  },
  [IntegrationType.DENTIDESK]: {
    name: 'Dentidesk',
    description: 'Sincronización de pacientes y horas clínicas con el sistema Dentidesk.',
    icon: Layers,
  },
  [IntegrationType.GMAIL]: {
    name: 'Gmail & Google Workspace',
    description: 'Envío automático de notificaciones de presupuestos, boletas y confirmaciones por email.',
    icon: Mail,
  },
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  onTest,
  isTesting,
  onConfigure,
}) => {
  const brand = brandConfigs[integration.type] || {
    name: integration.type,
    description: 'Servicio de integración externo de Dentral.',
    icon: Layers,
  }

  const BrandIcon = brand.icon

  let formattedDate = ''
  if (integration.last_tested_at) {
    try {
      formattedDate = format(new Date(integration.last_tested_at), "dd MMM, HH:mm", { locale: es })
    } catch (e) {
      formattedDate = integration.last_tested_at
    }
  }

  return (
    <div className="flex flex-col justify-between bg-[var(--card)] border border-[var(--line)] rounded-[10px] shadow-[0_1px_2px_rgba(20,20,25,0.05)] transition-colors hover:border-[var(--dim)] h-full overflow-hidden">
      <div className="p-5 space-y-3.5">
        {/* Card Header (34px icon box & Status badge) */}
        <div className="flex items-start justify-between gap-3">
          <div className="w-[34px] h-[34px] rounded-[6px] bg-[var(--head)] border border-[var(--line)] flex items-center justify-center text-[var(--ink)] shrink-0">
            <BrandIcon size={17} />
          </div>

          <Badge
            label={integration.connected ? 'Conectado' : 'Desconectado'}
            variant={integration.connected ? 'success' : 'neutral'}
            dot
          />
        </div>

        {/* Brand Details */}
        <div className="space-y-1">
          <h3 className="text-[14.5px] font-semibold text-[var(--ink)]">{brand.name}</h3>
          <p className="text-[12.5px] text-[var(--muted)] leading-relaxed">{brand.description}</p>
        </div>

        {/* Actions: two 50% buttons */}
        <div className="flex gap-2 pt-1">
          {onConfigure && (
            <Button onClick={onConfigure} variant="outline" size="sm" className="flex-1">
              Configurar
            </Button>
          )}

          <Button
            onClick={onTest}
            loading={isTesting}
            disabled={isTesting}
            variant="outline"
            size="sm"
            className={onConfigure ? 'flex-1' : 'w-full'}
          >
            Probar conexión
          </Button>
        </div>
      </div>

      {/* Status footer bar on --surface */}
      {integration.last_tested_at && (
        <div className="flex items-center justify-between gap-2 px-5 py-2.5 bg-[var(--surface)] border-t border-[var(--line)] text-[11.5px]">
          <div className="flex items-center gap-1.5">
            {integration.last_test_ok ? (
              <CheckCircle2 size={12} className="text-[var(--pos)] shrink-0" />
            ) : (
              <XCircle size={12} className="text-[var(--neg)] shrink-0" />
            )}
            <span className={integration.last_test_ok ? 'text-[var(--pos)]' : 'text-[var(--neg)]'}>
              {integration.last_test_ok ? 'Conexión OK' : 'Fallo de conexión'}
            </span>
          </div>

          <div className="flex items-center gap-2 tabular text-[var(--dim)]">
            <span>{formattedDate}</span>
            {integration.latency_ms !== undefined && (
              <div className="relative group inline-block">
                <div className="flex items-center gap-0.5 text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-help">
                  <Info size={10} />
                  <span className="font-mono">{integration.latency_ms} ms</span>
                </div>

                <div
                  data-testid="latency-tooltip"
                  className="absolute bottom-full right-0 mb-1.5 px-2 py-1 bg-[var(--ink)] text-[var(--bg)] text-[9px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow z-20"
                >
                  Latencia del último test
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
