'use client'

import React, { useState, useCallback, useEffect } from 'react'
import {
  BookOpen,
  Bot,
  FlaskConical,
  BarChart2,
  Plug,
  Shield,
  Users,
  Settings,
  MessageSquare,
  CalendarDays,
  Save,
  RotateCcw,
  Check
} from 'lucide-react'
import { IPermissions } from '@/lib/types'

type PermissionKey = keyof IPermissions
type PermissionColumnKey = 'view' | 'edit' | 'create' | 'delete' | 'takeover'

interface ModuleConfig {
  key: PermissionKey
  label: string
  icon: React.ElementType
  columns: PermissionColumnKey[]
}

const MODULE_CONFIGS: ModuleConfig[] = [
  { key: 'conversations',  label: 'Conversaciones',      icon: MessageSquare, columns: ['view', 'takeover'] },
  { key: 'agenda',         label: 'Agenda',               icon: CalendarDays,  columns: ['view', 'edit'] },
  { key: 'knowledge_base', label: 'Base de Conocimiento', icon: BookOpen,      columns: ['view', 'edit'] },
  { key: 'agent_actions',  label: 'Acciones del Agente',  icon: Bot,           columns: ['view', 'edit'] },
  { key: 'clinic_config',  label: 'Configuración',        icon: Settings,      columns: ['view', 'edit'] },
  { key: 'users',          label: 'Usuarios',             icon: Users,         columns: ['view', 'edit', 'create', 'delete'] },
  { key: 'integrations',   label: 'Integraciones',        icon: Plug,          columns: ['view'] },
  { key: 'metrics',        label: 'Métricas',             icon: BarChart2,     columns: ['view'] },
  { key: 'simulator',      label: 'Simulador',            icon: FlaskConical,  columns: ['view'] },
  { key: 'security',       label: 'Seguridad',            icon: Shield,        columns: ['view'] },
]

const WRITE_COLUMNS: PermissionColumnKey[] = ['edit', 'create', 'delete', 'takeover']

export interface PermissionsEditorProps {
  initialPermissions: IPermissions
  onSave: (permissions: IPermissions) => void
  readOnly?: boolean
  isSaving?: boolean
  isSuperadmin?: boolean
}

