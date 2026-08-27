'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Shield, History, ArrowRight, Plus, X } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useUIStore } from '@/lib/stores/ui.store'
import { useRoles, useUpdateRole, useCreateRole } from '@/lib/api/hooks/use-users-roles'
import { useAuditLogs } from '@/lib/api/hooks/use-audit-logs'
import { PermissionsEditor } from '@/components/features/security/PermissionsEditor'
import { AuditLogsTable } from '@/components/features/security/AuditLogsTable'
import { Spinner } from '@/components/ui/Spinner'
import { AuditLogPeriod, IPermissions } from '@/lib/types'

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
  const [activeTab, setActiveTab] = useState<'permissions' | 'audit'>('permissions')

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
  const canEditRoles = hasPermission('users.edit')

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[var(--card)] border border-[var(--line)] rounded-[10px] min-h-[380px] max-w-md mx-auto text-center shadow-[0_1px_2px_rgba(20,20,25,0.05)]">
        <div className="w-11 h-11 border border-[var(--line)] rounded-[7px] bg-[var(--head)] flex items-center justify-center text-[var(--neg)] mb-3">
          <AlertCircle size={22} />
        </div>
        <h2 className="text-[18px] font-semibold text-[var(--ink)] mb-1.5">Acceso Denegado</h2>
        <p className="text-[13px] text-[var(--muted)] leading-relaxed mb-5">
          No tienes los permisos necesarios para gestionar directivas de seguridad ni auditar logs. Por favor contacta al administrador.
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

  // Selected role object
  const activeRole = roles?.find((r) => r.id === selectedRoleId) || roles?.[0]
  const currentRoleId = activeRole?.id || ''
  const isSuperadmin = activeRole?.name?.toLowerCase() === 'superadmin'

  const handleSavePermissions = (newPermissions: IPermissions) => {
    if (!currentRoleId) return

    updateRoleMutation.mutate(
      {
        id: currentRoleId,
        permissions: newPermissions,
      },
      {
        onSuccess: () => {
          addToast({
            title: 'Permisos actualizados',
            message: `Los permisos del rol "${activeRole?.name}" se han guardado exitosamente.`,
            type: 'success',
          })
          refetchRoles()
        },
        onError: (err: any) => {
          addToast({
            title: 'Error al actualizar permisos',
            message: err?.message || 'Ocurrió un error al guardar los permisos.',
            type: 'error',
          })
        },
      }
    )
  }

  return (
    <div className="flex flex-col gap-5 max-w-[1340px] mx-auto">
      {/* Header Bar */}
      <div className="flex items-end justify-between gap-5 flex-wrap pb-4 border-b border-[var(--line)]">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-semibold tracking-[-0.028em] text-[var(--ink)] leading-tight">
            Seguridad & Auditoría
          </h1>
          <p className="text-[13.5px] text-[var(--muted)]">
            Controla las directivas de seguridad y audita los cambios del sistema.
          </p>
        </div>

        {/* View Tabs Selector */}
        <div data-tabs>
          <button
            data-tab
            data-active={activeTab === 'permissions'}
            onClick={() => setActiveTab('permissions')}
          >
            <Shield size={14} strokeWidth={1.75} />
            Roles y Permisos
          </button>
          <button
            data-tab
            data-active={activeTab === 'audit'}
            onClick={() => setActiveTab('audit')}
          >
            <History size={14} strokeWidth={1.75} />
            Logs de auditoría
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'permissions' ? (
        <div className="flex flex-col gap-5">
          {rolesLoading ? (
            <div data-card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '8px' }}>
              <Spinner size="md" />
              <span className="microlabel text-[10px]">Cargando roles y permisos</span>
            </div>
          ) : (
            <div data-card>
              {/* Header Selector */}
              <div data-hd>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <h2>Editor de Permisos</h2>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    Los permisos se aplican a todos los usuarios asignados a este rol.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '9px', alignItems: 'center' }}>
                  {!canEditRoles && (
                    <span data-badge>Modo Solo Lectura</span>
                  )}

                  <label htmlFor="role-selector" className="sr-only">Seleccionar Rol a Configurar</label>
                  <select
                    id="role-selector"
                    data-inp
                    aria-label="Seleccionar rol"
                    value={currentRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    style={{ width: '190px', height: '32px' }}
                  >
                    {roles?.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>

                  {canEditRoles && (
                    <button
                      data-btn="primary"
                      onClick={() => setIsCreateRoleOpen(true)}
                    >
                      <Plus size={14} strokeWidth={1.9} />
                      Crear rol
                    </button>
                  )}
                </div>
              </div>

              {/* Permissions Matrix */}
              {activeRole && (
                <PermissionsEditor
                  initialPermissions={activeRole.permissions || DEFAULT_PERMISSIONS}
                  onSave={handleSavePermissions}
                  readOnly={!canEditRoles}
                  isSaving={updateRoleMutation.isPending}
                  isSuperadmin={isSuperadmin}
                />
              )}
            </div>
          )}
        </div>
      ) : (
        <AuditLogsTable
          logs={auditLogs || []}
          period={auditPeriod}
          onPeriodChange={setAuditPeriod}
          canView={canView}
          isLoading={auditLoading}
        />
      )}

      {/* Create Role Modal */}
      {isCreateRoleOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center', padding: '24px' }}>
          <div onClick={() => setIsCreateRoleOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(33,33,33,.45)', backdropFilter: 'blur(2px)' }} />
          <div role="dialog" aria-modal="true" data-card style={{ position: 'relative', width: '100%', maxWidth: '420px', boxShadow: '0 24px 60px rgba(0,0,0,.18)' }}>
            <div data-hd>
              <h2>Crear Nuevo Rol de Seguridad</h2>
              <button data-btn onClick={() => setIsCreateRoleOpen(false)} style={{ width: '28px', height: '28px', padding: 0, borderColor: 'transparent', background: 'none' }}>
                <X size={15} strokeWidth={1.75} />
              </button>
            </div>
            <form data-testid="create-role-form" onSubmit={handleCreateRoleSubmit}>
              <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div data-field>
                  <label htmlFor="new-role-name">Nombre del rol *</label>
                  <input
                    id="new-role-name"
                    data-inp
                    type="text"
                    placeholder="Ej: Asistente Dental, Recepcionista"
                    value={newRoleName}
                    onChange={(e) => {
                      setNewRoleName(e.target.value)
                      setNewRoleErrors({})
                    }}
                    required
                  />
                  {newRoleErrors.name && (
                    <span style={{ fontSize: '11px', color: 'var(--neg)' }}>{newRoleErrors.name}</span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.55, color: 'var(--muted)' }}>
                  El nuevo rol se creará con los permisos mínimos por defecto. Podrás configurarlo inmediatamente.
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '9px', padding: '13px 18px', borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
                <button data-btn type="button" onClick={() => setIsCreateRoleOpen(false)}>Cancelar</button>
                <button data-btn="primary" type="submit" disabled={createRoleMutation.isPending}>Crear rol</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
