'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertCircle, Puzzle, ArrowRight, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useIntegrations, useTestIntegration } from '@/lib/api/hooks/use-integrations'
import { IntegrationCard } from '@/components/features/integrations/IntegrationCard'
import { IntegrationConfigModal } from '@/components/features/integrations/IntegrationConfigModal'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
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
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50 min-h-[calc(100vh-10rem)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white border border-slate-100 rounded-3xl p-8 max-w-md w-full text-center shadow-xl shadow-slate-100/50"
        >
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Acceso Denegado</h2>
          <p className="text-slate-500 text-sm mb-6">
            No tienes los permisos necesarios para ver o probar las integraciones. Por favor contacta al administrador del sistema.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-colors gap-2"
          >
            Ir al Dashboard
            <ArrowRight size={14} />
          </Link>
        </motion.div>
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
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-300">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Puzzle size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Integraciones Externas</h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-0.5">
              Conecta Deviaty Hub con tus plataformas de chat, agenda y gestión clínica
            </p>
          </div>
        </div>

        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
            <AlertCircle size={26} />
          </div>
          <p className="text-sm font-semibold text-slate-700">Error al cargar integraciones</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : !integrations || integrations.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
          <Puzzle size={36} className="text-slate-300" />
          <p className="text-sm text-slate-400 font-medium">No se encontraron integraciones configuradas</p>
        </div>
      ) : (
        <>
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {integrations.map((integration) => (
              <IntegrationCard
                key={integration.type}
                integration={integration}
                isTesting={testMutation.isPending && testMutation.variables === integration.type}
                onTest={() => handleTestConnection(integration.type)}
                onConfigure={() => setConfiguringType(integration.type)}
              />
            ))}
          </motion.div>

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