export const PermissionsEditor: React.FC<PermissionsEditorProps> = ({
  initialPermissions,
  onSave,
  readOnly = false,
  isSaving = false,
  isSuperadmin = false,
}) => {
  const [permissions, setPermissions] = useState<IPermissions>(() =>
    JSON.parse(JSON.stringify(initialPermissions || {}))
  )

  useEffect(() => {
    setPermissions(JSON.parse(JSON.stringify(initialPermissions || {})))
  }, [initialPermissions])

  const hasActiveWritePermission = useCallback(
    (moduleKey: PermissionKey): boolean => {
      const modulePerms = permissions[moduleKey] as Record<string, boolean> | undefined
      if (!modulePerms) return false
      return WRITE_COLUMNS.some((col) => modulePerms[col] === true)
    },
    [permissions]
  )

  const handleCheckboxChange = (
    moduleKey: PermissionKey,
    columnKey: PermissionColumnKey,
    checked: boolean
  ) => {
    if (readOnly || isSuperadmin) return

    setPermissions((prev) => {
      const updated = JSON.parse(JSON.stringify(prev))
      if (!updated[moduleKey]) {
        updated[moduleKey] = {}
      }

      if (columnKey === 'view' && !checked) {
        if (hasActiveWritePermission(moduleKey)) {
          return prev
        }
      }

      if (WRITE_COLUMNS.includes(columnKey) && checked) {
        updated[moduleKey].view = true
      }

      updated[moduleKey][columnKey] = checked
      return updated
    })
  }

  const handleReset = () => {
    setPermissions(JSON.parse(JSON.stringify(initialPermissions || {})))
  }

  const handleSave = () => {
    onSave(permissions)
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      {isSuperadmin && (
        <div style={{ padding: '8px 18px', background: 'var(--surface)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span data-badge>Acceso Total</span>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>El rol Superadmin tiene todos los permisos activos por defecto.</span>
        </div>
      )}

      {readOnly && !isSuperadmin && (
        <div style={{ padding: '8px 18px', background: 'var(--surface)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span data-badge>Solo lectura</span>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>No tienes permisos para editar los roles.</span>
        </div>
      )}

      <table data-tbl>
        <thead>
          <tr>
            <th>Módulo</th>
            <th>Ver</th>
            <th>Editar</th>
            <th>Crear</th>
            <th>Eliminar</th>
          </tr>
        </thead>
        <tbody>
          {MODULE_CONFIGS.map((module) => {
            const modulePerms = (permissions[module.key] || {}) as Record<string, boolean>
            const isViewBlocked = !readOnly && !isSuperadmin && hasActiveWritePermission(module.key)

            const isViewChecked = isSuperadmin || !!modulePerms.view
            const isEditChecked = isSuperadmin || !!modulePerms.edit
            const isTakeoverChecked = isSuperadmin || !!modulePerms.takeover
            const isCreateChecked = isSuperadmin || !!modulePerms.create
            const isDeleteChecked = isSuperadmin || !!modulePerms.delete

            return (
              <tr key={module.key}>
                <td style={{ color: 'var(--ink)', fontWeight: 500 }}>
                  {module.label}
                </td>

                {/* View Column */}
                <td>
                  <label
                    data-testid={`perm-${module.key}-view`}
                    style={{
                      display: 'inline-grid',
                      placeItems: 'center',
                      width: '18px',
                      height: '18px',
                      borderRadius: '5px',
                      border: `1px solid ${isViewChecked ? 'var(--blue)' : 'var(--line)'}`,
                      background: isViewChecked ? 'var(--blue)' : 'var(--card)',
                      color: 'var(--bg)',
                      cursor: readOnly || isSuperadmin || isViewBlocked ? 'not-allowed' : 'pointer',
                      opacity: isViewBlocked ? 0.7 : 1,
                    }}
                    title={isViewBlocked ? 'No se puede desmarcar: hay permisos de escritura activos' : undefined}
                  >
                    <input
                      type="checkbox"
                      data-testid={`checkbox-${module.key}-view`}
                      checked={isViewChecked}
                      disabled={readOnly || isSuperadmin || isViewBlocked}
                      onChange={(e) => handleCheckboxChange(module.key, 'view', e.target.checked)}
                      className="sr-only"
                    />
                    {isViewChecked && <Check size={12} strokeWidth={2.5} />}
                  </label>
                </td>

                {/* Edit / Takeover Column */}
                <td>
                  {module.columns.includes('edit') ? (
                    <label
                      data-testid={`perm-${module.key}-edit`}
                      style={{
                        display: 'inline-grid',
                        placeItems: 'center',
                        width: '18px',
                        height: '18px',
                        borderRadius: '5px',
                        border: `1px solid ${isEditChecked ? 'var(--blue)' : 'var(--line)'}`,
                        background: isEditChecked ? 'var(--blue)' : 'var(--card)',
                        color: 'var(--bg)',
                        cursor: readOnly || isSuperadmin ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        data-testid={`checkbox-${module.key}-edit`}
                        checked={isEditChecked}
                        disabled={readOnly || isSuperadmin}
                        onChange={(e) => handleCheckboxChange(module.key, 'edit', e.target.checked)}
                        className="sr-only"
                      />
                      {isEditChecked && <Check size={12} strokeWidth={2.5} />}
                    </label>
                  ) : module.columns.includes('takeover') ? (
                    <label
                      data-testid={`perm-${module.key}-takeover`}
                      style={{
                        display: 'inline-grid',
                        placeItems: 'center',
                        width: '18px',
                        height: '18px',
                        borderRadius: '5px',
                        border: `1px solid ${isTakeoverChecked ? 'var(--blue)' : 'var(--line)'}`,
                        background: isTakeoverChecked ? 'var(--blue)' : 'var(--card)',
                        color: 'var(--bg)',
                        cursor: readOnly || isSuperadmin ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        data-testid={`checkbox-${module.key}-takeover`}
                        checked={isTakeoverChecked}
                        disabled={readOnly || isSuperadmin}
                        onChange={(e) => handleCheckboxChange(module.key, 'takeover', e.target.checked)}
                        className="sr-only"
                      />
                      {isTakeoverChecked && <Check size={12} strokeWidth={2.5} />}
                    </label>
                  ) : (
                    <span aria-hidden="true" />

                  )}
                </td>

                {/* Create Column */}
                <td>
                  {module.columns.includes('create') ? (
                    <label
                      data-testid={`perm-${module.key}-create`}
                      style={{
                        display: 'inline-grid',
                        placeItems: 'center',
                        width: '18px',
                        height: '18px',
                        borderRadius: '5px',
                        border: `1px solid ${isCreateChecked ? 'var(--blue)' : 'var(--line)'}`,
                        background: isCreateChecked ? 'var(--blue)' : 'var(--card)',
                        color: 'var(--bg)',
                        cursor: readOnly || isSuperadmin ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        data-testid={`checkbox-${module.key}-create`}
                        checked={isCreateChecked}
                        disabled={readOnly || isSuperadmin}
                        onChange={(e) => handleCheckboxChange(module.key, 'create', e.target.checked)}
                        className="sr-only"
                      />
                      {isCreateChecked && <Check size={12} strokeWidth={2.5} />}
                    </label>
                  ) : (
                    <span aria-hidden="true" />

                  )}
                </td>

                {/* Delete Column */}
                <td>
                  {module.columns.includes('delete') ? (
                    <label
                      data-testid={`perm-${module.key}-delete`}
                      style={{
                        display: 'inline-grid',
                        placeItems: 'center',
                        width: '18px',
                        height: '18px',
                        borderRadius: '5px',
                        border: `1px solid ${isDeleteChecked ? 'var(--blue)' : 'var(--line)'}`,
                        background: isDeleteChecked ? 'var(--blue)' : 'var(--card)',
                        color: 'var(--bg)',
                        cursor: readOnly || isSuperadmin ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        data-testid={`checkbox-${module.key}-delete`}
                        checked={isDeleteChecked}
                        disabled={readOnly || isSuperadmin}
                        onChange={(e) => handleCheckboxChange(module.key, 'delete', e.target.checked)}
                        className="sr-only"
                      />
                      {isDeleteChecked && <Check size={12} strokeWidth={2.5} />}
                    </label>
                  ) : (
                    <span aria-hidden="true" />

                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {!readOnly && !isSuperadmin && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '9px', padding: '13px 18px', borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
          <button
            data-btn
            type="button"
            data-testid="btn-reset-perms"
            onClick={handleReset}
            disabled={isSaving}
          >
            <RotateCcw size={13} strokeWidth={1.75} />
            Restablecer
          </button>
          <button
            data-btn="primary"
            type="button"
            data-testid="btn-save-perms"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save size={14} strokeWidth={1.75} />
            Guardar cambios
          </button>
        </div>
      )}
    </div>
  )
}
