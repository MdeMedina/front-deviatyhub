'use client'

import React from 'react'
import Link from 'next/link'
import { AlertCircle, Puzzle, ArrowRight, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useIntegrations, useTestIntegration } from '@/lib/api/hooks/use-integrations'
import { IntegrationCard } from '@/components/features/integrations/IntegrationCard'
import { IntegrationConfigModal } from '@/components/features/integrations/IntegrationConfigModal'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useUIStore } from '@/lib/stores/ui.store'

export default function IntegrationsPage() {
  const { hasPermission } = useAuthStore()
  const { data: integrations, isLoading, isError, refetch } = useIntegrations()
  const testMutation = useTestIntegration()
  const addToast = useUIStore((state) => state.addToast)
  const [configuringType, setConfiguringType] = React.useState<any>(null)

  // Permissions check
  const canView = hasPermission('integrations.view')

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[var(--card)] border border-[var(--line)] rounded-[10px] min-h-[380px] max-w-md mx-auto text-center shadow-[0_1px_2px_rgba(20,20,25,0.05)]">
        <div className="w-11 h-11 border border-[var(--line)] rounded-[7px] bg-[var(--head)] flex items-center justify-center text-[var(--neg)] mb-3">
          <AlertCircle size={22} />
        </div>
        <h2 className="text-[18px] font-semibold text-[var(--ink)] mb-1.5">Acceso Denegado</h2>
        <p className="text-[13px] text-[var(--muted)] leading-relaxed mb-5">
          No tienes los permisos necesarios para ver o probar las integraciones. Por favor contacta al administrador del sistema.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-4 py-2 bg-[var(--ink)] hover:opacity-85 text-[var(--bg)] font-medium rounded-[7px] text-[13px] transition-opacity gap-2"
        >
          Ir al Dashboard
          <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  const handleTestConnection = async (type: any) => {
    try {
      const res = await testMutation.mutateAsync(type)
      if (res.ok) {
        addToast({
          title: 'Conexión exitosa',
          message: `Conexión con ${type} probada exitosamente. Latencia: ${res.latency_ms}ms`,
          type: 'success',
        })
      } else {
        addToast({
          title: 'Error de conexión',
          message: res.error || `Fallo al conectar con ${type}.`,
          type: 'error',
        })
      }
    } catch (err: any) {
      addToast({
        title: 'Error al probar conexión',
        message: err?.message || `Fallo al probar la conexión con ${type}`,
        type: 'error',
      })
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-[1340px] mx-auto">
      {/* Header Bar */}
      <div className="flex items-end justify-between gap-5 flex-wrap pb-4 border-b border-[var(--line)]">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-semibold tracking-[-0.028em] text-[var(--ink)] leading-tight">
            Integraciones Externas
          </h1>
          <p className="text-[13.5px] text-[var(--muted)]">
            Conecta Dentral con tus plataformas de chat, agenda y gestión clínica.
          </p>
        </div>

        <div>
          <button
            data-btn
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw size={14} strokeWidth={1.75} className={isLoading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[360px] bg-[var(--card)] border border-[var(--line)] rounded-[10px]">
          <Spinner size="md" />
          <span className="microlabel text-[10px] mt-2">Cargando integraciones</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center min-h-[360px] bg-[var(--card)] border border-[var(--line)] rounded-[10px] p-6 gap-3 text-center">
          <div className="w-10 h-10 rounded-[6px] bg-[var(--head)] border border-[var(--line)] flex items-center justify-center text-[var(--neg)]">
            <AlertCircle size={20} />
          </div>
          <p className="text-[13.5px] font-semibold text-[var(--ink)]">Error al cargar integraciones</p>
          <button data-btn onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      ) : !integrations || integrations.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-[10px] p-12 flex items-center justify-center min-h-[360px]">
          <EmptyState 
            title="No se encontraron integraciones configuradas"
            description="No hay integraciones configuradas en este momento."
            icon={<Puzzle size={22} />}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {integrations.map((integration) => (
              <IntegrationCard
                key={integration.type}
                integration={integration}
                isTesting={testMutation.isPending && testMutation.variables === integration.type}
                onTest={() => handleTestConnection(integration.type)}
                onConfigure={() => setConfiguringType(integration.type)}
              />
            ))}
          </div>

          <IntegrationConfigModal
            isOpen={!!configuringType}
            onClose={() => setConfiguringType(null)}
            type={configuringType}
          />
        </>
      )}
    </div>
  )
}
