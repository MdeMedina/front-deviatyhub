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
} from 'lucide-react'
import { IPermissions } from '@/lib/types'
import { Button } from '@/components/ui/Button'

// ==========================================
// Tipos internos
// ==========================================

type PermissionKey = keyof IPermissions

type PermissionColumnKey = 'view' | 'edit' | 'create' | 'delete' | 'takeover'

interface ModuleConfig {
  key: PermissionKey
  label: string
  icon: React.ElementType
  columns: PermissionColumnKey[]
}

// ==========================================
// Configuración de módulos
// ==========================================

const MODULE_CONFIGS: ModuleConfig[] = [
  { key: 'conversations',  label: 'Conversaciones',    icon: MessageSquare, columns: ['view', 'takeover'] },
  { key: 'agenda',         label: 'Agenda',             icon: CalendarDays,  columns: ['view', 'edit'] },
  { key: 'knowledge_base', label: 'Base de Conocimiento', icon: BookOpen,   columns: ['view', 'edit'] },
  { key: 'agent_actions',  label: 'Acciones del Agente', icon: Bot,          columns: ['view', 'edit'] },
  { key: 'clinic_config',  label: 'Configuración',      icon: Settings,      columns: ['view', 'edit'] },
  { key: 'users',          label: 'Usuarios',           icon: Users,         columns: ['view', 'edit', 'create', 'delete'] },
  { key: 'integrations',   label: 'Integraciones',      icon: Plug,          columns: ['view'] },
  { key: 'metrics',        label: 'Métricas',           icon: BarChart2,     columns: ['view'] },
  { key: 'simulator',      label: 'Simulador',          icon: FlaskConical,  columns: ['view'] },
  { key: 'security',       label: 'Seguridad',          icon: Shield,        columns: ['view'] },
]

// Columns that count as "write" for blocking view un-check
const WRITE_COLUMNS: PermissionColumnKey[] = ['edit', 'create', 'delete', 'takeover']

// Column display labels
const COLUMN_LABELS: Record<PermissionColumnKey, string> = {
  view:     'Ver',
  edit:     'Editar',
  create:   'Crear',
  delete:   'Eliminar',
  takeover: 'Tomar control',
}

// ==========================================
// Props
// ==========================================

export interface PermissionsEditorProps {
  /** Permisos actuales del rol */
  initialPermissions: IPermissions
  /** Callback al guardar: recibe el objeto de permisos actualizado */
  onSave: (permissions: IPermissions) => void
  /** Si true, todos los checkboxes son de solo lectura */
  readOnly?: boolean
  /** Si true, muestra el spinner en el botón guardar */
  isSaving?: boolean
  /** Si true, indica que es un rol de superadministrador */
  isSuperadmin?: boolean
}

