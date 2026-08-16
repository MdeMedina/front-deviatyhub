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

// Brand configurations for custom theme colors, descriptions, and icons
const brandConfigs = {
  [IntegrationType.WHATSAPP]: {
    name: 'WhatsApp Business',
    description: 'Canal directo para confirmaciones, recordatorios de citas y comunicación fluida con pacientes.',
    icon: MessageSquare,
    themeClasses: 'from-emerald-50 to-teal-50/20 border-emerald-100 hover:border-emerald-200/80',
    iconClasses: 'bg-emerald-50 text-emerald-600',
    titleClasses: 'text-emerald-800',
  },
  [IntegrationType.INSTAGRAM]: {
    name: 'Instagram Direct',
    description: 'Automatización de respuestas directas y captación de pacientes desde tus publicaciones y stories.',
    icon: Share2,
    themeClasses: 'from-pink-50 to-purple-50/20 border-pink-100 hover:border-pink-200/80',
    iconClasses: 'bg-pink-50 text-pink-600',
    titleClasses: 'text-pink-850',
  },
  [IntegrationType.GOOGLE_CALENDAR]: {
    name: 'Google Calendar',
    description: 'Sincronización en tiempo real de la agenda médica con calendarios de Google del personal y doctores.',
    icon: Calendar,
    themeClasses: 'from-blue-50 to-indigo-50/20 border-blue-100 hover:border-blue-200/80',
    iconClasses: 'bg-blue-50 text-blue-600',
    titleClasses: 'text-blue-800',
  },
  [IntegrationType.DENTALINK]: {
    name: 'Dentalink',
    description: 'Integración bidireccional de fichas clínicas, presupuestos y agendas para clínicas dentales.',
    icon: Activity,
    themeClasses: 'from-cyan-50 to-sky-50/20 border-cyan-100 hover:border-cyan-200/80',
    iconClasses: 'bg-cyan-50 text-cyan-600',
    titleClasses: 'text-cyan-800',
  },
  [IntegrationType.DENTIDESK]: {
    name: 'Dentidesk',
    description: 'Sincronización de pacientes y horas clínicas con la plataforma de gestión odontológica Dentidesk.',
    icon: Layers,
    themeClasses: 'from-sky-50 to-indigo-50/20 border-sky-100 hover:border-sky-200/80',
    iconClasses: 'bg-sky-50 text-sky-600',
    titleClasses: 'text-sky-850',
  },
  [IntegrationType.GMAIL]: {
    name: 'Gmail & Google Workspace',
    description: 'Envío automático de notificaciones de presupuestos, boletas y confirmaciones por correo electrónico.',
    icon: Mail,
    themeClasses: 'from-rose-50 to-red-50/20 border-rose-100 hover:border-rose-200/80',
    iconClasses: 'bg-rose-50 text-rose-600',
    titleClasses: 'text-rose-800',
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
    description: 'Servicio de integración externo de Deviaty Hub.',
    icon: Layers,
    themeClasses: 'from-slate-50 to-slate-100 border-slate-200 hover:border-slate-350',
    iconClasses: 'bg-slate-100 text-slate-600',
    titleClasses: 'text-slate-800',
  }

  const BrandIcon = brand.icon

  // Safely format the timestamp with date-fns
  let formattedDate = ''
  if (integration.last_tested_at) {
    try {
      formattedDate = format(new Date(integration.last_tested_at), "dd MMM, HH:mm", { locale: es })
    } catch (e) {
      formattedDate = integration.last_tested_at
    }
  }

  return (
    <div className={`flex flex-col justify-between p-6 bg-gradient-to-br ${brand.themeClasses} border rounded-3xl transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.01] h-full`}>
      <div className="space-y-4">
        {/* Card Header (Icon & Status badge) */}
        <div className="flex items-start justify-between gap-3">
          <div className={`w-12 h-12 rounded-2xl ${brand.iconClasses} flex items-center justify-center`}>
            <BrandIcon size={22} />
          </div>
          
          <Badge 
            label={integration.connected ? 'Conectado' : 'Desconectado'} 
            variant={integration.connected ? 'success' : 'neutral'} 
            dot 
          />
        </div>

        {/* Brand Details */}
        <div className="space-y-2">
          <h3 className={`font-bold text-base ${brand.titleClasses}`}>{brand.name}</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">{brand.description}</p>
        </div>
      </div>

      {/* Card Footer Actions & Status metrics */}
      <div className="mt-5 space-y-4">
        <div className="flex gap-2">
          {onConfigure && (
            <Button
              onClick={onConfigure}
              variant="outline"
              size="sm"
              className="flex-1 text-xs py-2 shadow-none hover:shadow-sm"
            >
              Configurar
            </Button>
          )}

          <Button
            onClick={onTest}
            loading={isTesting}
            disabled={isTesting}
            variant="outline"
            size="sm"
            className={onConfigure ? 'flex-1 text-xs py-2 shadow-none hover:shadow-sm' : 'w-full text-xs py-2 shadow-none hover:shadow-sm'}
          >
            Probar conexión
          </Button>
        </div>

        {integration.last_tested_at && (
          <div className="pt-3 border-t border-slate-100/80 flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <div className="flex items-center gap-1.5">
              {integration.last_test_ok ? (
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              ) : (
                <XCircle size={13} className="text-rose-500 shrink-0" />
              )}
              <span className={integration.last_test_ok ? 'text-emerald-600/90' : 'text-rose-600/90'}>
                {integration.last_test_ok ? 'Conexión OK' : 'Fallo de conexión'}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span>{formattedDate}</span>
              {integration.latency_ms !== undefined && (
                <div className="relative group inline-block ml-0.5">
                  <div className="flex items-center gap-0.5 text-slate-400 hover:text-slate-600 transition-colors cursor-help bg-slate-50 px-1 py-0.5 rounded border border-slate-100">
                    <Info size={11} />
                    <span className="text-[10px] font-bold">{integration.latency_ms} ms</span>
                  </div>
                  
                  <div 
                    data-testid="latency-tooltip"
                    className="absolute bottom-full right-0 mb-1.5 px-2 py-1 bg-slate-900 text-white text-[9px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow z-20"
                  >
                    Latencia del último test
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
