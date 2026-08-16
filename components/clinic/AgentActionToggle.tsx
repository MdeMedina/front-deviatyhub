'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertCircle, 
  Check, 
  AlertTriangle, 
  Calendar, 
  MessageSquare, 
  Clock, 
  Sparkles, 
  HelpCircle,
  ShieldAlert,
  Bot
} from 'lucide-react'
import { useAgentConfig, useUpdateAgentConfig } from '@/lib/api/hooks/use-agent'
import { useIntegrations } from '@/lib/api/hooks/use-integrations'
import { useUIStore } from '@/lib/stores/ui.store'
import { Spinner } from '@/components/ui/Spinner'
import { Channel, IntegrationType, IAgentConfig, IAgentActionConfig } from '@/lib/types'

export interface AgentActionToggleProps {
  readOnly?: boolean
}

export const AgentActionToggle: React.FC<AgentActionToggleProps> = ({ readOnly = false }) => {
  const { data: config, isLoading: loadingConfig, isError: errorConfig } = useAgentConfig()
  const { data: integrations = [], isLoading: loadingIntegrations } = useIntegrations()
  const { mutate: updateConfig, isPending: isUpdating } = useUpdateAgentConfig()
  const addToast = useUIStore((state) => state.addToast)

  // Map of integrations connection status for quick lookup
  const integrationsMap = React.useMemo(() => {
    const map = new Map<IntegrationType, boolean>()
    integrations.forEach((integration) => {
      map.set(integration.type, integration.connected)
    })
    return map
  }, [integrations])

  const handleToggleAction = (actionKey: 'schedule' | 'reschedule' | 'cancel') => {
    if (readOnly || !config) return

    const currentAction = config.actions[actionKey]
    const updatedActions = {
      ...config.actions,
      [actionKey]: {
        ...currentAction,
        active: !currentAction.active,
      },
    }

    updateConfig(
      { actions: updatedActions },
      {
        onSuccess: () => {
          addToast({
            title: 'Acción actualizada',
            message: `La acción del agente ha sido ${!currentAction.active ? 'activada' : 'desactivada'} con éxito.`,
            type: 'success',
          })
        },
        onError: (err: any) => {
          addToast({
            title: 'Falla al actualizar',
            message: err.message || 'No se pudo guardar la configuración de la acción.',
            type: 'error',
          })
        },
      }
    )
  }

  const handleToggleChannel = (actionKey: 'schedule' | 'reschedule' | 'cancel', channel: Channel) => {
    if (readOnly || !config) return

    const currentAction = config.actions[actionKey]
    const alreadyHas = currentAction.channels.includes(channel)
    const updatedChannels = alreadyHas
      ? currentAction.channels.filter((c) => c !== channel)
      : [...currentAction.channels, channel]

    const updatedActions = {
      ...config.actions,
      [actionKey]: {
        ...currentAction,
        channels: updatedChannels,
      },
    }

    updateConfig(
      { actions: updatedActions },
      {
        onSuccess: () => {
          addToast({
            title: 'Canales actualizados',
            message: 'Los canales de comunicación fueron configurados con éxito.',
            type: 'success',
          })
        },
        onError: (err: any) => {
          addToast({
            title: 'Error de actualización',
            message: err.message || 'No se pudo guardar los canales de la acción.',
            type: 'error',
          })
        },
      }
    )
  }

  const handleToggleIntegration = (
    actionKey: 'schedule' | 'reschedule' | 'cancel', 
    integration: IntegrationType
  ) => {
    if (readOnly || !config) return

    // Pre-check if integration is connected
    const isConnected = integrationsMap.get(integration) ?? false
    if (!isConnected) {
      addToast({
        title: 'Integración requerida',
        message: `No se puede habilitar porque la integración con ${integration} no está conectada o activa.`,
        type: 'warning',
      })
      return
    }

    const currentAction = config.actions[actionKey]
    const alreadyHas = currentAction.integrations.includes(integration)
    const updatedIntegrations = alreadyHas
      ? currentAction.integrations.filter((i) => i !== integration)
      : [...currentAction.integrations, integration]

    const updatedActions = {
      ...config.actions,
      [actionKey]: {
        ...currentAction,
        integrations: updatedIntegrations,
      },
    }

    updateConfig(
      { actions: updatedActions },
      {
        onSuccess: () => {
          addToast({
            title: 'Integraciones actualizadas',
            message: 'La asignación de integraciones se guardó correctamente.',
            type: 'success',
          })
        },
        onError: (err: any) => {
          addToast({
            title: 'Error de actualización',
            message: err.message || 'No se pudo guardar la integración de la acción.',
            type: 'error',
          })
        },
      }
    )
  }

  if (loadingConfig || loadingIntegrations) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-100 shadow-sm min-h-[400px]">
        <Spinner size="lg" className="text-indigo-600 mb-4" />
        <p className="text-sm font-semibold text-slate-500">Cargando configuración de acciones del bot...</p>
      </div>
    )
  }

  if (errorConfig) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-100 rounded-3xl text-center max-w-2xl mx-auto flex flex-col items-center gap-3">
        <AlertCircle className="text-rose-500 w-8 h-8" />
        <p className="text-sm font-semibold text-rose-600">
          No se pudo cargar la configuración de acciones del agente.
        </p>
      </div>
    )
  }

  if (!config) return null

  const actionsList: Array<{
    key: 'schedule' | 'reschedule' | 'cancel'
    title: string
    description: string
    icon: React.ReactNode
    accentColor: string
  }> = [
    {
      key: 'schedule',
      title: 'Agendar Citas',
      description: 'Permite al agente programar y crear nuevas citas médicas según disponibilidad.',
      icon: <Calendar size={20} />,
      accentColor: 'indigo'
    },
    {
      key: 'reschedule',
      title: 'Reprogramar Citas',
      description: 'Habilita al bot a cambiar el horario de una cita existente a petición del paciente.',
      icon: <Clock size={20} />,
      accentColor: 'sky'
    },
    {
      key: 'cancel',
      title: 'Cancelar Citas',
      description: 'Facilita la liberación y anulación de citas confirmadas por pacientes.',
      icon: <Clock size={20} className="rotate-180" />, // simple variation
      accentColor: 'rose'
    }
  ]

  const channelsList = [Channel.WHATSAPP, Channel.INSTAGRAM]
  const integrationsList = [
    IntegrationType.WHATSAPP,
    IntegrationType.INSTAGRAM,
    IntegrationType.GOOGLE_CALENDAR,
    IntegrationType.DENTALINK,
    IntegrationType.DENTIDESK,
    IntegrationType.GMAIL
  ]

  return (
    <div className="space-y-6">
      {/* Intro info panel */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center justify-center pointer-events-none">
          <Bot size={220} className="-rotate-12 translate-y-4 translate-x-4" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1 bg-indigo-500/25 border border-indigo-400/30 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase">
              <Sparkles size={11} className="text-indigo-300 animate-pulse" />
              IA Operativa Activa
            </div>
            <h3 className="text-lg font-black tracking-tight">Acciones y Autonomía del Agente</h3>
            <p className="text-slate-300 text-xs leading-relaxed font-medium">
              Define los límites del bot. Selecciona qué tareas operativas puede ejecutar de forma autónoma, a través de qué canales de mensajería atenderá y con qué agendas o sistemas se sincronizará.
            </p>
          </div>
          {readOnly && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-400/20 rounded-full text-xs font-bold text-amber-300">
              <ShieldAlert size={14} />
              Modo de Solo Lectura
            </div>
          )}
        </div>
      </div>

      {/* Panels for actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {actionsList.map((actionInfo) => {
          const actionConfig: IAgentActionConfig = config.actions[actionInfo.key]
          const isActived = actionConfig.active

          let accentBgClass = 'border-slate-100 hover:border-slate-200'
          if (isActived) {
            if (actionInfo.accentColor === 'indigo') accentBgClass = 'border-indigo-100 shadow-indigo-50/40 ring-1 ring-indigo-50/50'
            if (actionInfo.accentColor === 'sky') accentBgClass = 'border-sky-100 shadow-sky-50/40 ring-1 ring-sky-50/50'
            if (actionInfo.accentColor === 'rose') accentBgClass = 'border-rose-100 shadow-rose-50/40 ring-1 ring-rose-50/50'
          }

          return (
            <div 
              key={actionInfo.key}
              className={`bg-white rounded-3xl border p-6 shadow-sm transition-all duration-300 flex flex-col justify-between ${accentBgClass}`}
              data-testid={`action-panel-${actionInfo.key}`}
            >
              <div>
                {/* Header of Action Panel */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                      isActived 
                        ? actionInfo.accentColor === 'indigo' ? 'bg-indigo-50 text-indigo-600'
                          : actionInfo.accentColor === 'sky' ? 'bg-sky-50 text-sky-600'
                          : 'bg-rose-50 text-rose-600'
                        : 'bg-slate-50 text-slate-400'
                    }`}>
                      {actionInfo.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{actionInfo.title}</h4>
                      <span className={`text-[9px] font-black tracking-wider uppercase ${isActived ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {isActived ? 'Autónomo' : 'Apagado'}
                      </span>
                    </div>
                  </div>

                  {/* Switch Component */}
                  <button
                    type="button"
                    aria-label={`Toggle ${actionInfo.title}`}
                    disabled={readOnly}
                    onClick={() => handleToggleAction(actionInfo.key)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                      readOnly ? 'opacity-50 cursor-not-allowed' : 'focus:ring-2 focus:ring-indigo-100 focus:ring-offset-1'
                    } ${isActived ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  >
                    <motion.span
                      layout
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 ${
                        isActived ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed mb-6 font-medium">
                  {actionInfo.description}
                </p>

                {/* Channels selection */}
                <div className={`space-y-2.5 mb-6 transition-all duration-300 ${isActived ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                  <label className="text-[10px] font-black tracking-wider uppercase text-slate-400 block ml-0.5">
                    Canales de Operación
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {channelsList.map((channel) => {
                      const isSelected = actionConfig.channels.includes(channel)
                      return (
                        <button
                          key={channel}
                          type="button"
                          data-testid={`channel-${channel}`}
                          disabled={!isActived || readOnly}
                          onClick={() => handleToggleChannel(actionInfo.key, channel)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isSelected 
                              ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100'
                          }`}
                        >
                          {isSelected && <Check size={12} className="stroke-[3]" />}
                          {channel}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Integraciones selection */}
                <div className={`space-y-2.5 transition-all duration-300 ${isActived ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                  <label className="text-[10px] font-black tracking-wider uppercase text-slate-400 block ml-0.5">
                    Integraciones Sincronizadas
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {integrationsList.map((integration) => {
                      const isSelected = actionConfig.integrations.includes(integration)
                      const isConnected = integrationsMap.get(integration) ?? false

                      return (
                        <div 
                          key={integration}
                          className="relative group"
                        >
                          <button
                            key={integration}
                            type="button"
                            disabled={!isActived || readOnly}
                            onClick={() => handleToggleIntegration(actionInfo.key, integration)}
                            className={`w-full px-3 py-2.5 rounded-xl text-[10px] font-bold text-left transition-all border flex items-center justify-between group/btn ${
                              isSelected 
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                                : 'bg-slate-50/50 hover:bg-slate-50 border-slate-100 text-slate-600'
                            } ${!isConnected ? 'cursor-not-allowed border-dashed border-slate-200' : ''}`}
                            data-testid={`integration-${integration}`}
                          >
                            <span className="truncate pr-1">{integration}</span>
                            {isConnected ? (
                              isSelected ? (
                                <Check size={12} className="text-indigo-600 shrink-0" />
                              ) : null
                            ) : (
                              <div className="text-amber-500 hover:text-amber-600 cursor-help shrink-0 relative flex items-center justify-center">
                                <AlertTriangle size={12} />
                                {/* Simple css tooltip inside table cell */}
                                <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover/btn:block w-36 p-2 bg-slate-900 text-white text-[9px] rounded-lg shadow-lg leading-normal z-50 pointer-events-none">
                                  Configura la integración con {integration} primero.
                                </div>
                              </div>
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
