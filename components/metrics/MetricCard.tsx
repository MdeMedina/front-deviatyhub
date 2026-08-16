import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

export interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    direction: 'up' | 'down'
    positive: boolean
  }
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
}) => {
  // Determine trend styles based on positive and direction
  // positive: true → up is good, down is bad
  // positive: false → down is good, up is bad
  const isTrendPositive = trend
    ? (trend.direction === 'up' && trend.positive) ||
      (trend.direction === 'down' && !trend.positive)
    : false

  // Format trend string: e.g. "+12.4%" or "-5.2%"
  const trendText = trend
    ? `${trend.direction === 'up' ? '+' : '-'}${Math.abs(trend.value)}%`
    : ''

  // Format displayed value to handle 0 correctly
  const displayedValue = value !== undefined && value !== null ? value : ''

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="relative overflow-hidden bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px] group transition-all duration-300 hover:shadow-md hover:border-indigo-50"
    >
      {/* Decorative gradient background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/20 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-50/30 transition-all duration-300" />

      <div className="space-y-1">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {title}
        </h3>
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {displayedValue}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-2 border-t border-slate-50">
        <span className="text-xs font-semibold text-slate-400 leading-none">
          {subtitle || 'Sin datos del periodo anterior'}
        </span>

        {trend && (
          <div
            data-testid="trend-badge"
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border transition-all ${
              isTrendPositive
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                : 'bg-rose-50 text-rose-600 border-rose-100'
            }`}
          >
            {trend.direction === 'up' ? (
              <ArrowUpRight size={13} strokeWidth={2.5} />
            ) : (
              <ArrowDownRight size={13} strokeWidth={2.5} />
            )}
            <span>{trendText}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
