import React from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

export interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down'
    positive: boolean
  }
  'data-testid'?: string
  testId?: string
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  description,
  icon,
  trend,
  'data-testid': dataTestId,
  testId
}) => {
  const actualTestId = dataTestId || testId
  const sub = subtitle || description

  const isTrendPositive = trend
    ? (trend.direction === 'up' && trend.positive) ||
      (trend.direction === 'down' && !trend.positive)
    : false

  const trendText = trend
    ? `${trend.direction === 'up' ? '+' : '-'}${Math.abs(trend.value)}%`
    : ''

  const displayedValue = value !== undefined && value !== null ? value : ''

  return (
    <div
      data-testid={actualTestId}
      style={{ background: 'var(--card)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}
    >
      <div className="flex items-center justify-between gap-2">
        <span data-lbl style={{ color: 'var(--ink-soft)' }}>{title}</span>
        {icon && <span className="text-[var(--dim)]">{icon}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '9px' }}>
        <span
          data-mono
          data-testid={actualTestId ? `${actualTestId}-value` : undefined}
          style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)' }}
        >
          {displayedValue}
        </span>
        {trend && (
          <span
            data-testid="trend-badge"
            className={`inline-flex items-center gap-0.5 font-mono text-[12.5px] font-medium px-1.5 py-0.5 rounded-[5px] border border-[var(--line)] bg-[var(--surface)] ${
              isTrendPositive ? 'text-[var(--pos)]' : 'text-[var(--neg)]'
            }`}
          >
            {trend.direction === 'up' ? (
              <ArrowUpRight size={12} />
            ) : (
              <ArrowDownRight size={12} />
            )}
            {trendText}
          </span>
        )}
      </div>

      {sub && <span style={{ fontSize: '13px', color: 'var(--dim)' }}>{sub}</span>}
    </div>
  )
}
