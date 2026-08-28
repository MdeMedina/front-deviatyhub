'use client'

import React, { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'
import { IAuditLog, AuditLogPeriod } from '@/lib/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Spinner } from '@/components/ui/Spinner'

export interface AuditLogsTableProps {
  logs: IAuditLog[]
  period: AuditLogPeriod
  onPeriodChange: (period: AuditLogPeriod) => void
  canView: boolean
  isLoading?: boolean
}

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

const AuditLogRow: React.FC<{ log: IAuditLog }> = ({ log }) => {
  const [expanded, setExpanded] = useState(false)
  const hasBefore = log.changes?.before !== null && log.changes?.before !== undefined
  const hasAfter  = log.changes?.after  !== null && log.changes?.after !== undefined

  return (
    <>
      <tr
        data-testid={`audit-row-${log.id}`}
        onClick={() => setExpanded((v) => !v)}
        style={{ cursor: 'pointer' }}
      >
        {/* User */}
        <td style={{ color: 'var(--ink)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--dim)' }}>
              {expanded ? <ChevronDown size={13} strokeWidth={1.75} /> : <ChevronRight size={13} strokeWidth={1.75} />}
            </span>
            <span data-testid={`log-user-${log.id}`}>
              {log.user_email || 'Sistema'}
            </span>
          </span>
        </td>

        {/* Action Badge */}
        <td>
          <span data-testid={`log-action-${log.id}`}>
            <span data-badge style={{ fontSize: '10.5px', padding: '2px 8px' }}>
              {log.action}
            </span>
          </span>
        </td>

        {/* Entity / Resource */}
        <td style={{ color: 'var(--ink-soft)' }}>
          <span data-testid={`log-entity-${log.id}`}>
            {log.entity || (log as any).resource || '—'}
          </span>
        </td>

        {/* Timestamp */}
        <td data-mono style={{ color: 'var(--muted)' }}>
          <span data-testid={`log-date-${log.id}`}>
            {formatDate(log.created_at)}
          </span>
        </td>
      </tr>

      {/* Expanded Diff Details */}
      {expanded && (
        <tr>
          <td colSpan={4} style={{ background: 'var(--card)', padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <div data-testid={`audit-detail-${log.id}`} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span data-lbl>Detalle de Modificación</span>
                {(log as any).ip_address && (
                  <span data-mono style={{ fontSize: '11px', color: 'var(--dim)' }}>
                    IP: {(log as any).ip_address}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span data-lbl style={{ color: 'var(--neg)' }}>Estado Anterior</span>
                  <pre data-testid={`log-before-${log.id}`} data-mono style={{ margin: 0, padding: '10px 12px', borderRadius: '6px', background: 'var(--surface)', border: '1px solid var(--line)', fontSize: '11px', color: 'var(--ink-soft)', maxHeight: '180px', overflowY: 'auto' }}>
                    {prettyJson(log.changes?.before || null)}
                  </pre>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span data-lbl style={{ color: 'var(--pos)' }}>Estado Posterior</span>
                  <pre data-testid={`log-after-${log.id}`} data-mono style={{ margin: 0, padding: '10px 12px', borderRadius: '6px', background: 'var(--surface)', border: '1px solid var(--line)', fontSize: '11px', color: 'var(--ink-soft)', maxHeight: '180px', overflowY: 'auto' }}>
                    {prettyJson(log.changes?.after || null)}
                  </pre>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export const AuditLogsTable: React.FC<AuditLogsTableProps> = ({
  logs,
  period,
  onPeriodChange,
  canView,
  isLoading = false,
}) => {
  if (!canView) {
    return (
      <div data-card data-testid="audit-no-permission" style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
          Acceso restringido
        </p>
        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--muted)' }}>
          No tienes permisos para ver los registros de auditoría del sistema.
        </p>
      </div>
    )
  }

  return (
    <div data-card>
      {/* Header & Filter Controls */}
      <div data-hd>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <h2>Logs de auditoría</h2>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            {logs.length} registros
          </span>
        </div>

        {/* Period Selector Tabs */}
        <div data-tabs>
          <button
            data-tab
            data-active={period === '7d'}
            data-testid="period-btn-7d"
            onClick={() => onPeriodChange('7d')}
          >
            Últimos 7 días
          </button>
          <button
            data-tab
            data-active={period === '30d'}
            data-testid="period-btn-30d"
            onClick={() => onPeriodChange('30d')}
          >
            Últimos 30 días
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '8px' }}>
          <Spinner size="md" />
          <span className="microlabel text-[10px]">Cargando logs de auditoría</span>
        </div>
      ) : logs.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '8px', textAlign: 'center' }}>
          <ShieldAlert size={24} style={{ color: 'var(--dim)' }} />
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>No hay eventos registrados en este período.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table data-tbl data-testid="audit-logs-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Entidad</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <AuditLogRow key={log.id} log={log} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