// ==========================================
// Componente
// ==========================================

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



  /** Devuelve true si el módulo tiene algún permiso de escritura activo */
  const hasActiveWritePermission = useCallback(
    (moduleKey: PermissionKey): boolean => {
      const modulePerms = (permissions?.[moduleKey] || {}) as Record<string, boolean>
      return WRITE_COLUMNS.some((col) => modulePerms[col] === true)
    },
    [permissions]
  )

  const handleToggle = useCallback(
    (moduleKey: PermissionKey, column: PermissionColumnKey) => {
      if (readOnly || isSuperadmin) return

      setPermissions((prev) => {
        const updated = JSON.parse(JSON.stringify(prev || {})) as IPermissions
        if (!updated[moduleKey]) {
          updated[moduleKey] = {} as any
        }
        const modulePerms = updated[moduleKey] as Record<string, boolean>
        const currentValue = modulePerms[column]

        if (column === 'view') {
          // "view" solo se puede desactivar si NO hay permisos de escritura activos
          const hasWrite = WRITE_COLUMNS.some((col) => modulePerms[col] === true)
          if (currentValue && hasWrite) return prev // bloqueado
          modulePerms['view'] = !currentValue
        } else {
          // Activar un permiso de escritura activa automáticamente "view"
          const newValue = !currentValue
          modulePerms[column] = newValue
          if (newValue) {
            modulePerms['view'] = true
          }
        }

        return updated
      })
    },
    [readOnly, isSuperadmin]
  )

  const handleSave = () => {
    if (!readOnly && !isSuperadmin) onSave(permissions)
  }

  // Todas las columnas únicas en el orden de aparición
  const allColumns: PermissionColumnKey[] = ['view', 'edit', 'create', 'delete', 'takeover']

  const isReadOnly = readOnly || isSuperadmin

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">Editor de Permisos</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isSuperadmin
              ? 'El rol de Superadmin tiene privilegios totales en la plataforma.'
              : readOnly
              ? 'Solo lectura — sin permiso de edición de usuarios'
              : 'Configura el acceso granular por módulo'}
          </p>
        </div>
        {isSuperadmin ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-2.5 py-0.5">
            <Shield size={11} className="text-indigo-500" />
            Acceso Total
          </span>
        ) : readOnly ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
            <Shield size={11} />
            Solo lectura
          </span>
        ) : null}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-52">
                Módulo
              </th>
              {allColumns.map((col) => (
                <th
                  key={col}
                  className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  {COLUMN_LABELS[col]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {MODULE_CONFIGS.map((mod) => {
              const modulePerms = (permissions?.[mod.key] || {}) as Record<string, boolean>
              const ModIcon = mod.icon

              return (
                <tr
                  key={mod.key}
                  className="hover:bg-slate-50/40 transition-colors duration-100"
                >
                  {/* Module label */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                        <ModIcon size={14} className="text-indigo-500" />
                      </div>
                      <span className="font-medium text-slate-700 text-[13px]">{mod.label}</span>
                    </div>
                  </td>

                  {/* Permission checkboxes */}
                  {allColumns.map((col) => {
                    const isSupported = mod.columns.includes(col)
                    if (!isSupported) {
                      return (
                        <td key={col} className="px-4 py-3.5 text-center">
                          <span className="text-slate-200 text-lg select-none">—</span>
                        </td>
                      )
                    }

                    const checked = isSuperadmin ? true : modulePerms[col] === true
                    const isViewBlocked =
                      !isSuperadmin && col === 'view' && checked && hasActiveWritePermission(mod.key)
                    
                    const inputId = `checkbox-${mod.key}-${col}`
                    const isDisabled = isReadOnly || isViewBlocked

                    return (
                      <td key={col} className="px-4 py-3.5 text-center">
                        <div className="inline-flex items-center justify-center">
                          <input
                            id={inputId}
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggle(mod.key, col)}
                            disabled={isDisabled}
                            data-testid={`checkbox-${mod.key}-${col}`}
                            className="sr-only"
                          />
                          <label
                            htmlFor={inputId}
                            data-testid={`perm-${mod.key}-${col}`}
                            className={`w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center transition-all duration-150 group ${
                              isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                            } ${
                              checked
                                ? 'bg-indigo-600 border-indigo-600 shadow-sm shadow-indigo-200'
                                : 'bg-white border-slate-300 group-hover:border-indigo-300'
                            }`}
                            title={
                              isViewBlocked
                                ? 'Desactiva primero los permisos de escritura'
                                : isSuperadmin
                                ? 'Superadmin tiene acceso total'
                                : readOnly
                                ? 'Sin permiso de edición'
                                : undefined
                            }
                          >
                            {checked && (
                              <svg
                                viewBox="0 0 10 8"
                                className="w-2.5 h-2 text-white fill-none stroke-current stroke-[2]"
                              >
                                <path d="M1 4l2.5 3L9 1" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </label>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {!isReadOnly && (
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <Button
            onClick={handleSave}
            loading={isSaving}
            disabled={isSaving}
            size="sm"
            icon={<Save size={14} />}
          >
            Guardar cambios
          </Button>
        </div>
      )}
    </div>
  )
}
