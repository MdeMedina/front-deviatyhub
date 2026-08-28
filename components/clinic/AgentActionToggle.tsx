'use client'

import React from 'react'
import { Check, AlertTriangle } from 'lucide-react'
import { useAgentConfig, useUpdateAgentConfig } from '@/lib/api/hooks/use-agent'
import { useIntegrations } from '@/lib/api/hooks/use-integrations'
import { useUIStore } from '@/lib/stores/ui.store'
import { Spinner } from '@/components/ui/Spinner'
import { Channel, IntegrationType } from '@/lib/types'

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
            title: 'Falla al actualizar',
            message: err.message || 'No se pudieron actualizar los canales.',
            type: 'error',
          })
        },
      }
    )
  }

  const handleToggleIntegration = (actionKey: 'schedule' | 'reschedule' | 'cancel', integration: IntegrationType) => {
    if (readOnly || !config) return

    const isConnected = integrationsMap.get(integration) ?? false
    const currentAction = config.actions[actionKey]
    const alreadyHas = currentAction.integrations.includes(integration)

    if (!alreadyHas && !isConnected) {
      addToast({
        title: 'Integración requerida',
        message: `No se puede habilitar porque la integración con ${integration} no está conectada o activa.`,
        type: 'warning',
      })
      return
    }

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
            message: 'Las integraciones asociadas fueron modificadas.',
            type: 'success',
          })
        },
        onError: (err: any) => {
          addToast({
            title: 'Falla al actualizar',
            message: err.message || 'Error al modificar integraciones.',
            type: 'error',
          })
        },
      }
    )
  }

  if (loadingConfig || loadingIntegrations) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-[var(--card)] border border-[var(--line)] rounded-[10px] min-h-[300px]">
        <Spinner size="md" />
        <span className="microlabel text-[10px] mt-2">Cargando acciones</span>
      </div>
    )
  }

  if (errorConfig || !config) {
    return (
      <div className="p-8 bg-[var(--card)] border border-[var(--line)] rounded-[10px] text-center">
        <p className="text-[13px] text-[var(--neg)]">Error al cargar la configuración de acciones del agente.</p>
      </div>
    )
  }

  const actionsMeta = [
    {
      key: 'schedule' as const,
      title: 'Agendar Citas',
      description: 'Permite al asistente agendar nuevas citas médicas verificando la disponibilidad y reglas clínicas en tiempo real.',
      count: '248',
    },
    {
      key: 'reschedule' as const,
      title: 'Reprogramar Citas',
      description: 'Habilita al paciente cambiar fecha y horario de citas ya existentes manteniendo la trazabilidad histórica.',
      count: '53',
    },
    {
      key: 'cancel' as const,
      title: 'Cancelar Citas',
      description: 'Gestiona la cancelación de turnos y libera el horario en el calendario de forma automática.',
      count: '26',
    },
  ]

  const channelsList = [Channel.WHATSAPP, Channel.INSTAGRAM]
  const integrationsList = [
    IntegrationType.GOOGLE_CALENDAR,
    IntegrationType.DENTALINK,
    IntegrationType.DENTIDESK,
    IntegrationType.GMAIL,
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* 3 Action Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {actionsMeta.map((actionInfo) => {
          const actionConfig = config.actions[actionInfo.key]
          const isActived = actionConfig.active

          return (
            <div
              key={actionInfo.key}
              data-card
              data-testid={`action-panel-${actionInfo.key}`}
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              {/* Header with Switch */}
              <div data-hd>
                <h2>{actionInfo.title}</h2>
                <button
                  type="button"
                  data-testid={`action-toggle-${actionInfo.key}`}
                  disabled={readOnly}
                  onClick={() => handleToggleAction(actionInfo.key)}
                  style={{
                    width: '38px',
                    height: '22px',
                    borderRadius: '999px',
                    border: '1px solid var(--line)',
                    background: isActived ? 'var(--blue)' : 'var(--surface-2)',
                    position: 'relative',
                    cursor: readOnly ? 'not-allowed' : 'pointer',
                    padding: 0,
                    opacity: readOnly ? 0.6 : 1,
                    transition: 'background-color .15s',
                  }}
                  aria-label={`Toggle ${actionInfo.title}`}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: isActived ? '18px' : '2px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      transition: 'left .15s',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                    }}
                  />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.6, color: 'var(--muted)' }}>
                  {actionInfo.description}
                </p>

                {/* Channels */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span data-lbl>Canales habilitados</span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {channelsList.map((channel) => {
                      const isSelected = actionConfig.channels.includes(channel)
                      return (
                        <button
                          key={channel}
                          type="button"
                          data-testid={`channel-${channel}`}
                          disabled={!isActived || readOnly}
                          onClick={() => handleToggleChannel(actionInfo.key, channel)}
                          className="cursor-pointer transition-all disabled:cursor-not-allowed"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '3px 9px',
                            borderRadius: '999px',
                            fontSize: '11.5px',
                            fontWeight: 500,
                            border: `1px solid ${isSelected && isActived ? 'var(--blue-line)' : 'var(--line)'}`,
                            background: isSelected && isActived ? 'var(--blue-tint)' : 'var(--surface)',
                            color: isSelected && isActived ? 'var(--blue)' : 'var(--dim)',
                            opacity: !isActived ? 0.5 : 1,
                          }}
                        >
                          {isSelected && <Check size={11} strokeWidth={2.5} />}
                          {channel}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Integrations */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span data-lbl>Integraciones asociadas</span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {integrationsList.map((integration) => {
                      const isSelected = actionConfig.integrations.includes(integration)
                      const isConnected = integrationsMap.get(integration) ?? false

                      return (
                        <button
                          key={integration}
                          type="button"
                          data-testid={`integration-${integration}`}
                          disabled={!isActived || readOnly}
                          onClick={() => handleToggleIntegration(actionInfo.key, integration)}
                          className="cursor-pointer transition-all disabled:cursor-not-allowed"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '3px 9px',
                            borderRadius: '999px',
                            fontSize: '11.5px',
                            fontWeight: 500,
                            border: `1px solid ${isSelected && isActived ? 'var(--blue-line)' : 'var(--line)'}`,
                            background: isSelected && isActived ? 'var(--blue-tint)' : 'var(--surface)',
                            color: isSelected && isActived ? 'var(--blue)' : 'var(--dim)',
                            opacity: !isActived || !isConnected ? 0.5 : 1,
                          }}
                        >
                          {!isConnected ? (
                            <AlertTriangle size={11} className="shrink-0" />
                          ) : isSelected && isActived ? (
                            <Check size={11} strokeWidth={2.5} className="shrink-0" />
                          ) : null}
                          {integration}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Executions footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingTop: '14px', borderTop: '1px solid var(--line-soft)', marginTop: 'auto' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>Ejecuciones (7 días)</span>
                  <span data-mono style={{ fontSize: '13px', color: 'var(--ink)' }}>{actionInfo.count}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Safety Rules Card */}
      <div data-card>
        <div data-hd>
          <h2>Reglas de seguridad del agente</h2>
        </div>
        <div style={{ padding: '18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span data-lbl>Ventana mínima de agendamiento</span>
            <span data-mono style={{ fontSize: '15px', color: 'var(--ink)' }}>2 h</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span data-lbl>Máx. reprogramaciones por paciente</span>
            <span data-mono style={{ fontSize: '15px', color: 'var(--ink)' }}>3</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span data-lbl>Derivación automática a humano</span>
            <span style={{ fontSize: '15px', color: 'var(--ink)' }}>Tras 2 intentos fallidos</span>
          </div>
        </div>
      </div>
    </div>
  )
}
