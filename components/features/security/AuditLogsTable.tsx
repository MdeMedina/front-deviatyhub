'use client'

import React, { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Clock,
  User,
  Tag,
  Zap,
} from 'lucide-react'
import { IAuditLog, AuditLogPeriod } from '@/lib/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// ==========================================
// Props
// ==========================================

export interface AuditLogsTableProps {
  /** Lista de logs del backend */
  logs: IAuditLog[]
  /** Período activo de filtrado */
  period: AuditLogPeriod
  /** Callback al cambiar el período — dispara un nuevo fetch en el componente padre */
  onPeriodChange: (period: AuditLogPeriod) => void
  /** Si true, el componente no es visible (sin permiso security.view) */
  canView: boolean
  /** Estado de carga */
  isLoading?: boolean
}

// ==========================================
// Helpers
// ==========================================

const ACTION_STYLES: Record<string, { bg: string; text: string }> = {
  CREATE: { bg: 'bg-emerald-50',   text: 'text-emerald-700' },
  UPDATE: { bg: 'bg-blue-50',      text: 'text-blue-700' },
  DELETE: { bg: 'bg-rose-50',      text: 'text-rose-700' },
  LOGIN:  { bg: 'bg-violet-50',    text: 'text-violet-700' },
}

const getActionStyle = (action: string) =>
  ACTION_STYLES[action.toUpperCase()] ?? { bg: 'bg-slate-100', text: 'text-slate-600' }

const formatDate = (iso: string): string => {
  try {
    return format(new Date(iso), "dd MMM yyyy, HH:mm", { locale: es })
  } catch {
    return iso
  }
}

const prettyJson = (obj: Record<string, unknown> | null): string => {
  if (!obj) return '—'
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}

// ==========================================
// Sub-componente: fila expandible
// ==========================================

const AuditLogRow: React.FC<{ log: IAuditLog }> = ({ log }) => {
  const [expanded, setExpanded] = useState(false)
  const actionStyle = getActionStyle(log.action)
  const hasBefore = log.changes.before !== null
  const hasAfter  = log.changes.after  !== null

  return (
    <>
      <tr
        data-testid={`audit-row-${log.id}`}
        className="hover:bg-slate-50/60 transition-colors duration-100 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Expand chevron */}
        <td className="pl-5 pr-2 py-3.5 w-8">
          <span className="text-slate-400">
            {expanded
              ? <ChevronDown size={14} />
              : <ChevronRight size={14} />}
          </span>
        </td>

        {/* User */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <User size={11} className="text-indigo-500" />
            </div>
            <span
              data-testid={`log-user-${log.id}`}
              className="text-[13px] font-medium text-slate-700 truncate max-w-[180px]"
            >
              {log.user_email}
            </span>
          </div>
        </td>

        {/* Action */}
        <td className="px-4 py-3.5">
          <span
            data-testid={`log-action-${log.id}`}
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${actionStyle.bg} ${actionStyle.text}`}
          >
            <Zap size={9} />
            {log.action}
          </span>
        </td>

        {/* Entity */}
        <td className="px-4 py-3.5">
          <span
            data-testid={`log-entity-${log.id}`}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
          >
            <Tag size={10} />
            {log.entity}
          </span>
        </td>

        {/* Date */}
        <td className="px-4 py-3.5">
          <span
            data-testid={`log-date-${log.id}`}
            className="flex items-center gap-1 text-[12px] text-slate-400 font-medium"
          >
            <Clock size={11} />
            {formatDate(log.created_at)}
          </span>
        </td>
      </tr>

      {/* Expanded: before / after */}
      {expanded && (
        <tr data-testid={`audit-detail-${log.id}`}>
          <td colSpan={5} className="px-6 pb-4 pt-0 bg-slate-50/80">
            <div className="grid grid-cols-2 gap-3 border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
              {/* Before */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Antes
                </p>
                <pre
                  data-testid={`log-before-${log.id}`}
                  className="text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-3 overflow-auto max-h-40 whitespace-pre-wrap"
                >
                  {hasBefore ? prettyJson(log.changes.before) : '—'}
                </pre>
              </div>

              {/* After */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Después
                </p>
                <pre
                  data-testid={`log-after-${log.id}`}
                  className="text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-3 overflow-auto max-h-40 whitespace-pre-wrap"
                >
                  {hasAfter ? prettyJson(log.changes.after) : '—'}
                </pre>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ==========================================
// Componente principal
// ==========================================

const PERIODS: { label: string; value: AuditLogPeriod }[] = [
  { label: 'Últimos 7 días',  value: '7d' },
  { label: 'Últimos 30 días', value: '30d' },
]

export const AuditLogsTable: React.FC<AuditLogsTableProps> = ({
  logs,
  period,
  onPeriodChange,
  canView,
  isLoading = false,
}) => {
  // Sin permiso security.view — no renderiza la tabla
  if (!canView) {
    return (
      <div
        data-testid="audit-no-permission"
        className="flex flex-col items-center justify-center gap-3 py-20 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center">
          <ShieldAlert size={26} className="text-rose-400" />
        </div>
        <p className="text-sm font-semibold text-slate-600">
          Acceso restringido
        </p>
        <p className="text-xs text-slate-400 max-w-xs">
          No tienes permiso para ver los logs de auditoría. Contacta a un Superadmin.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header con filtros de período */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-white">
        <div>
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">Logs de Auditoría</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isLoading ? 'Cargando...' : `${logs.length} registro${logs.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Period filter tabs */}
        <div
          data-testid="period-filter"
          className="flex items-center gap-1 bg-slate-100 rounded-xl p-1"
        >
          {PERIODS.map(({ label, value }) => (
            <button
              key={value}
              data-testid={`period-btn-${value}`}
              onClick={() => onPeriodChange(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                period === value
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <ShieldAlert size={28} className="text-slate-300" />
          <p className="text-sm text-slate-400 font-medium">Sin registros para este período</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="pl-5 pr-2 py-3 w-8" />
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Acción
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Entidad
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.map((log) => (
              <AuditLogRow key={log.id} log={log} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
