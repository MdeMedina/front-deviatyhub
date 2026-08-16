'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertCircle, Lock, Shield, History, ArrowRight, Plus } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useUIStore } from '@/lib/stores/ui.store'
import { useRoles, useUpdateRole, useCreateRole } from '@/lib/api/hooks/use-users-roles'
import { useAuditLogs } from '@/lib/api/hooks/use-audit-logs'
import { PermissionsEditor } from '@/components/features/security/PermissionsEditor'
import { AuditLogsTable } from '@/components/features/security/AuditLogsTable'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { AuditLogPeriod, IRole, IPermissions } from '@/lib/types'

const TABS = [
  { id: 'permissions', label: 'Roles y Permisos', icon: Shield },
  { id: 'audit', label: 'Logs de Auditoría', icon: History },
] as const

type TabId = typeof TABS[number]['id']

const DEFAULT_PERMISSIONS: IPermissions = {
  conversations:  { view: false, takeover: false },
  agenda:         { view: false, edit: false },
  knowledge_base: { view: false, edit: false },
  agent_actions:  { view: false, edit: false },
  clinic_config:  { view: false, edit: false },
  users:          { view: false, edit: false, create: false, delete: false },
  integrations:   { view: false },
  metrics:        { view: false },
  simulator:      { view: false },
  security:       { view: false },
}

export default function SecurityPage() {
  const { hasPermission } = useAuthStore()
  const addToast = useUIStore((state) => state.addToast)

  // Current tab view state
  const [activeTab, setActiveTab] = useState<TabId>('permissions')

  // Roles query & update mutations
  const { data: roles, isLoading: rolesLoading, refetch: refetchRoles } = useRoles()
  const updateRoleMutation = useUpdateRole()
  const createRoleMutation = useCreateRole()
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')

  // Create role modal states
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleErrors, setNewRoleErrors] = useState<{ name?: string }>({})

  // Audit Logs state
  const [auditPeriod, setAuditPeriod] = useState<AuditLogPeriod>('7d')
  const { data: auditLogs, isLoading: auditLoading } = useAuditLogs(auditPeriod)

  // Handle role creation
  const handleCreateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoleName.trim()) {
      setNewRoleErrors({ name: 'El nombre del rol es requerido' })
      return
    }

    try {
      const newRole = await createRoleMutation.mutateAsync({
        name: newRoleName.trim(),
        permissions: DEFAULT_PERMISSIONS,
      })
      addToast({
        title: 'Rol creado con éxito',
        message: `El rol "${newRoleName.trim()}" ha sido creado. Ahora puedes configurar sus permisos.`,
        type: 'success',
      })
      setSelectedRoleId(newRole.id)
      setIsCreateRoleOpen(false)
      setNewRoleName('')
      setNewRoleErrors({})
      refetchRoles()
    } catch (err: any) {
      addToast({
        title: 'Error al crear rol',
        message: err?.message || 'No se pudo crear el rol',
        type: 'error',
      })
    }
  }

  // Permissions guarding
  const canView = hasPermission('security.view')
  const canEditRoles = hasPermission('users.edit') // users.edit manages user permissions

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
            No tienes los permisos necesarios para ver las configuraciones de seguridad o logs de auditoría. Por favor contacta al administrador.
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

  // Handle saving permissions
  const handleSavePermissions = async (updatedPermissions: IPermissions) => {
    if (!selectedRoleId) return

    try {
      await updateRoleMutation.mutateAsync({
        id: selectedRoleId,
        permissions: updatedPermissions,
      })
      addToast({
        title: 'Permisos actualizados',
        message: 'Los permisos del rol han sido actualizados con éxito.',
        type: 'success',
      })
      refetchRoles()
    } catch (err: any) {
      addToast({
        title: 'Error al actualizar',
        message: err?.message || 'No se pudieron actualizar los permisos del rol',
        type: 'error',
      })
    }
  }

  const selectedRole = roles?.find((r) => r.id === selectedRoleId)

  // Autoselect first role once roles are loaded
  if (roles && roles.length > 0 && !selectedRoleId) {
    setSelectedRoleId(roles[0].id)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-300">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Lock size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Seguridad & Auditoría</h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-0.5">
              Controla las directivas de seguridad y audita los cambios del sistema
            </p>
          </div>
        </div>

        {!canEditRoles && activeTab === 'permissions' && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-xs font-bold text-amber-700">
            <AlertCircle size={14} />
            Modo Solo Lectura
          </div>
        )}
      </div>

      {/* Segmented Horizontal Tabs Navigation */}
      <div className="flex overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex bg-slate-50 border border-slate-100 rounded-2xl p-1 shadow-inner gap-1 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 uppercase tracking-wider ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="mt-6">
        {activeTab === 'permissions' ? (
          <div className="space-y-6">
            {rolesLoading ? (
              <div className="flex items-center justify-center p-12 bg-white rounded-3xl border border-slate-100 shadow-sm min-h-[300px]">
                <Spinner size="lg" className="text-indigo-600 mb-4 animate-spin" />
              </div>
            ) : !roles || roles.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center text-slate-500">
                No hay roles disponibles
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl mx-auto">
                {/* Role selection dropdown */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <label htmlFor="role-select" className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                      Seleccionar Rol a Configurar
                    </label>
                    <p className="text-xs text-slate-500 font-medium">Los permisos se aplicarán a todos los usuarios asignados a este rol.</p>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <select
                      id="role-select"
                      value={selectedRoleId}
                      onChange={(e) => setSelectedRoleId(e.target.value)}
                      className="flex-1 md:flex-none px-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 focus:border-slate-200 rounded-xl text-sm outline-none font-semibold text-slate-700 cursor-pointer min-w-[200px]"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    {canEditRoles && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Plus size={16} />}
                        onClick={() => setIsCreateRoleOpen(true)}
                        className="font-bold shrink-0"
                      >
                        Crear Rol
                      </Button>
                    )}
                  </div>
                </div>

                {/* Permissions Editor */}
                {selectedRole && (
                  <motion.div
                    key={selectedRoleId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PermissionsEditor
                      initialPermissions={selectedRole.permissions}
                      onSave={handleSavePermissions}
                      readOnly={!canEditRoles}
                      isSaving={updateRoleMutation.isPending}
                      isSuperadmin={selectedRole.is_superadmin || selectedRole.isSuperadmin || selectedRole.name === 'Superadmin'}
                    />
                  </motion.div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <AuditLogsTable
              logs={auditLogs || []}
              period={auditPeriod}
              onPeriodChange={setAuditPeriod}
              canView={canView}
              isLoading={auditLoading}
            />
          </div>
        )}
      </div>

      {/* Create Role Modal */}
      <Modal
        isOpen={isCreateRoleOpen}
        onClose={() => {
          setIsCreateRoleOpen(false)
          setNewRoleName('')
          setNewRoleErrors({})
        }}
        title="Crear Nuevo Rol de Seguridad"
      >
        <form onSubmit={handleCreateRoleSubmit} data-testid="create-role-form" className="space-y-5">
          <Input
            label="Nombre del Rol"
            placeholder="Ej: Asistente Dental, Recepcionista"
            value={newRoleName}
            onChange={setNewRoleName}
            error={newRoleErrors.name}
            required
          />

          <p className="text-xs text-slate-400">
            * Al crear el rol, se inicializará con permisos vacíos. Podrás configurar sus permisos granulares inmediatamente después de crearlo.
          </p>

          <div className="flex justify-end pt-4 gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCreateRoleOpen(false)
                setNewRoleName('')
                setNewRoleErrors({})
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={createRoleMutation.isPending}
            >
              Crear Rol
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
