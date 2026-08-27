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
      className="p-4 bg-[var(--card)] flex flex-col justify-between min-h-[120px]"
    >
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="microlabel text-[9.5px]">
            {title}
          </h3>
          {icon && <span className="text-[var(--dim)]">{icon}</span>}
        </div>
        <p className="metric-number text-2xl" data-testid={actualTestId ? `${actualTestId}-value` : undefined}>
          {displayedValue}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[var(--line-soft)] text-[11px] text-[var(--muted)]">
        <span>{sub}</span>
        {trend && (
          <span
            data-testid="trend-badge"
            className={`inline-flex items-center gap-0.5 font-mono text-[10px] font-medium px-1.5 py-0.5 rounded-[4px] border border-[var(--line)] bg-[var(--surface)] ${
              isTrendPositive ? 'text-[var(--pos)]' : 'text-[var(--neg)]'
            }`}
          >
            {trend.direction === 'up' ? (
              <ArrowUpRight size={11} />
            ) : (
              <ArrowDownRight size={11} />
            )}
            {trendText}
          </span>
        )}
      </div>
    </div>
  )
}
